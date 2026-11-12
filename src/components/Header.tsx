import React from 'react';
import { Sparkles, ScanBarcode, User, FileText, ArrowLeftRight, Bookmark } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onOpenScanner: () => void;
  onOpenCustomInci: () => void;
  onOpenComparison: () => void;
  onOpenFavorites: () => void;
  comparisonCount: number;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  onOpenProfile,
  onOpenScanner,
  onOpenCustomInci,
  onOpenComparison,
  onOpenFavorites,
  comparisonCount,
  favoritesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-400 to-amber-300 flex items-center justify-center shadow-md shadow-rose-200/50 text-white font-bold text-xl">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-stone-900">
                  Skin<span className="text-rose-500 font-sans font-extrabold">Match</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  AI & INCI
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 hidden sm:block">
                Akıllı Kozmetik ve İçerik Analiz Platformu
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Custom INCI button */}
            <button
              onClick={onOpenCustomInci}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition"
              title="Herhangi bir ürünün içerik listesini doğrudan yapıştırıp analiz et"
            >
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              İçerik Yapıştır
            </button>

            {/* Barcode scanner button */}
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-800 hover:text-stone-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3 sm:px-3.5 py-2 rounded-xl transition shadow-xs"
              title="Kamera ile barkod tara veya numara gir"
            >
              <ScanBarcode className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Barkod Tara</span>
              <span className="sm:hidden">Barkod</span>
            </button>

            {/* Compare button */}
            <button
              onClick={onOpenComparison}
              className="relative inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 sm:px-3 py-2 rounded-xl transition"
              title="Ürünleri yan yana karşılaştır"
            >
              <ArrowLeftRight className="w-4 h-4 text-stone-600" />
              <span className="hidden lg:inline">Karşılaştır</span>
              {comparisonCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {comparisonCount}
                </span>
              )}
            </button>

            {/* Favorites button */}
            <button
              onClick={onOpenFavorites}
              className="relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-stone-700 hover:text-rose-600 bg-stone-100 hover:bg-rose-50 rounded-xl transition"
              title="Favori ürünlerim"
            >
              <Bookmark className="w-4 h-4" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Profile trigger */}
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-2 pl-2 sm:pl-3 pr-2.5 sm:pr-3.5 py-1.5 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-medium shadow-sm transition"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-stone-400 uppercase leading-none font-semibold">Cilt Profilim</div>
                <div className="text-xs font-semibold capitalize text-stone-100">
                  {userProfile.completed ? `${userProfile.skinType} Cilt` : 'Analizi Yap'}
                </div>
              </div>
              <span className="sm:hidden font-semibold capitalize text-xs">
                {userProfile.completed ? userProfile.skinType : 'Profil'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
