import { Product, UserProfile, AnalysisResponse } from '../types';

export async function searchProducts(query: string, page = 1, pageSize = 20): Promise<{ count: number; products: Product[] }> {
  const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Arama başarısız (${res.status})`);
  }
  return res.json();
}

export async function getProductByBarcode(barcode: string): Promise<Product> {
  const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
  const res = await fetch(`/api/products/barcode/${cleanBarcode}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Barkod bulunamadı (${res.status})`);
  }
  return res.json();
}

export async function analyzeProductWithProfile(product: Product, userProfile: UserProfile): Promise<AnalysisResponse> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, userProfile }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Analiz yapılamadı (${res.status})`);
  }
  return res.json();
}
