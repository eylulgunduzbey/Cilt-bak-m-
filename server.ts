import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '' || apiKey.length < 10) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory cache for Open Beauty Facts to improve speed and respect rate limits
const obfCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

// 1. Open Beauty Facts Product Search Proxy
app.get('/api/products/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  const page = parseInt(req.query.page as string || '1', 10);
  const pageSize = parseInt(req.query.pageSize as string || '20', 10);

  if (!query) {
    return res.json({ count: 0, products: [] });
  }

  const cacheKey = `search:${query.toLowerCase()}:${page}:${pageSize}`;
  const cached = obfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const obfUrl = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`;
    const response = await fetch(obfUrl, {
      headers: {
        'User-Agent': 'SkinMatch - Intelligent Skincare Analysis - web applet',
      },
    });

    if (!response.ok) {
      throw new Error(`Open Beauty Facts responded with status ${response.status}`);
    }

    const data = await response.json();
    const cleanProducts = (data.products || []).map((p: any) => formatProduct(p));

    const result = {
      count: data.count || cleanProducts.length,
      page,
      pageSize,
      products: cleanProducts,
    };

    obfCache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (error: any) {
    console.error('Error searching Open Beauty Facts:', error);
    res.status(500).json({
      error: 'Open Beauty Facts araması sırasında bir hata oluştu.',
      details: error.message,
    });
  }
});

// 2. Open Beauty Facts Barcode Lookup
app.get('/api/products/barcode/:barcode', async (req, res) => {
  const barcode = (req.params.barcode || '').trim().replace(/[^0-9]/g, '');

  if (!barcode) {
    return res.status(400).json({ error: 'Geçersiz barkod numarası.' });
  }

  const cacheKey = `barcode:${barcode}`;
  const cached = obfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const obfUrl = `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`;
    const response = await fetch(obfUrl, {
      headers: {
        'User-Agent': 'SkinMatch - Intelligent Skincare Analysis - web applet',
      },
    });

    if (!response.ok) {
      throw new Error(`Open Beauty Facts HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 1 && data.product) {
      const cleanProduct = formatProduct(data.product);
      obfCache.set(cacheKey, { data: cleanProduct, timestamp: Date.now() });
      return res.json(cleanProduct);
    } else {
      return res.status(404).json({
        found: false,
        error: 'Bu barkoda ait ürün Open Beauty Facts veritabanında bulunamadı.',
        barcode,
      });
    }
  } catch (error: any) {
    console.error('Error fetching barcode from Open Beauty Facts:', error);
    res.status(500).json({
      error: 'Barkod sorgulaması sırasında bir hata oluştu.',
      details: error.message,
    });
  }
});

// Helper to format Open Beauty Facts raw product
function formatProduct(p: any) {
  const name = p.product_name_tr || p.product_name || p.product_name_en || p.generic_name || 'İsimsiz Ürün';
  const brand = p.brands || p.brand_owner || 'Bilinmeyen Marka';
  const rawIngredients = p.ingredients_text_tr || p.ingredients_text || p.ingredients_text_en || '';
  const cleanIngredients = rawIngredients ? rawIngredients.replace(/_/g, '').trim() : '';

  return {
    barcode: p.code || p.id || '',
    name,
    brand,
    imageUrl: p.image_url || p.image_front_url || p.image_small_url || '',
    ingredientsText: cleanIngredients,
    hasIngredients: Boolean(cleanIngredients && cleanIngredients.length > 5),
    inciTags: p.ingredients_tags || [],
    analysisTags: p.ingredients_analysis_tags || [],
    categories: p.categories || p.categories_tags?.join(', ') || 'Cilt Bakımı',
    quantity: p.quantity || '',
    packaging: p.packaging || '',
    origins: p.origins || '',
  };
}

// 3. Fallback Heuristic Science-Backed Skincare Analyzer
function heuristicAnalysis(product: any, profile: any) {
  const ingredients = (product.ingredientsText || '').toLowerCase();
  const skinType = (profile.skinType || 'normal').toLowerCase();
  const primaryNeed = (profile.primaryNeed || '').toLowerCase();
  const problems = (profile.problems || []).map((p: string) => p.toLowerCase());
  const avoided = (profile.avoidedIngredients || []).map((a: string) => a.toLowerCase());
  const allergies = (profile.allergies || '').toLowerCase();

  const INGREDIENT_KNOWLEDGE_BASE: Record<string, { func: string; cat: string; desc: string }> = {
    'glycerin': { func: 'Yüksek nem tutucu (Humectant), cildin su tutma kapasitesini artırır', cat: 'hydrating', desc: 'Cilt hücrelerine su çeker.' },
    'hyaluronic acid': { func: 'Moleküler ağırlığına göre cildin farklı katmanlarına nem bağlar', cat: 'hydrating', desc: 'Ağırlığının 1000 katı su tutar.' },
    'sodium hyaluronate': { func: 'Derin nemlendirici, hyalüronik asidin biyo-yararlanımı yüksek tuzu', cat: 'hydrating', desc: 'Cilde elastikiyet kazandırır.' },
    'niacinamide': { func: 'B3 vitamini; sebum dengeler, gözenek görünümünü azaltır, bariyeri güçlendirir', cat: 'barrier', desc: 'Leke ve kızarıklık karşıtı çok yönlü aktif.' },
    'ceramide': { func: 'Cilt bariyeri yapıtaşı lipid; nem kaybını (TEWL) önler ve direnç sağlar', cat: 'barrier', desc: 'Hücreler arası harcı onarır.' },
    'ceramide np': { func: 'Bariyer onarıcı temel seramid', cat: 'barrier', desc: 'Tahriş ve kurulukla savaşır.' },
    'panthenol': { func: 'Pro-Vitamin B5; güçlü yatıştırıcı, kızarıklık giderici ve nemlendirici', cat: 'soothing', desc: 'Hızlı bariyer toparlama.' },
    'centella asiatica': { func: 'Yara iyileştirici, kızarıklık ve inflamasyon yatıştırıcı bitkisel ekstrakt', cat: 'soothing', desc: 'Hassas ciltler için altın standart.' },
    'salicylic acid': { func: 'BHA; yağda çözünür, gözenek içlerini arındırır, siyah nokta ve akne ile savaşır', cat: 'exfoliating', desc: 'Kimyasal eksfoliyan.' },
    'glycolic acid': { func: 'AHA; küçük moleküllü meyve asidi, üst ölü tabakayı arındırır, parlaklık verir', cat: 'exfoliating', desc: 'Leke ve doku eşitleyici.' },
    'lactic acid': { func: 'AHA; nazik nemlendirici eksfoliyan, cilt tonunu canlandırır', cat: 'exfoliating', desc: 'Hassas ciltlere uygun asit.' },
    'squalane': { func: 'Cildin doğal sebumuna benzer biyo-uyumlu hafif nemlendirici yağ', cat: 'barrier', desc: 'Komedojenik olmayan nem kalkanı.' },
    'allantoin': { func: 'Hücre yenilenmesini tetikleyen, tahrişi engelleyen nazik koruyucu', cat: 'soothing', desc: 'Yatıştırıcı bileşen.' },
    'zinc pca': { func: 'Çinko tuzu; sebum salgısını dengeler ve akne oluşumunu sınırlar', cat: 'barrier', desc: 'Yağlı/akneye eğilimli cilt dostu.' },
    'tocopherol': { func: 'E Vitamini; serbest radikallere karşı güçlü antioksidan koruma', cat: 'antioxidant', desc: 'Yaşlanma karşıtı koruyucu.' },
    'fragrance': { func: 'Koku verici; potansiyel kontakt alerjen ve tahriş kaynağı', cat: 'fragrance_sensitizer', desc: 'Hassas ciltlerde reaksiyon riski taşır.' },
    'parfum': { func: 'Sentetik veya doğal parfüm bileşimi; potansiyel hassasiyet tetikleyici', cat: 'fragrance_sensitizer', desc: 'Dermatolojik olarak reaksiyona açık.' },
    'limonene': { func: 'Narenciye kaynaklı koku bileşeni; hava ile okside olduğunda alerjenleşebilir', cat: 'fragrance_sensitizer', desc: 'Koku alerjeni.' },
    'linalool': { func: 'Çiçeksi koku molekülü; duyarlı ciltlerde kaşıntı ve kızarıklık yapabilir', cat: 'fragrance_sensitizer', desc: 'Koku alerjeni.' },
    'alcohol denat': { func: 'Denatüre alkol; formülü hafifletir ancak uzun vadede bariyeri kurutabilir', cat: 'fragrance_sensitizer', desc: 'Bariyer kurutucu potansiyel.' },
    'dimethicone': { func: 'Silikon; kadifemsi his verir ve nemi içeride hapseder (oklüzif)', cat: 'emollient', desc: 'Koruyucu bariyer filmi.' },
    'phenoxyethanol': { func: 'Geniş spektrumlu güvenli koruyucu (maksimum %1 kullanım)', cat: 'preservative', desc: 'Bakteri ve küf önleyici.' },
    'butylene glycol': { func: 'Nem çekici ve doku geliştirici çözücü', cat: 'hydrating', desc: 'Aktiflerin emilimini destekler.' },
  };

  const detectedFunctions: any[] = [];
  const hydrating: string[] = [];
  const barrier: string[] = [];
  const exfoliating: string[] = [];
  const sensitizers: string[] = [];
  const cautions: string[] = [];
  const whyCompatible: string[] = [];
  const potentialDrawbacks: string[] = [];
  const allergenMatches: any[] = [];

  let score = 75;

  // Search through known ingredients
  for (const [key, info] of Object.entries(INGREDIENT_KNOWLEDGE_BASE)) {
    if (ingredients.includes(key)) {
      detectedFunctions.push({
        name: key.toUpperCase(),
        function: info.func,
        category: info.cat,
        isHighlighted: ['barrier', 'hydrating', 'exfoliating', 'fragrance_sensitizer'].includes(info.cat),
      });

      if (info.cat === 'hydrating') hydrating.push(key);
      if (info.cat === 'barrier') barrier.push(key);
      if (info.cat === 'exfoliating') exfoliating.push(key);
      if (info.cat === 'fragrance_sensitizer') {
        sensitizers.push(key);
        cautions.push(`${key.toUpperCase()} içeriyor (hassasiyeti olanlar dikkat etmeli).`);
      }
    }
  }

  // Check user avoided ingredients
  for (const avoid of avoided) {
    if (avoid && ingredients.includes(avoid)) {
      score -= 18;
      allergenMatches.push({
        allergen: avoid,
        foundInProduct: avoid,
        explanation: `Tercih etmediğiniz "${avoid}" maddesi bu formülde yer alıyor.`,
      });
      potentialDrawbacks.push(`Formülde kaçınmak istediğiniz "${avoid}" bulunmaktadır.`);
    }
  }

  // Check free text allergies
  if (allergies) {
    const allergyList = allergies.split(/[,;\n]+/).map((a: string) => a.trim().toLowerCase()).filter(Boolean);
    for (const alg of allergyList) {
      if (ingredients.includes(alg)) {
        score -= 25;
        allergenMatches.push({
          allergen: alg,
          foundInProduct: alg,
          explanation: `Bildirdiğiniz alerji/hassasiyet "${alg}" içerik listesinde tespit edildi!`,
        });
        cautions.push(`DİKKAT: Alerji geçmişinizdeki "${alg}" maddesi mevcut.`);
      }
    }
  }

  // Skin type specifics
  if (skinType === 'hassas' || skinType === 'kuru') {
    if (sensitizers.length > 0) {
      score -= 12;
      potentialDrawbacks.push('Formülde parfüm veya uçucu koku bileşenleri bulunması hassas/kuru ciltlerde reaksiyon riski doğurabilir.');
    }
    if (barrier.length > 0 || hydrating.length > 0) {
      score += 10;
      whyCompatible.push('Cilt bariyerini destekleyen nemlendirici ve onarıcı ajanlar içeriyor.');
    }
  } else if (skinType === 'yağlı' || skinType === 'karma') {
    if (ingredients.includes('salicylic acid') || ingredients.includes('zinc pca') || ingredients.includes('niacinamide')) {
      score += 12;
      whyCompatible.push('Sebum dengeleyici ve gözenek arındırıcı içeriklerle zenginleştirilmiş.');
    }
  }

  // Primary need alignment
  if (primaryNeed.includes('nem') && hydrating.length > 0) {
    score += 8;
    whyCompatible.push('Temel ihtiyacınız olan yoğun nem desteğini sağlayabilecek humektanlar içeriyor.');
  }
  if (primaryNeed.includes('bariyer') && barrier.length > 0) {
    score += 10;
    whyCompatible.push('Bariyer güçlendirici lipit ve yatıştırıcılar sayesinde koruyucu kalkanı destekler.');
  }
  if (primaryNeed.includes('akne') && (ingredients.includes('salicylic acid') || ingredients.includes('niacinamide'))) {
    score += 10;
    whyCompatible.push('Akne ve pürüz karşıtı klinik etkisi bilinen aktif maddeler barındırıyor.');
  }

  // Bound score
  score = Math.max(20, Math.min(98, score));

  if (whyCompatible.length === 0) {
    whyCompatible.push('Cilt temizliği veya temel bakım rutininizde destekleyici bir baz oluşturabilir.');
  }
  if (potentialDrawbacks.length === 0) {
    potentialDrawbacks.push('Herhangi bir spesifik olumsuz etki saptanmadı; ilk kullanımda yama testi önerilir.');
  }

  return {
    matchScore: score,
    summaryReason: `Cilt tipiniz (${skinType}) ve hedefleriniz doğrultusunda formüldeki ${barrier.length + hydrating.length} faydalı bileşen değerlendirilerek %${score} uyum belirlendi.`,
    whyCompatible,
    potentialDrawbacks,
    suitableSkinTypes: ['Normal', skinType === 'yağlı' ? 'Karma ve Yağlı' : 'Kuru ve Hassas', 'Bariyer Desteğine İhtiyaç Duyanlar'],
    cautionIngredients: cautions.map(c => ({ ingredient: c, reason: 'Hassasiyet veya kullanıcı tercihi uyarısı', severity: 'medium' })),
    ingredientFunctions: detectedFunctions,
    hydratingIngredients: hydrating,
    barrierSupportingIngredients: barrier,
    exfoliatingIngredients: exfoliating,
    fragranceAndSensitizers: sensitizers,
    allergenMatches,
    uncertainties: [
      'Bitkisel ekstraktların tam saflık ve konsantrasyon yüzdeleri üretici tarafından paylaşılmamıştır.',
      'Bileşenlerin sırası genel yoğunluğu gösterse de kesin yüzdeler formül sırrıdır.',
    ],
    usageRecommendation: 'Günde 1 veya 2 kez temizlenmiş cilde nazikçe uygulayınız. Eğer asit içeriyorsa gündüz mutlaka en az SPF 30+ güneş kremi ile destekleyiniz. İlk defa kullanıyorsanız bileğinizin iç kısmında 24 saatlik yama (patch) testi yapınız.',
    scientificDisclaimer: 'Bu analiz, Open Beauty Facts veritabanındaki INCI içerik listesi ve kişisel profilinize dayanarak algoritmik ve yapay zeka modellemesi ile hazırlanmış tahmini bir uyumluluk değerlendirmesidir. Tıbbi tanı, klinik teşhis veya dermatolojik reçete yerine geçmez.',
  };
}

// 4. Gemini 3.8 Flash AI Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
  const { product, userProfile } = req.body;

  if (!product || !userProfile) {
    return res.status(400).json({ error: 'Ürün ve kullanıcı profili bilgisi zorunludur.' });
  }

  const ingredientsText = (product.ingredientsText || '').trim();

  // If ingredients are missing, we explicitly flag this requirement
  if (!ingredientsText || ingredientsText.length < 5) {
    return res.json({
      missingIngredients: true,
      productName: product.name,
      brand: product.brand,
      message: 'Bu ürünün Open Beauty Facts üzerindeki içerik (INCI) listesi eksik veya henüz girilmemiş. Lütfen ürün ambalajından içerik listesini kopyalayıp yapıştırarak analizi yenileyiniz.',
      analysis: null,
    });
  }

  const ai = getGeminiClient();

  // If Gemini API is available, perform full deep analysis
  if (ai) {
    try {
      const prompt = `
Sen dünya standartlarında uzman bir kozmetik kimyageri ve dermatoloji içerik analistisin.
Görevin, aşağıdaki kozmetik ürününün içeriğini (INCI listesi) kullanıcının detaylı cilt profiline göre objektif, bilimsel ve anlaşılır şekilde analiz etmektir.

ÜRÜN BİLGİLERİ:
- Ürün Adı: ${product.name}
- Marka: ${product.brand}
- Kategori: ${product.categories || 'Kozmetik'}
- Barkod: ${product.barcode || 'Belirtilmemiş'}
- INCI İçerik Listesi:
"""
${ingredientsText}
"""

KULLANICI CİLT PROFİLİ:
- Cilt Tipi: ${userProfile.skinType || 'Bilinmiyor'}
- Cilt Problemleri: ${(userProfile.problems || []).join(', ') || 'Yok'}
- En Büyük İhtiyaç: ${userProfile.primaryNeed || 'Genel bakım'}
- Geçmiş Reaksiyon Hikayesi: ${userProfile.reactionHistory ? 'Daha önce reaksiyon yaşadı (' + (userProfile.reactionDetails || '') + ')' : 'Daha önce reaksiyon yaşamadı'}
- İstemediği Maddeler: ${(userProfile.avoidedIngredients || []).join(', ') || 'Yok'}
- Bütçe Tercihi: ${userProfile.budget || 'Orta Segment'}
- Yaş Grubu: ${userProfile.ageRange || '25-34'}
- Bilinen Alerji ve Hassasiyetler: ${userProfile.allergies || 'Yok'}

ANALİZ KURALLARI:
1. İçeriklerin kozmetikte bilinen işlevlerini açıkla.
2. Nemlendirici bileşenleri (humectant, emollient, occlusive) belirle.
3. Cilt bariyerini desteklemeye yardımcı olabilecek bileşenleri belirle (seramid, yağ asitleri, kolesterol, pantenol, niasinamid, skualen vb.).
4. Eksfoliye edici bileşenleri belirle (AHA, BHA, PHA, enzimler).
5. Parfüm ve potansiyel hassasiyet oluşturabilecek bileşenleri belirt (Fragrance, Limonene, Linalool, Denatüre alkol vb.).
6. Kullanıcının bildirdiği alerjenlerle ve istemediği maddelerle eşleşen içerikleri titizlikle kontrol et.
7. İçerik listesindeki belirsizlikleri (oran eksikliği, genel koku ibaresi vb.) açıkça belirt.
8. Kullanıcıya uygunluk puanı ver (100 üzerinden). Neden uygun olduğunu, olası dezavantajlarını, en uygun cilt tiplerini, dikkat edilmesi gereken içerikleri ve kullanım önerisini belirt.
9. Puanları bilimsel olarak doğrulanmış klinik sonuçlar gibi sunma; bunların kullanıcı profiline ve mevcut içerik bilgilerine dayalı tahmini değerlendirmeler olduğunu açıkça belirt.

Tüm çıktıları Türkçe ve kesinlikle geçerli bir JSON olarak ver.
`;

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Sen profesyonel bir kozmetik içerik analisti ve SkinMatch AI motorusun. Yalnızca belirtilen JSON formatında yanıt ver.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: {
                type: Type.INTEGER,
                description: '0 ile 100 arasında kullanıcının profiline göre uyumluluk puanı',
              },
              summaryReason: {
                type: Type.STRING,
                description: 'Kullanıcının cilt profiline göre 1-2 cümlelik kısa özet',
              },
              whyCompatible: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Ürünün bu kullanıcı için neden uygun olduğunu açıklayan maddeler',
              },
              potentialDrawbacks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Kullanıcı açısından olası dezavantajlar veya dikkat edilecek noktalar',
              },
              suitableSkinTypes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Ürünün en çok uyduğu cilt tipleri',
              },
              cautionIngredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ingredient: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    severity: { type: Type.STRING, description: 'low, medium, high' },
                  },
                  required: ['ingredient', 'reason', 'severity'],
                },
                description: 'Hassasiyet veya iritasyon yaratabilecek dikkat edilmesi gereken içerikler',
              },
              ingredientFunctions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    function: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'hydrating, barrier, exfoliating, fragrance_sensitizer, soothing, antioxidant, emollient, preservative, other' },
                    isHighlighted: { type: Type.BOOLEAN },
                  },
                  required: ['name', 'function', 'category', 'isHighlighted'],
                },
                description: 'İçerikteki önemli maddelerin işlevleri',
              },
              hydratingIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Nemlendirici maddelerin listesi',
              },
              barrierSupportingIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Cilt bariyerini destekleyen maddelerin listesi',
              },
              exfoliatingIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Eksfoliye edici asit veya enzim maddeleri',
              },
              fragranceAndSensitizers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Parfüm ve potansiyel hassasiyet oluşturan maddeler',
              },
              allergenMatches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    allergen: { type: Type.STRING },
                    foundInProduct: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['allergen', 'foundInProduct', 'explanation'],
                },
                description: 'Kullanıcının belirttiği alerji veya kaçındığı maddelerle eşleşenler',
              },
              uncertainties: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'İçerik listesindeki belirsizlikler (yüzdelerin bilinmemesi, genel parfüm terimi vb.)',
              },
              usageRecommendation: {
                type: Type.STRING,
                description: 'Nasıl ve ne sıklıkla kullanılmalı, hangi sırayla ve güneş kremi zorunluluğu',
              },
              scientificDisclaimer: {
                type: Type.STRING,
                description: 'Bu değerlendirmenin klinik değil, mevcut verilere dayalı tahmini bir rehber olduğuna dair yasal uyarı',
              },
            },
            required: [
              'matchScore',
              'summaryReason',
              'whyCompatible',
              'potentialDrawbacks',
              'suitableSkinTypes',
              'cautionIngredients',
              'ingredientFunctions',
              'hydratingIngredients',
              'barrierSupportingIngredients',
              'exfoliatingIngredients',
              'fragranceAndSensitizers',
              'allergenMatches',
              'uncertainties',
              'usageRecommendation',
              'scientificDisclaimer',
            ],
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 10000)
      );

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        missingIngredients: false,
        engine: 'gemini-3.8-flash',
        analysis: parsed,
      });
    } catch (geminiError: any) {
      console.warn('Gemini API call failed, falling back to heuristic engine:', geminiError.message);
      // Fallback to our heuristic engine gracefully
      const fallback = heuristicAnalysis(product, userProfile);
      return res.json({
        missingIngredients: false,
        engine: 'heuristic-science-engine',
        note: 'Gemini servisi yanıt vermediğinden dermatolojik içerik kütüphanemiz ile analiz tamamlandı.',
        analysis: fallback,
      });
    }
  } else {
    // No Gemini API key provided yet: run our comprehensive scientific heuristic analyzer
    const fallback = heuristicAnalysis(product, userProfile);
    return res.json({
      missingIngredients: false,
      engine: 'heuristic-science-engine',
      note: 'Analiz dermatolojik içerik kütüphanemiz ve formül eşleştirme algoritmamız ile tamamlandı.',
      analysis: fallback,
    });
  }
});

// Configure Vite integration for dev or static for prod
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkinMatch Server listening on port ${PORT} (${isDev ? 'development' : 'production'})`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
