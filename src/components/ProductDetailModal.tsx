import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Droplet,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
  Clock,
  ExternalLink,
  Edit2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bookmark,
  ArrowLeftRight,
  ShieldAlert,
} from 'lucide-react';
import { Product, UserProfile, AnalysisResponse, AnalysisResult } from '../types';
import { analyzeProductWithProfile } from '../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onToggleCompare: (product: Product) => void;
  isCompared: boolean;
  onToggleFavorite: (product: Product) => void;
  isFavorite: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  userProfile,
  isOpen,
  onClose,
  onToggleCompare,
  isCompared,
  onToggleFavorite,
  isFavorite,
}) => {
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [missingIngredients, setMissingIngredients] = useState<boolean>(false);
  const [analysisEngine, setAnalysisEngine] = useState<string>('');
  const [analysisNote, setAnalysisNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Manual INCI paste editing state for missing or custom ingredients
  const [isEditingInci, setIsEditingInci] = useState<boolean>(false);
  const [customInciInput, setCustomInciInput] = useState<string>('');
  const [copiedInci, setCopiedInci] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'allActives'>('overview');
  const [showRawInci, setShowRawInci] = useState<boolean>(false);

  useEffect(() => {
    if (product && isOpen) {
      setCurrentProduct(product);
      setCustomInciInput(product.ingredientsText || '');
      setIsEditingInci(false);
      setCopiedInci(false);
      runAnalysis(product);
    } else {
      setAnalysisResult(null);
      setError(null);
    }
  }, [product, isOpen]);

  const runAnalysis = async (targetProduct: Product) => {
    if (!targetProduct.ingredientsText || targetProduct.ingredientsText.trim().length < 5) {
      setMissingIngredients(true);
      setAnalysisResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMissingIngredients(false);

    try {
      const res: AnalysisResponse = await analyzeProductWithProfile(targetProduct, userProfile);
      if (res.missingIngredients) {
        setMissingIngredients(true);
        setAnalysisResult(null);
      } else if (res.analysis) {
        setAnalysisResult(res.analysis);
        setAnalysisEngine(res.engine || 'gemini-3.8-flash');
        setAnalysisNote(res.note || '');
      } else {
        setError('Analiz sonucu alınamadı.');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analiz sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInciAndReanalyze = () => {
    if (!currentProduct) return;
    const updated: Product = {
      ...currentProduct,
      ingredientsText: customInciInput.trim(),
      hasIngredients: customInciInput.trim().length > 5,
    };
    setCurrentProduct(updated);
    setIsEditingInci(false);
    runAnalysis(updated);
  };

  const copyInciToClipboard = () => {
    if (currentProduct?.ingredientsText) {
      navigator.clipboard.writeText(currentProduct.ingredientsText);
      setCopiedInci(true);
      setTimeout(() => setCopiedInci(false), 2000);
    }
  };

  if (!isOpen || !currentProduct) return null;

  // Score styling helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-50', label: 'Yüksek Uyum' };
    if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50', label: 'Orta Uyum' };
    return { bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200', light: 'bg-rose-50', label: 'Düşük / Riskli Uyum' };
  };

  const scoreMeta = analysisResult ? getScoreColor(analysisResult.matchScore) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              {currentProduct.brand}
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs text-stone-500 truncate max-w-[200px] sm:max-w-xs">
              {currentProduct.categories || 'Kozmetik'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleCompare(currentProduct)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                isCompared
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-stone-200 hover:bg-stone-100 text-stone-600'
              }`}
              title={isCompared ? 'Karşılaştırmadan Çıkar' : 'Karşılaştırmaya Ekle'}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCompared ? 'Karşılaştırılıyor' : 'Karşılaştır'}</span>
            </button>

            <button
              onClick={() => onToggleFavorite(currentProduct)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                isFavorite
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-stone-200 hover:bg-stone-100 text-stone-600'
              }`}
              title={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isFavorite ? 'Favorilerde' : 'Favori'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Header Card: Product Info & Image */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-stone-200/70 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {currentProduct.imageUrl ? (
                <img
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              ) : (
                <Sparkles className="w-8 h-8 text-rose-400/50" />
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                {currentProduct.brand}
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-stone-900 leading-snug">
                {currentProduct.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {currentProduct.barcode && (
                  <span className="text-[11px] font-mono bg-stone-200/60 text-stone-700 px-2.5 py-0.5 rounded-md">
                    Barkod: {currentProduct.barcode}
                  </span>
                )}
                {currentProduct.quantity && (
                  <span className="text-[11px] bg-stone-200/60 text-stone-700 px-2.5 py-0.5 rounded-md">
                    {currentProduct.quantity}
                  </span>
                )}
                {currentProduct.packaging && (
                  <span className="text-[11px] bg-stone-200/60 text-stone-700 px-2.5 py-0.5 rounded-md">
                    {currentProduct.packaging}
                  </span>
                )}
              </div>
            </div>

            {/* Re-analyze button */}
            <div className="shrink-0 self-stretch sm:self-center">
              <button
                onClick={() => runAnalysis(currentProduct)}
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-200/70 hover:bg-stone-300/80 text-stone-700 text-xs font-semibold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Yeniden Analiz Et
              </button>
            </div>
          </div>

          {/* MISSING INGREDIENTS WARNING (Prompt requirement: "Ürün içerikleri eksikse bunları uydurma. Eksik bilgileri kullanıcıya açıkça belirt.") */}
          {missingIngredients && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/90 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-900">
                    İçerik (INCI) Bilgisi Eksik
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Bu ürünün içerik listesi Open Beauty Facts veritabanında henüz mevcut değil veya eksik.
                    <strong className="block mt-1 font-semibold text-amber-950">
                      SkinMatch kesinlikle içerik tahmin etmez ve uydurmaz.
                    </strong>
                    Doğru ve güvenilir bir yapay zeka analizi için lütfen elinizdeki ürün ambalajından veya resmi web sitesinden içerik listesini (INCI) aşağıya yapıştırınız.
                  </p>
                </div>
              </div>

              {/* Paste INCI form */}
              <div className="pt-2 space-y-2">
                <textarea
                  rows={4}
                  value={customInciInput}
                  onChange={(e) => setCustomInciInput(e.target.value)}
                  placeholder="İçerik listesini buraya yapıştırın (Örn: Aqua, Glycerin, Niacinamide, Ceramide NP, Phenoxyethanol...)"
                  className="w-full text-xs p-3.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveInciAndReanalyze}
                  disabled={!customInciInput.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  İçeriği Kaydet ve Gemini ile Analiz Et
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {isLoading && (
            <div className="p-10 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-rose-500 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Gemini Akıllı İçerik Analizi Yapılıyor...
                </h4>
                <p className="text-xs text-stone-500 max-w-sm">
                  INCI listesindeki her molekül cilt tipiniz ({userProfile.skinType}), hassasiyetleriniz ve bariyer hedeflerinizle eşleştiriliyor.
                </p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {error && !isLoading && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => runAnalysis(currentProduct)}
                className="font-semibold underline ml-2"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* ANALYSIS RESULTS */}
          {analysisResult && !isLoading && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 1. Score & Summary Card */}
              <div className={`p-6 rounded-3xl border ${scoreMeta?.border} ${scoreMeta?.light} shadow-xs`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Circular Score Display */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-stone-200/80 fill-none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={264}
                          strokeDashoffset={264 - (264 * analysisResult.matchScore) / 100}
                          strokeLinecap="round"
                          className={`${scoreMeta?.text} fill-none transition-all duration-1000 ease-out`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
                          {analysisResult.matchScore}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-stone-500">
                          / 100 Puan
                        </span>
                      </div>
                    </div>
                    <span className={`mt-2 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${scoreMeta?.bg} text-white`}>
                      {scoreMeta?.label}
                    </span>
                  </div>

                  {/* Summary Details */}
                  <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      {userProfile.skinType.toUpperCase()} Cilt İçin Kişiselleştirilmiş Değerlendirme
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                      {analysisResult.summaryReason}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Bu puan, profilinizde belirttiğiniz{' '}
                      <strong>{userProfile.primaryNeed}</strong> hedefi ve{' '}
                      <strong>{userProfile.skinType}</strong> cilt tipinizin ihtiyaçları ile formüldeki içeriklerin bilimsel uyumu analiz edilerek hesaplanmıştır.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Critical Allergen & Avoided Warnings (if any match) */}
              {analysisResult.allergenMatches && analysisResult.allergenMatches.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Kişisel Alerji / Kaçınılan Madde Eşleşmesi Tespit Edildi!
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {analysisResult.allergenMatches.map((alg, idx) => (
                      <div key={idx} className="text-xs text-rose-800 bg-white/80 p-2.5 rounded-xl border border-rose-200">
                        <strong className="text-rose-950 capitalize">{alg.allergen}:</strong> {alg.explanation}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Tab Navigation: Overview / Ingredient Categories / Full INCI */}
              <div className="flex border-b border-stone-200 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === 'overview'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Genel Analiz & Uyum
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ingredients')}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === 'ingredients'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  İçerik Fonksiyon Grupları
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('allActives')}
                  className={`pb-2.5 border-b-2 transition ${
                    activeTab === 'allActives'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Tüm Aktiflerin İşlevleri ({analysisResult.ingredientFunctions?.length || 0})
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Why Compatible vs Potential Drawbacks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pros */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Neden Sizin İçin Uygun?
                      </h4>
                      <ul className="space-y-2 text-xs text-emerald-900 leading-relaxed">
                        {analysisResult.whyCompatible.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                      <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Olası Dezavantajlar & Dikkat Noktaları
                      </h4>
                      <ul className="space-y-2 text-xs text-amber-900 leading-relaxed">
                        {analysisResult.potentialDrawbacks.map((con, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold shrink-0">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suitable Skin Types & Caution List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Suitable Types */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        En Uygun Cilt Tipleri
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.suitableSkinTypes.map((st, i) => (
                          <span
                            key={i}
                            className="text-xs font-semibold px-3 py-1 rounded-xl bg-white border border-stone-300 text-stone-800 shadow-2xs"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Caution Ingredients */}
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Dikkat Edilmesi Gereken Bileşenler
                      </h4>
                      {analysisResult.cautionIngredients.length > 0 ? (
                        <div className="space-y-1.5">
                          {analysisResult.cautionIngredients.map((item, i) => (
                            <div key={i} className="text-xs flex items-center justify-between bg-white p-2 rounded-xl border border-stone-200">
                              <span className="font-semibold text-stone-800">{item.ingredient}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.severity === 'high'
                                    ? 'bg-rose-100 text-rose-700'
                                    : item.severity === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {item.severity === 'high' ? 'Yüksek Risk' : item.severity === 'medium' ? 'Orta Uyarı' : 'Düşük'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500">
                          Formülde belirgin bir iritan veya riskli kimyasal bulunamadı.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Usage Recommendations */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 text-white space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
                      <Clock className="w-4 h-4" />
                      Önerilen Kullanım Şekli & Sırası
                    </div>
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                      {analysisResult.usageRecommendation}
                    </p>
                  </div>

                  {/* Uncertainties */}
                  {analysisResult.uncertainties && analysisResult.uncertainties.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-stone-700">
                        <Info className="w-3.5 h-3.5" />
                        İçerik Listesindeki Belirsizlikler:
                      </div>
                      <ul className="text-xs space-y-1 pl-4 list-disc text-stone-600">
                        {analysisResult.uncertainties.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INGREDIENT CATEGORIES (Hydrating, Barrier, Exfoliating, Fragrance) */}
              {activeTab === 'ingredients' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hydrating */}
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                    <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wider">
                      <Droplet className="w-4 h-4 text-sky-600" />
                      Nemlendirici Bileşenler ({analysisResult.hydratingIngredients?.length || 0})
                    </div>
                    <p className="text-[11px] text-sky-800">
                      Su tutucu (humectant) ve yumuşatıcı (emollient) nem ajanları.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {analysisResult.hydratingIngredients && analysisResult.hydratingIngredients.length > 0 ? (
                        analysisResult.hydratingIngredients.map((item, i) => (
                          <span key={i} className="text-xs bg-white text-sky-900 font-medium px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-sky-700 italic">Belirgin nem ajanı tespit edilmedi.</span>
                      )}
                    </div>
                  </div>

                  {/* Barrier Supporting */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Cilt Bariyeri Destekleyiciler ({analysisResult.barrierSupportingIngredients?.length || 0})
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Seramid, seramid öncüleri, yağ asitleri, kolesterol ve onarıcılar.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {analysisResult.barrierSupportingIngredients && analysisResult.barrierSupportingIngredients.length > 0 ? (
                        analysisResult.barrierSupportingIngredients.map((item, i) => (
                          <span key={i} className="text-xs bg-white text-emerald-900 font-medium px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-700 italic">Özel bariyer lipidi bulunamadı.</span>
                      )}
                    </div>
                  </div>

                  {/* Exfoliating */}
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                      <Flame className="w-4 h-4 text-purple-600" />
                      Eksfoliye Edici Bileşenler ({analysisResult.exfoliatingIngredients?.length || 0})
                    </div>
                    <p className="text-[11px] text-purple-800">
                      AHA, BHA, PHA veya peeling etkili meyve asitleri/enzimler.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {analysisResult.exfoliatingIngredients && analysisResult.exfoliatingIngredients.length > 0 ? (
                        analysisResult.exfoliatingIngredients.map((item, i) => (
                          <span key={i} className="text-xs bg-white text-purple-900 font-medium px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-purple-700 italic">Soyucu veya asidik içerik içermiyor (Nazik formül).</span>
                      )}
                    </div>
                  </div>

                  {/* Fragrance & Sensitizers */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Parfüm & Hassasiyet Kaynakları ({analysisResult.fragranceAndSensitizers?.length || 0})
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Parfum, koku verici uçucu moleküller veya alkol türevleri.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {analysisResult.fragranceAndSensitizers && analysisResult.fragranceAndSensitizers.length > 0 ? (
                        analysisResult.fragranceAndSensitizers.map((item, i) => (
                          <span key={i} className="text-xs bg-white text-amber-900 font-medium px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium">✓ Parfümsüz & Koku Alerjeni İçermiyor</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ALL INGREDIENTS TABLE WITH FUNCTIONS */}
              {activeTab === 'allActives' && (
                <div className="space-y-3">
                  <div className="text-xs text-stone-500">
                    Formüldeki aktif maddeler ve kozmetik bilimindeki bilinen işlevleri:
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {analysisResult.ingredientFunctions && analysisResult.ingredientFunctions.map((fn, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          fn.isHighlighted ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-stone-900 uppercase">{fn.name}</span>
                          <p className="text-stone-600">{fn.function}</p>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded shrink-0 self-start sm:self-center">
                          {fn.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. SCIENTIFIC & LEGAL DISCLAIMER (Prompt requirement) */}
              <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-stone-600 text-[11px] leading-relaxed flex items-start gap-3">
                <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-800 block mb-0.5 font-semibold">
                    Bilimsel & Yasal Bilgilendirme:
                  </strong>
                  {analysisResult.scientificDisclaimer}
                </div>
              </div>
            </div>
          )}

          {/* RAW INCI TEXT COLLAPSIBLE SECTION */}
          <div className="border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={() => setShowRawInci(!showRawInci)}
              className="w-full flex items-center justify-between text-xs font-semibold text-stone-600 hover:text-stone-900 py-1"
            >
              <span>INCI İçerik Metnini Görüntüle / Düzenle</span>
              {showRawInci ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRawInci && (
              <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">Ham İçerik (INCI) Listesi</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyInciToClipboard}
                      className="text-xs text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 font-medium"
                    >
                      {copiedInci ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedInci ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingInci(!isEditingInci)}
                      className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {isEditingInci ? 'İptal' : 'İçeriği Düzenle'}
                    </button>
                  </div>
                </div>

                {isEditingInci ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={customInciInput}
                      onChange={(e) => setCustomInciInput(e.target.value)}
                      className="w-full text-xs font-mono p-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveInciAndReanalyze}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-xs"
                    >
                      Kaydet ve Analizi Güncelle
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-stone-700 leading-relaxed max-h-48 overflow-y-auto bg-white p-3 rounded-xl border border-stone-200/80">
                    {currentProduct.ingredientsText || 'Henüz içerik metni girilmemiş.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
