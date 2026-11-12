import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Sparkles, Check, AlertTriangle, Droplet, ShieldCheck } from 'lucide-react';
import { Product, UserProfile, AnalysisResult } from '../types';
import { analyzeProductWithProfile } from '../services/api';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedProducts: Product[];
  onRemoveFromCompare: (product: Product) => void;
  userProfile: UserProfile;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedProducts,
  onRemoveFromCompare,
  userProfile,
}) => {
  const [analysis1, setAnalysis1] = useState<AnalysisResult | null>(null);
  const [analysis2, setAnalysis2] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && comparedProducts.length > 0) {
      loadAnalyses();
    }
  }, [isOpen, comparedProducts]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      if (comparedProducts[0] && comparedProducts[0].ingredientsText) {
        const res1 = await analyzeProductWithProfile(comparedProducts[0], userProfile);
        setAnalysis1(res1.analysis);
      } else {
        setAnalysis1(null);
      }

      if (comparedProducts[1] && comparedProducts[1].ingredientsText) {
        const res2 = await analyzeProductWithProfile(comparedProducts[1], userProfile);
        setAnalysis2(res2.analysis);
      } else {
        setAnalysis2(null);
      }
    } catch (e) {
      console.error('Comparison error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const prod1 = comparedProducts[0];
  const prod2 = comparedProducts[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                Ürün Karşılaştırma & Cilt Uyumu
              </h3>
              <p className="text-[11px] text-stone-500">
                {userProfile.skinType.toUpperCase()} Cilt • {userProfile.primaryNeed}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {comparedProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ArrowLeftRight className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">Karşılaştırma Listesi Boş</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Ürün kartlarındaki karşılaştırma simgesine tıklayarak 2 ürünü buraya ekleyebilir ve yan yana değerlendirebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-200">
              {/* Product 1 */}
              <div className="space-y-4 pr-0 md:pr-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-stone-100 p-1 flex items-center justify-center overflow-hidden shrink-0">
                      {prod1?.imageUrl ? (
                        <img src={prod1.imageUrl} alt={prod1.name} className="w-full h-full object-contain" />
                      ) : (
                        <Sparkles className="w-6 h-6 text-stone-300" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-rose-600">{prod1?.brand}</span>
                      <h4 className="text-sm font-bold text-stone-900 line-clamp-2">{prod1?.name}</h4>
                    </div>
                  </div>
                  {prod1 && (
                    <button
                      onClick={() => onRemoveFromCompare(prod1)}
                      className="text-stone-400 hover:text-rose-500 text-xs p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="p-6 text-center text-xs text-stone-400">Analiz yükleniyor...</div>
                ) : analysis1 ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-600">Uyumluluk Puanı</span>
                      <span className="text-xl font-extrabold text-rose-600 font-sans">
                        {analysis1.matchScore} / 100
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-stone-700 block">Neden Uygun:</span>
                      <ul className="text-stone-600 space-y-1 pl-4 list-disc">
                        {analysis1.whyCompatible.slice(0, 2).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-stone-700 block">Dikkat Edilmeli:</span>
                      <ul className="text-stone-600 space-y-1 pl-4 list-disc">
                        {analysis1.potentialDrawbacks.slice(0, 2).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="text-[10px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                        💧 {analysis1.hydratingIngredients?.length || 0} Nemlendirici
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        🛡️ {analysis1.barrierSupportingIngredients?.length || 0} Bariyer
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                        ⚠️ {analysis1.fragranceAndSensitizers?.length || 0} Koku/Parfüm
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">İçerik eksik veya analiz yapılamadı.</p>
                )}
              </div>

              {/* Product 2 */}
              <div className="space-y-4 pt-6 md:pt-0 pl-0 md:pl-4">
                {prod2 ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-stone-100 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          {prod2.imageUrl ? (
                            <img src={prod2.imageUrl} alt={prod2.name} className="w-full h-full object-contain" />
                          ) : (
                            <Sparkles className="w-6 h-6 text-stone-300" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-rose-600">{prod2.brand}</span>
                          <h4 className="text-sm font-bold text-stone-900 line-clamp-2">{prod2.name}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveFromCompare(prod2)}
                        className="text-stone-400 hover:text-rose-500 text-xs p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {loading ? (
                      <div className="p-6 text-center text-xs text-stone-400">Analiz yükleniyor...</div>
                    ) : analysis2 ? (
                      <div className="space-y-3 pt-2">
                        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-600">Uyumluluk Puanı</span>
                          <span className="text-xl font-extrabold text-rose-600 font-sans">
                            {analysis2.matchScore} / 100
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <span className="font-semibold text-stone-700 block">Neden Uygun:</span>
                          <ul className="text-stone-600 space-y-1 pl-4 list-disc">
                            {analysis2.whyCompatible.slice(0, 2).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="text-xs space-y-1">
                          <span className="font-semibold text-stone-700 block">Dikkat Edilmeli:</span>
                          <ul className="text-stone-600 space-y-1 pl-4 list-disc">
                            {analysis2.potentialDrawbacks.slice(0, 2).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-2">
                          <span className="text-[10px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                            💧 {analysis2.hydratingIngredients?.length || 0} Nemlendirici
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                            🛡️ {analysis2.barrierSupportingIngredients?.length || 0} Bariyer
                          </span>
                          <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                            ⚠️ {analysis2.fragranceAndSensitizers?.length || 0} Koku/Parfüm
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">İçerik eksik veya analiz yapılamadı.</p>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center space-y-2 border-2 border-dashed border-stone-200 rounded-2xl">
                    <p className="text-xs font-semibold text-stone-500">2. Ürün Bekleniyor</p>
                    <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                      Listeden başka bir ürünün üzerindeki karşılaştır simgesine tıklayarak ekleyin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
