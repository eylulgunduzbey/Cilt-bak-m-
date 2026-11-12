import React, { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Sparkles, Shield, AlertCircle, Heart } from 'lucide-react';
import { UserProfile, SkinType } from '../types';

interface SkinAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const SKIN_TYPES: { id: SkinType; title: string; desc: string; icon: string }[] = [
  { id: 'yağlı', title: 'Yağlı Cilt', desc: 'Tüm yüzde belirgin parlama, genişlemiş gözenekler ve akneye eğilim.', icon: '✨' },
  { id: 'kuru', title: 'Kuru Cilt', desc: 'Gerginlik hissi, pullanma, mat görünüm ve nemsizlik çizgileri.', icon: '🏜️' },
  { id: 'karma', title: 'Karma Cilt', desc: 'T bölgesi (alın, burun, çene) yağlı; yanaklar ve kenarlar normal veya kuru.', icon: '⚖️' },
  { id: 'normal', title: 'Normal Cilt', desc: 'Nem ve yağ dengesi iyi, gözenekler belirgin değil, esnek ve rahat.', icon: '🌸' },
  { id: 'hassas', title: 'Hassas Cilt', desc: 'Hızlı kızaran, yanma, batma, kaşıntı ve çevresel faktörlere duyarlı.', icon: '🛡️' },
  { id: 'bilmiyorum', title: 'Emin Değilim', desc: 'Cilt tipinizi tam bilmiyorsanız genel dengeleyici analiz uygulanır.', icon: '❓' },
];

const SKIN_PROBLEMS = [
  { id: 'Akne', label: 'Akne & Sivilce', desc: 'İltihaplı sivilceler ve lezyonlar' },
  { id: 'Siyah Nokta', label: 'Siyah Nokta & Tıkalı Gözenek', desc: 'Okside olmuş gözenek tıkaçları' },
  { id: 'Kızarıklık', label: 'Kızarıklık & Roza Eğilimi', desc: 'Kılcal damar görünümü ve kızarma' },
  { id: 'Kuruluk', label: 'Kuruluk & Pullanma', desc: 'Bariyer zayıflığı ve nem kaybı' },
  { id: 'Yağlanma', label: 'Aşırı Yağlanma & Parlama', desc: 'Aşırı sebum salgılanması' },
  { id: 'Leke', label: 'Leke & Ton Eşitsizliği', desc: 'Güneş, yaş ve akne sonrası lekeler' },
  { id: 'Gözenek', label: 'Genişlemiş Gözenekler', desc: 'Doku düzensizliği ve gevşeklik' },
  { id: 'İnce Çizgiler', label: 'İnce Çizgiler & Kırışıklık', desc: 'Kolajen kaybı ve elastikiyet azalması' },
];

const PRIMARY_NEEDS = [
  { id: 'Yoğun Nemlendirme', title: 'Yoğun Nem Desteği (Humektan & Oklüzif)', desc: 'Cildin su tutma kapasitesini artırma' },
  { id: 'Cilt Bariyeri Onarımı', title: 'Cilt Bariyeri Güçlendirme & Onarım', desc: 'Seramid ve lipid desteği ile dayanıklılık' },
  { id: 'Sebum ve Gözenek Dengesi', title: 'Sebum Kontrolü & Gözenek Sıkılaştırma', desc: 'Yağ salgısını dengeleme ve arındırma' },
  { id: 'Akne Tedavisi Destek', title: 'Akne ve Pürüz Karşıtı Mücadele', desc: 'Antibakteriyel ve yatıştırıcı bakım' },
  { id: 'Ton Eşitleme ve Aydınlatma', title: 'Leke Giderme & Cilt Tonu Aydınlatma', desc: 'Melanin baskılama ve parlaklık' },
  { id: 'Anti-Aging ve Sıkılaşma', title: 'Anti-Aging & Kolajen Desteği', desc: 'İnce çizgi bakımı ve elastikiyet' },
  { id: 'Yatıştırma ve Kızarıklık Karşıtı', title: 'Yatıştırma & Hassasiyet Kalkanı', desc: 'Centella ve pantenol ile sakinleştirme' },
];

const COMMON_AVOIDED_INGREDIENTS = [
  'Parfüm / Fragrance',
  'Denatüre Alkol (Alcohol Denat)',
  'Parabenler',
  'Sülfatlar (SLS / SLES)',
  'Silikonlar (Dimethicone vb.)',
  'Mineral Yağ / Petrolatum',
  'Uçucu Yağlar (Essential Oils)',
  'Mikroplastikler',
  'Sentetik Boyalar',
  'Komedojenik Yağlar',
];

const COMMON_ALLERGIES = [
  'Niasinamid (B3 Vitamini)',
  'Salisilik Asit (BHA / Aspirin türevi)',
  'Askorbik Asit (Saf C Vitamini)',
  'Fındık / Fıstık / Badem Yağları',
  'Lanolin (Koyun Yünü Yağı)',
  'Retinoidler (Retinol / Tretinoin)',
  'Kimyasal Güneş Filtreleri',
  'Gluten',
  'Çay Ağacı Yağı (Tea Tree)',
  'Propolis / Arı Ürünleri',
];

export const SkinAnalysisModal: React.FC<SkinAnalysisModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 8;

  // Form states initialized with current profile
  const [skinType, setSkinType] = useState<SkinType>(currentProfile.skinType || 'karma');
  const [problems, setProblems] = useState<string[]>(currentProfile.problems || []);
  const [primaryNeed, setPrimaryNeed] = useState<string>(currentProfile.primaryNeed || 'Cilt Bariyeri Onarımı');
  const [reactionHistory, setReactionHistory] = useState<boolean>(currentProfile.reactionHistory || false);
  const [reactionDetails, setReactionDetails] = useState<string>(currentProfile.reactionDetails || '');
  const [avoidedIngredients, setAvoidedIngredients] = useState<string[]>(currentProfile.avoidedIngredients || []);
  const [customAvoided, setCustomAvoided] = useState<string>('');
  const [budget, setBudget] = useState<UserProfile['budget']>(currentProfile.budget || 'Orta Segment / Dermokozmetik (₺₺)');
  const [ageRange, setAgeRange] = useState<UserProfile['ageRange']>(currentProfile.ageRange || '25-34');
  const [allergies, setAllergies] = useState<string>(currentProfile.allergies || '');

  if (!isOpen) return null;

  const toggleProblem = (id: string) => {
    if (problems.includes(id)) {
      setProblems(problems.filter(p => p !== id));
    } else {
      setProblems([...problems, id]);
    }
  };

  const toggleAvoided = (item: string) => {
    if (avoidedIngredients.includes(item)) {
      setAvoidedIngredients(avoidedIngredients.filter(a => a !== item));
    } else {
      setAvoidedIngredients([...avoidedIngredients, item]);
    }
  };

  const addCustomAvoided = () => {
    if (customAvoided.trim() && !avoidedIngredients.includes(customAvoided.trim())) {
      setAvoidedIngredients([...avoidedIngredients, customAvoided.trim()]);
      setCustomAvoided('');
    }
  };

  const toggleAllergyPreset = (alg: string) => {
    const list = allergies.split(/[,;\n]+/).map(a => a.trim()).filter(Boolean);
    if (list.includes(alg)) {
      const updated = list.filter(a => a !== alg).join(', ');
      setAllergies(updated);
    } else {
      const updated = [...list, alg].join(', ');
      setAllergies(updated);
    }
  };

  const handleFinish = () => {
    const newProfile: UserProfile = {
      skinType,
      problems,
      primaryNeed,
      reactionHistory,
      reactionDetails: reactionHistory ? reactionDetails : '',
      avoidedIngredients,
      budget,
      ageRange,
      allergies,
      completed: true,
      updatedAt: new Date().toISOString(),
    };
    onSaveProfile(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">Kişiselleştirilmiş Cilt Analizi</h2>
              <p className="text-xs text-stone-500">Adım {step} / {totalSteps}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-1.5">
          <div
            className="bg-rose-500 h-1.5 transition-all duration-300 rounded-r-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Cilt Tipi */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">1. Cilt tipiniz nedir?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  En uygun ürün ve içerik eşleşmesini yapabilmemiz için temel cilt yapınızı seçiniz.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {SKIN_TYPES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSkinType(st.id)}
                    className={`p-4 rounded-2xl border text-left transition flex items-start gap-3.5 ${
                      skinType === st.id
                        ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-200 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{st.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900">{st.title}</span>
                        {skinType === st.id && (
                          <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">{st.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Cilt Problemleri */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">2. Cildinizde hangi problemler var?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Birden fazla seçim yapabilirsiniz. Bu problemler içerik analizi sırasında hedeflenecektir.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {SKIN_PROBLEMS.map((prob) => {
                  const isSelected = problems.includes(prob.id);
                  return (
                    <button
                      key={prob.id}
                      type="button"
                      onClick={() => toggleProblem(prob.id)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-medium'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-stone-900">{prob.label}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{prob.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-stone-300 bg-stone-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Cildin En Büyük İhtiyacı */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">3. Cildinizin en büyük ihtiyacı nedir?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Şu an odaklanmak istediğiniz ana bakım hedefini belirleyin.
                </p>
              </div>
              <div className="space-y-2.5 pt-2">
                {PRIMARY_NEEDS.map((need) => (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => setPrimaryNeed(need.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                      primaryNeed === need.id
                        ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-stone-900">{need.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{need.desc}</div>
                    </div>
                    {primaryNeed === need.id && (
                      <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 ml-3">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Geçmiş Reaksiyon Yaşandı mı? */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">
                  4. Daha önce herhangi bir kozmetik ürüne karşı reaksiyon yaşadınız mı?
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  Hassasiyet veya iritasyon geçmişiniz formül puanlamasında yüksek önceliklidir.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReactionHistory(false)}
                  className={`p-4 rounded-2xl border text-center transition ${
                    !reactionHistory
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200 font-semibold text-emerald-900'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🌿</div>
                  Hayır, Reaksiyon Yaşamadım
                </button>
                <button
                  type="button"
                  onClick={() => setReactionHistory(true)}
                  className={`p-4 rounded-2xl border text-center transition ${
                    reactionHistory
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200 font-semibold text-amber-900'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="text-2xl mb-1">⚠️</div>
                  Evet, Reaksiyon Yaşadım
                </button>
              </div>

              {reactionHistory && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 mt-3 animate-in fade-in">
                  <label className="text-xs font-semibold text-amber-900 block">
                    Nasıl bir reaksiyon oldu? (Örn: Kaşıntı, yanma, sivilcelenme, egzama, kızarıklık):
                  </label>
                  <input
                    type="text"
                    value={reactionDetails}
                    onChange={(e) => setReactionDetails(e.target.value)}
                    placeholder="Örnek: Alkol içeren tonik sonrası aşırı yanma ve kızarıklık oldu..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: İstemediğiniz Maddeler */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">5. İçeriğinde bulunmasını istemediğiniz maddeler var mı?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Seçtiğiniz maddeler bir üründe tespit edildiğinde uyarı verilecek ve puan düşürülecektir.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {COMMON_AVOIDED_INGREDIENTS.map((item) => {
                  const isSelected = avoidedIngredients.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAvoided(item)}
                      className={`text-xs px-3 py-2 rounded-xl border transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold shadow-2xs'
                          : 'border-stone-200 bg-stone-50/60 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{isSelected ? '✕' : '+'}</span>
                      {item}
                    </button>
                  );
                })}
              </div>

              {/* Custom Avoided Ingredient Input */}
              <div className="pt-2">
                <label className="text-xs font-medium text-stone-600 block mb-1.5">
                  Özel bir madde eklemek ister misiniz?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAvoided}
                    onChange={(e) => setCustomAvoided(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAvoided())}
                    placeholder="Örn: Butyrospermum Parkii, Esans..."
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <button
                    type="button"
                    onClick={addCustomAvoided}
                    className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 transition"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Bütçe */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">6. Cilt bakımına ayırdığınız bütçe nedir?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Önerilerinizde ve ürün segmentasyonunda bütçenizi göz önünde bulunduruyoruz.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                {[
                  { id: 'Ekonomik (₺)' as const, title: 'Ekonomik / Fiyat-Performans', desc: 'Ulaşılabilir, eczane & market dostu temiz formüller' },
                  { id: 'Orta Segment / Dermokozmetik (₺₺)' as const, title: 'Orta Segment / Dermokozmetik', desc: 'Dermatolojik test edilmiş eczane ve K-Beauty markaları' },
                  { id: 'Lüks / Premium (₺₺₺)' as const, title: 'Lüks / Premium', desc: 'Özel patentli içerikler, high-end ve lüks kozmetik serileri' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBudget(b.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                      budget === b.id
                        ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-200'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-stone-900">{b.title}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{b.desc}</div>
                    </div>
                    {budget === b.id && (
                      <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Yaş Aralığı */}
          {step === 7 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">7. Kaç yaş aralığındasınız?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Cildin hücresel yenilenme hızı ve kolajen ihtiyacı yaşla birlikte değişir.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {(['18 altı', '18-24', '25-34', '35-44', '45-54', '55+'] as const).map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setAgeRange(age)}
                    className={`p-4 rounded-2xl border text-center transition font-semibold text-sm ${
                      ageRange === age
                        ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {age} yaş
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: Bilinen Alerji ve Hassasiyetler */}
          {step === 8 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xl font-bold text-stone-900">8. Bilinen alerjileriniz veya hassasiyetleriniz var mı?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Aşağıdaki sık rastlanan maddelere tıklayabilir veya kendi bildiğiniz alerjileri yazabilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_ALLERGIES.map((alg) => {
                  const isSelected = allergies.toLowerCase().includes(alg.toLowerCase().split(' ')[0]);
                  return (
                    <button
                      key={alg}
                      type="button"
                      onClick={() => toggleAllergyPreset(alg)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition ${
                        isSelected
                          ? 'border-rose-600 bg-rose-100/80 text-rose-900 font-semibold'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {alg}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Alerji ve Hassasiyet Notlarınız:
                </label>
                <textarea
                  rows={3}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Örnek: Niasinamid %10 olunca sivilce yapıyor, nikel alerjim var, aspirin/salisilat alerjim var..."
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-xs text-stone-600">
                  Tebrikler! Cilt analizi tamamlandıktan sonra tüm Open Beauty Facts ürünleri ve barkod sorguları bu profile göre değerlendirilecektir.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 px-3.5 py-2 rounded-xl transition hover:bg-stone-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Geri
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl shadow-xs transition"
            >
              Devam Et
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl shadow-md shadow-rose-200 transition"
            >
              <Check className="w-4 h-4 stroke-3" />
              Profili Tamamla & Kaydet
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
