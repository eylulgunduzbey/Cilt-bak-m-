export type SkinType = 'yağlı' | 'kuru' | 'karma' | 'normal' | 'hassas' | 'bilmiyorum';

export interface UserProfile {
  skinType: SkinType;
  problems: string[]; // ['Akne', 'Siyah Nokta', 'Kızarıklık', 'Kuruluk', 'Yağlanma', 'Leke', 'Gözenek', 'İnce Çizgiler']
  primaryNeed: string; // 'Yoğun Nemlendirme', 'Bariyer Onarımı', 'Sebum & Gözenek Dengesi', etc.
  reactionHistory: boolean;
  reactionDetails?: string;
  avoidedIngredients: string[]; // ['Parfüm/Fragrance', 'Denatüre Alkol', 'Parabenler', 'Sülfatlar', etc.]
  budget: 'Ekonomik (₺)' | 'Orta Segment / Dermokozmetik (₺₺)' | 'Lüks / Premium (₺₺₺)';
  ageRange: '18 altı' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  allergies: string; // Free text / tags
  completed: boolean;
  updatedAt: string;
}

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  ingredientsText: string;
  hasIngredients: boolean;
  inciTags?: string[];
  analysisTags?: string[];
  categories?: string;
  quantity?: string;
  packaging?: string;
  origins?: string;
}

export interface IngredientFunction {
  name: string;
  function: string;
  category: 'hydrating' | 'barrier' | 'exfoliating' | 'fragrance_sensitizer' | 'soothing' | 'antioxidant' | 'emollient' | 'preservative' | 'other';
  isHighlighted: boolean;
}

export interface CautionItem {
  ingredient: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AllergenMatch {
  allergen: string;
  foundInProduct: string;
  explanation: string;
}

export interface AnalysisResult {
  matchScore: number;
  summaryReason: string;
  whyCompatible: string[];
  potentialDrawbacks: string[];
  suitableSkinTypes: string[];
  cautionIngredients: CautionItem[];
  ingredientFunctions: IngredientFunction[];
  hydratingIngredients: string[];
  barrierSupportingIngredients: string[];
  exfoliatingIngredients: string[];
  fragranceAndSensitizers: string[];
  allergenMatches: AllergenMatch[];
  uncertainties: string[];
  usageRecommendation: string;
  scientificDisclaimer: string;
}

export interface AnalysisResponse {
  missingIngredients?: boolean;
  productName?: string;
  brand?: string;
  message?: string;
  engine?: string;
  note?: string;
  analysis: AnalysisResult | null;
}
