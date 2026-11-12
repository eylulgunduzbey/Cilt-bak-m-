import React from 'react';
import { X, Bookmark, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Product[];
  onSelectProduct: (product: Product) => void;
  onRemoveFavorite: (product: Product) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onSelectProduct,
  onRemoveFavorite,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                Favori Ürünlerim ({favorites.length})
              </h3>
              <p className="text-[11px] text-stone-500">
                Kaydettiğiniz ve incelediğiniz ürünler
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
        <div className="p-6 overflow-y-auto space-y-3">
          {favorites.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Bookmark className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">Favori Ürününüz Yok</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Ürün kartlarındaki yer imi simgesine tıklayarak beğendiğiniz ürünleri buraya kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            favorites.map((product) => (
              <div
                key={product.barcode || product.name}
                className="p-3.5 rounded-2xl bg-stone-50 hover:bg-rose-50/50 border border-stone-200 hover:border-rose-200 transition flex items-center justify-between gap-3 group"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 border border-stone-200">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-stone-300" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-rose-600 block">{product.brand}</span>
                    <h4 className="text-xs font-semibold text-stone-900 group-hover:text-rose-600 line-clamp-1">
                      {product.name}
                    </h4>
                    <span className="text-[10px] text-stone-400">
                      {product.hasIngredients ? '✓ INCI Mevcut' : '⚠️ İçerik Eksik'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-stone-900 group-hover:bg-rose-500 text-white text-xs font-semibold transition"
                    title="Detaylı Analiz"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(product)}
                    className="p-2 rounded-xl hover:bg-stone-200 text-stone-400 hover:text-rose-600 transition"
                    title="Favorilerden Çıkar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
