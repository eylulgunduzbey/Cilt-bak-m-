import React, { useState } from 'react';
import { X, FileText, Sparkles, Check } from 'lucide-react';
import { Product } from '../types';

interface CustomInciModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
}

export const CustomInciModal: React.FC<CustomInciModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [category, setCategory] = useState<string>('Serum / Krem');
  const [ingredientsText, setIngredientsText] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientsText.trim()) return;

    const customProduct: Product = {
      barcode: 'MANUAL-' + Date.now().toString().slice(-6),
      name: name.trim() || 'Özel Analiz Ürünü',
      brand: brand.trim() || 'Belirtilmedi',
      imageUrl: '',
      ingredientsText: ingredientsText.trim(),
      hasIngredients: true,
      categories: category,
    };

    onSubmit(customProduct);
    onClose();
  };

  const handleInsertSample = () => {
    setName('Bariyer Onarıcı Cica Krem');
    setBrand('Örnek Dermokozmetik');
    setCategory('Nemlendirici Krem');
    setIngredientsText(
      'Aqua/Water/Eau, Centella Asiatica Leaf Extract, Glycerin, Butylene Glycol, Caprylic/Capric Triglyceride, Niacinamide, Panthenol, Ceramide NP, Squalane, Madecassoside, Asiaticoside, Allantoin, Carbomer, Sodium Hyaluronate, Tromethamine, 1,2-Hexanediol, Ethylhexylglycerin'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                Kendi Ürününün İçeriğini Yapıştır
              </h3>
              <p className="text-[11px] text-stone-500">
                Ambalaj arkasındaki INCI listesi ile anında Gemini analizi
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleInsertSample}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
            >
              Örnek Formül Doldur
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Ürün Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Cica Barrier Soothing Cream"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Marka
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Örn: La Roche-Posay, CeraVe..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="Nemlendirici Krem">Nemlendirici Krem / Losyon</option>
              <option value="Serum & Tedavi">Serum & Tedavi Ürünü</option>
              <option value="Yüz Temizleyici">Yüz Temizleyici / Jel / Köpük</option>
              <option value="Güneş Kremi">Güneş Kremi (SPF)</option>
              <option value="Tonik & Asit">Tonik & Kimyasal Peeling</option>
              <option value="Göz Çevresi Kremi">Göz Çevresi Bakımı</option>
              <option value="Maske">Maske / Peeling</option>
              <option value="Diğer Kozmetik">Diğer</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              İçindekiler Listesi (INCI) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="Ürünün kutusunda yazan içerik listesini buraya yapıştırın. Örnek: Aqua, Glycerin, Niacinamide, Panthenol, Ceramide NP..."
              className="w-full text-xs font-mono p-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              İçerikler genellikle virgül ile ayrılmış uluslararası INCI adlandırmasıyla yazılır.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!ingredientsText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-200 transition"
            >
              <Sparkles className="w-4 h-4" />
              Cilt Profilime Göre Analiz Et
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
