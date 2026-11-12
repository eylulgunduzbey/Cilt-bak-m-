import React from 'react';
import { Product } from '../types';
import { Sparkles, AlertCircle, ArrowLeftRight, Bookmark, Check, ShieldAlert } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onToggleCompare: (product: Product) => void;
  isCompared: boolean;
  onToggleFavorite: (product: Product) => void;
  isFavorite: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onToggleCompare,
  isCompared,
  onToggleFavorite,
  isFavorite,
}) => {
  const hasIngredients = Boolean(product.ingredientsText && product.ingredientsText.length > 5);

  return (
    <div className="group relative bg-white rounded-3xl border border-stone-200 hover:border-rose-300 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top Image area */}
      <div className="relative aspect-4/3 sm:aspect-square w-full bg-stone-100 flex items-center justify-center overflow-hidden p-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-stone-200/60 flex items-center justify-center text-stone-400">
            <Sparkles className="w-8 h-8 opacity-40 text-rose-500" />
          </div>
        )}

        {/* Favorite & Compare Quick Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-xs ${
              isCompared
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 backdrop-blur-xs text-stone-600 hover:text-stone-900 hover:bg-white'
            }`}
            title={isCompared ? 'Karşılaştırmadan Çıkar' : 'Karşılaştırmaya Ekle'}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-xs ${
              isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 backdrop-blur-xs text-stone-600 hover:text-rose-500 hover:bg-white'
            }`}
            title={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ingredients Status Badge */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          {hasIngredients ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-full shadow-2xs">
              <Check className="w-3 h-3 stroke-3" />
              INCI Mevcut
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-full shadow-2xs">
              <AlertCircle className="w-3 h-3" />
              İçerik Eksik
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider line-clamp-1">
              {product.brand}
            </span>
            {product.barcode && (
              <span className="text-[10px] font-mono text-stone-400">
                #{product.barcode.slice(-6)}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 mt-1 group-hover:text-rose-600 transition">
            {product.name}
          </h3>
          {product.categories && (
            <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
              {product.categories}
            </p>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-stone-900 group-hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition duration-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini ile Analiz Et</span>
          </button>
        </div>
      </div>
    </div>
  );
};
