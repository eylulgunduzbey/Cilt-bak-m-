/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ScanBarcode,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  Droplet,
  Layers,
  Heart,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';
import { UserProfile, Product } from './types';
import { Header } from './components/Header';
import { SkinProfileSummary } from './components/SkinProfileSummary';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SkinAnalysisModal } from './components/SkinAnalysisModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CustomInciModal } from './components/CustomInciModal';
import { ProductComparisonModal } from './components/ProductComparisonModal';
import { FavoritesModal } from './components/FavoritesModal';
import { POPULAR_VERIFIED_PRODUCTS, DEFAULT_USER_PROFILE } from './utils/sampleData';
import { searchProducts } from './services/api';

const CATEGORY_CHIPS = [
  { id: 'all', label: 'Tüm Ürünler' },
  { id: 'nemlendirici', label: 'Nemlendiriciler' },
  { id: 'temizleyici', label: 'Temizleyiciler' },
  { id: 'serum', label: 'Serumlar & Tedaviler' },
  { id: 'güneş', label: 'Güneş Kremleri (SPF)' },
  { id: 'tonik', label: 'Tonikler & Asitler' },
];

const POPULAR_SEARCH_KEYWORDS = [
  'CeraVe',
  'La Roche-Posay',
  'The Ordinary',
  'Bioderma',
  'Hyaluronik Asit',
  'Niasinamid',
  'Centella',
  'Bariyer Krem',
];

export default function App() {
  // 1. User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('skinmatch_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse user profile from localStorage', e);
    }
    return DEFAULT_USER_PROFILE;
  });

  // 2. Modals state
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isCustomInciModalOpen, setIsCustomInciModalOpen] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 3. Product Search and Feed State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // 4. Comparison and Favorites state
  const [comparedProducts, setComparedProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('skinmatch_comparison');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [favorites, setFavorites] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('skinmatch_favorites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Save profile to localStorage
  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    try {
      localStorage.setItem('skinmatch_user_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  };

  // Save favorites to localStorage
  const handleToggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.barcode === product.barcode && p.name === product.name);
      let updated: Product[];
      if (exists) {
        updated = prev.filter((p) => !(p.barcode === product.barcode && p.name === product.name));
      } else {
        updated = [product, ...prev];
      }
      try {
        localStorage.setItem('skinmatch_favorites', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Manage comparison list (maximum 2 products)
  const handleToggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.barcode === product.barcode && p.name === product.name);
      let updated: Product[];
      if (exists) {
        updated = prev.filter((p) => !(p.barcode === product.barcode && p.name === product.name));
      } else {
        if (prev.length >= 2) {
          updated = [prev[1], product]; // FIFO: keep latest 2
        } else {
          updated = [...prev, product];
        }
      }
      try {
        localStorage.setItem('skinmatch_comparison', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute Open Beauty Facts Search
  const performSearch = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const data = await searchProducts(query);
      setSearchResults(data.products || []);
    } catch (err: any) {
      console.error('Search failed:', err);
      setSearchError('Open Beauty Facts üzerinden arama yapılırken bir sorun oluştu.');
      // If error, filter in local popular products as graceful fallback
      const localMatches = POPULAR_VERIFIED_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.brand.toLowerCase().includes(query.toLowerCase()) ||
          p.ingredientsText.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(localMatches);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [debouncedQuery, performSearch]);

  // Filter products by category tab
  const getDisplayedProducts = () => {
    const sourceList = hasSearched ? searchResults : POPULAR_VERIFIED_PRODUCTS;

    if (activeCategory === 'all') return sourceList;

    return sourceList.filter((p) => {
      const text = `${p.name} ${p.categories || ''}`.toLowerCase();
      if (activeCategory === 'nemlendirici') {
        return text.includes('nemlendirici') || text.includes('cream') || text.includes('krem') || text.includes('lotion');
      }
      if (activeCategory === 'temizleyici') {
        return text.includes('temizleyici') || text.includes('cleanser') || text.includes('köpük') || text.includes('jel') || text.includes('micellar');
      }
      if (activeCategory === 'serum') {
        return text.includes('serum') || text.includes('hyalu') || text.includes('ampoule');
      }
      if (activeCategory === 'güneş') {
        return text.includes('güneş') || text.includes('sun') || text.includes('spf');
      }
      if (activeCategory === 'tonik') {
        return text.includes('tonik') || text.includes('toner') || text.includes('acid') || text.includes('peeling');
      }
      return true;
    });
  };

  const displayedProducts = getDisplayedProducts();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* 1. Header */}
      <Header
        userProfile={userProfile}
        onOpenProfile={() => setIsAnalysisModalOpen(true)}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenCustomInci={() => setIsCustomInciModalOpen(true)}
        onOpenComparison={() => setIsComparisonModalOpen(true)}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}
        comparisonCount={comparedProducts.length}
        favoritesCount={favorites.length}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Active Skin Profile Card */}
        <SkinProfileSummary
          profile={userProfile}
          onEditProfile={() => setIsAnalysisModalOpen(true)}
        />

        {/* Hero & Open Beauty Facts Search Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                Kozmetik Ürün ve İçerik Arama
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Open Beauty Facts küresel veritabanı ile ürün sorgulayın veya barkod okutun.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomInciModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition"
              >
                <FileText className="w-3.5 h-3.5" />
                İçerik Metni Yapıştır
              </button>
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition"
              >
                <ScanBarcode className="w-3.5 h-3.5 text-rose-500" />
                Barkod Tara
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün adı, marka veya içerik arayın (Örn: CeraVe, Effaclar, The Ordinary, Niacinamide...)"
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-stone-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60 text-sm placeholder:text-stone-400 shadow-xs transition"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" />
              </div>
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-stone-400 hover:text-stone-700"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Popular Keyword Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-stone-400 mr-1">Popüler:</span>
            {POPULAR_SEARCH_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => setSearchQuery(kw)}
                className="text-xs bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 px-2.5 py-1 rounded-xl transition"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {CATEGORY_CHIPS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-serif text-stone-900">
                {hasSearched ? `Arama Sonuçları (${displayedProducts.length})` : 'Öne Çıkan Doğrulanmış Ürünler'}
              </h2>
              {!hasSearched && (
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Tam INCI Listeli
                </span>
              )}
            </div>

            {hasSearched && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setHasSearched(false);
                }}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Öne Çıkanlara Dön
              </button>
            )}
          </div>

          {/* Search Error Notice */}
          {searchError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>{searchError}</span>
              <button
                onClick={() => performSearch(searchQuery)}
                className="font-semibold underline ml-2"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isSearching && displayedProducts.length === 0 && (
            <div className="py-16 px-4 rounded-3xl bg-white border border-stone-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
                <Search className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Ürün Bulunamadı</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  "{searchQuery}" için Open Beauty Facts üzerinde kayıt bulunamadı. Dilerseniz ürünün ambalajındaki içerik listesini doğrudan yapıştırabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomInciModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition"
              >
                <FileText className="w-3.5 h-3.5" />
                İçerik Listesini Yapıştır
              </button>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {displayedProducts.map((product) => {
              const isCompared = comparedProducts.some(
                (p) => p.barcode === product.barcode && p.name === product.name
              );
              const isFavorite = favorites.some(
                (p) => p.barcode === product.barcode && p.name === product.name
              );

              return (
                <ProductCard
                  key={product.barcode || product.name}
                  product={product}
                  onSelect={(p) => setSelectedProduct(p)}
                  onToggleCompare={handleToggleCompare}
                  isCompared={isCompared}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite}
                />
              );
            })}
          </div>
        </section>

        {/* Informative Beauty Philosophy Banner */}
        <section className="p-6 rounded-3xl bg-gradient-to-r from-rose-50 via-stone-50 to-amber-50 border border-stone-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Bilimsel & Dürüst İçerik Analizi
            </span>
            <h3 className="text-base sm:text-lg font-bold font-serif text-stone-900">
              SkinMatch ile Cildinizi Tahminlerle Değil, Formüllerle Besleyin
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Her cildin biyolojisi ve tolerans eşiği farklıdır. Open Beauty Facts küresel veritabanı ve Gemini yapay zekası sayesinde ürünlerin nemlendirici, bariyer onarıcı, eksfoliye edici ve potansiyel alerjen içeriklerini tarafsızca analiz ediyoruz.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAnalysisModalOpen(true)}
            className="shrink-0 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-md transition"
          >
            Cilt Analizi Testini Tekrarla
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-800">SkinMatch</span>
            <span>•</span>
            <span>Open Beauty Facts & Google Gemini Destekli Cilt Bakım Analizi</span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-stone-400">
            Değerlendirmeler tahmini kozmetik analizlerdir; dermatolojik teşhis yerine geçmez.
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Skin Analysis Questionnaire Modal */}
      <SkinAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        currentProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />

      {/* 2. Product Detail & Live Gemini Analysis Modal */}
      <ProductDetailModal
        product={selectedProduct}
        userProfile={userProfile}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onToggleCompare={handleToggleCompare}
        isCompared={Boolean(
          selectedProduct &&
            comparedProducts.some(
              (p) => p.barcode === selectedProduct.barcode && p.name === selectedProduct.name
            )
        )}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={Boolean(
          selectedProduct &&
            favorites.some(
              (p) => p.barcode === selectedProduct.barcode && p.name === selectedProduct.name
            )
        )}
      />

      {/* 3. Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onProductFound={(prod) => {
          setSelectedProduct(prod);
        }}
      />

      {/* 4. Custom INCI Paste Modal */}
      <CustomInciModal
        isOpen={isCustomInciModalOpen}
        onClose={() => setIsCustomInciModalOpen(false)}
        onSubmit={(customProd) => {
          setSelectedProduct(customProd);
        }}
      />

      {/* 5. Product Comparison Modal */}
      <ProductComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        comparedProducts={comparedProducts}
        onRemoveFromCompare={handleToggleCompare}
        userProfile={userProfile}
      />

      {/* 6. Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favorites={favorites}
        onSelectProduct={(prod) => setSelectedProduct(prod)}
        onRemoveFavorite={handleToggleFavorite}
      />
    </div>
  );
}
