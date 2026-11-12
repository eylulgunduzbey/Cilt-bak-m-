import React from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Sparkles, AlertTriangle, Edit3, Droplet, CheckCircle } from 'lucide-react';

interface SkinProfileSummaryProps {
  profile: UserProfile;
  onEditProfile: () => void;
}

export const SkinProfileSummary: React.FC<SkinProfileSummaryProps> = ({ profile, onEditProfile }) => {
  // Derive suggested active ingredients based on profile
  const getSuggestedActives = (p: UserProfile): string[] => {
    const actives = new Set<string>();
    const type = p.skinType;
    const problems = p.problems || [];
    const need = p.primaryNeed || '';

    if (type === 'kuru') {
      actives.add('Ceramide NP');
      actives.add('Hyaluronic Acid');
      actives.add('Squalane');
    } else if (type === 'yağlı') {
      actives.add('Salicylic Acid (BHA)');
      actives.add('Zinc PCA');
      actives.add('Niacinamide');
    } else if (type === 'hassas') {
      actives.add('Centella Asiatica');
      actives.add('Panthenol (B5)');
      actives.add('Allantoin');
    } else if (type === 'karma') {
      actives.add('Niacinamide');
      actives.add('Hyaluronic Acid');
      actives.add('Zinc PCA');
    }

    if (problems.includes('Leke')) {
      actives.add('Alpha Arbutin');
      actives.add('Tranexamic Acid');
    }
    if (problems.includes('Kızarıklık')) {
      actives.add('Madecassoside');
      actives.add('Azelaic Acid');
    }
    if (problems.includes('İnce Çizgiler')) {
      actives.add('Peptides');
      actives.add('Adenosine');
    }

    return Array.from(actives).slice(0, 4);
  };

  const suggestedActives = getSuggestedActives(profile);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white p-5 sm:p-7 shadow-xl border border-stone-800">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: User identity card */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Aktif Cilt Profili
            </span>
            <span className="text-xs text-stone-400">
              {profile.ageRange} yaş • {profile.budget.split(' ')[0]}
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
              <span className="capitalize">{profile.skinType} Cilt</span>
              <span className="text-stone-400 font-sans text-base font-normal">
                {profile.primaryNeed}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 line-clamp-2">
              {profile.problems.length > 0 ? (
                <>
                  <span className="text-stone-400 font-medium">Hedeflenen Problemler: </span>
                  {profile.problems.join(', ')}
                </>
              ) : (
                'Dengeli günlük bakım ve koruyucu bariyer rutini.'
              )}
            </p>
          </div>

          {/* Recommended active ingredients pills */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-stone-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Önerilen Aktifler:
            </span>
            {suggestedActives.map((act) => (
              <span
                key={act}
                className="text-[11px] font-medium bg-stone-800/80 hover:bg-stone-700/80 text-rose-200 border border-stone-700 px-2.5 py-1 rounded-lg transition"
              >
                {act}
              </span>
            ))}
          </div>

          {/* Avoided warnings if any */}
          {(profile.avoidedIngredients.length > 0 || profile.allergies) && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-800/50 rounded-xl px-3 py-1.5 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>
                Filtrelenen maddeler:{' '}
                {profile.avoidedIngredients.slice(0, 3).join(', ')}
                {profile.avoidedIngredients.length > 3 ? '...' : ''}
                {profile.allergies ? ` (${profile.allergies.slice(0, 20)}...)` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Right: Action and Edit */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2.5 border-t md:border-t-0 border-stone-800 pt-4 md:pt-0 shrink-0">
          <button
            onClick={onEditProfile}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-stone-900 hover:bg-stone-100 text-xs sm:text-sm font-semibold shadow-md transition"
          >
            <Edit3 className="w-4 h-4 text-rose-600" />
            Cilt Profilini Düzenle
          </button>
          <div className="text-[11px] text-stone-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Ürün analizleri bu profile göre uyarlanıyor
          </div>
        </div>
      </div>
    </div>
  );
};
