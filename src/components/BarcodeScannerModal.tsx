import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Scan, Search, AlertCircle, Sparkles, Flashlight, ArrowRight } from 'lucide-react';
import { getProductByBarcode } from '../services/api';
import { Product } from '../types';
import { POPULAR_VERIFIED_PRODUCTS } from '../utils/sampleData';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductFound,
}) => {
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualBarcode('');
      setErrorMessage(null);
      setCameraError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Kamera erişimine izin verilmedi veya kamera bulunamadı. Lütfen barkod numarasını manuel giriniz.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startScanningLoop = () => {
    // If browser supports BarcodeDetector API
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        });

        intervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const detected = barcodes[0].rawValue;
                if (detected) {
                  stopCamera();
                  handleQueryBarcode(detected);
                }
              }
            } catch (err) {
              // Ignore frame errors
            }
          }
        }, 500);
      } catch (e) {
        console.warn('BarcodeDetector initialization failed', e);
      }
    }
  };

  const handleQueryBarcode = async (barcodeToQuery: string) => {
    const clean = barcodeToQuery.trim().replace(/[^0-9]/g, '');
    if (!clean) {
      setErrorMessage('Lütfen geçerli bir barkod numarası giriniz.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // First check local sample cache for instant match
      const localMatch = POPULAR_VERIFIED_PRODUCTS.find((p) => p.barcode === clean);
      if (localMatch) {
        setIsLoading(false);
        onProductFound(localMatch);
        onClose();
        return;
      }

      // Query Open Beauty Facts API via our proxy
      const product = await getProductByBarcode(clean);
      setIsLoading(false);
      onProductFound(product);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        err.message || 'Bu barkod Open Beauty Facts veritabanında bulunamadı. Lütfen barkodu kontrol ediniz veya ürünü manuel arayınız.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                Barkodla Ürün Sorgula
              </h3>
              <p className="text-[11px] text-stone-500">
                Open Beauty Facts Veritabanı Entegrasyonu
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Camera Scanner View */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 w-full bg-stone-900 rounded-2xl overflow-hidden flex items-center justify-center border border-stone-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-800 text-rose-400 mx-auto flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-stone-400 max-w-xs">
                    Kozmetik kutusundaki barkodu doğrudan kameraya okutmak için kamerayı başlatın.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Kamerayı Başlat
                  </button>
                </div>
              )}

              {/* Laser animation overlay when camera is active */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-3/4 h-3/5 border-2 border-rose-500/80 rounded-2xl relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                  </div>
                  <span className="text-[10px] text-white/90 bg-stone-900/70 px-2 py-0.5 rounded-full mt-2">
                    Barkodu çerçevenin içine hizalayınız
                  </span>
                </div>
              )}

              {cameraActive && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-stone-900/80 text-white text-xs hover:bg-stone-800 transition"
                >
                  Kamerayı Kapat
                </button>
              )}
            </div>

            {cameraError && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                {cameraError}
              </p>
            )}
          </div>

          {/* Manual Barcode Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              Veya Barkod Numarasını Girin (8-13 Haneli):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQueryBarcode(manualBarcode)}
                placeholder="Örn: 3337875598996"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
              />
              <button
                type="button"
                onClick={() => handleQueryBarcode(manualBarcode)}
                disabled={isLoading || !manualBarcode.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                {isLoading ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                Sorgula
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Click Verified Barcodes */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Hızlı Test: Popüler Barkodlar
            </span>
            <div className="space-y-1.5">
              {POPULAR_VERIFIED_PRODUCTS.slice(0, 4).map((p) => (
                <button
                  key={p.barcode}
                  type="button"
                  onClick={() => handleQueryBarcode(p.barcode)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 hover:bg-rose-50/70 border border-stone-200/80 hover:border-rose-200 text-left transition flex items-center justify-between group"
                >
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-stone-900 group-hover:text-rose-600 block line-clamp-1">
                      {p.brand} - {p.name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Barkod: {p.barcode}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
