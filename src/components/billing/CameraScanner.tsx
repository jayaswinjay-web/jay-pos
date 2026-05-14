import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Loader2, ScanLine, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface CameraScannerProps {
  products: Product[];
  onProductScanned: (product: Product) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraScanner({ products, onProductScanned, open, onOpenChange }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`camera-scanner-${Date.now()}`);
  const mountedRef = useRef(true);
  const scanCooldownRef = useRef(false);

  const handleScan = useCallback((code: string) => {
    // Prevent rapid-fire scans
    if (scanCooldownRef.current || code === lastScanned) return;
    
    scanCooldownRef.current = true;
    setLastScanned(code);
    
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 1500);

    const product = products.find(
      p => p.sku?.toLowerCase() === code.toLowerCase() || 
           p.name.toLowerCase() === code.toLowerCase()
    );

    if (product) {
      if (product.stock > 0) {
        onProductScanned(product);
        toast.success(`Added: ${product.name}`, {
          description: `Stock: ${product.stock - 1} remaining`
        });
      } else {
        toast.error(`${product.name} is out of stock`);
      }
    } else {
      toast.error(`Product not found: ${code}`);
    }
  }, [products, onProductScanned, lastScanned]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.log('Scanner cleanup:', e);
      }
      scannerRef.current = null;
    }
    if (mountedRef.current) {
      setIsScanning(false);
      setIsInitializing(false);
    }
  }, []);

  const startScanning = useCallback(async () => {
    const containerId = containerIdRef.current;
    const containerEl = document.getElementById(containerId);
    
    if (!containerEl) {
      console.error('Container not found:', containerId);
      return;
    }

    // Cleanup any existing scanner
    await stopScanning();
    
    setError(null);
    setIsInitializing(true);
    setLastScanned(null);
    
    try {
      // Wait a bit for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!mountedRef.current) return;

      scannerRef.current = new Html5Qrcode(containerId);
      
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras.length === 0) {
        throw new Error('NotFoundError: No cameras found');
      }

      if (!mountedRef.current) return;

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {} // Ignore frame errors
      );
      
      if (mountedRef.current) {
        setHasPermission(true);
        setIsScanning(true);
        setIsInitializing(false);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      
      if (mountedRef.current) {
        setIsInitializing(false);
        setIsScanning(false);
        setHasPermission(false);
        
        const errString = err.toString();
        if (errString.includes('NotAllowedError') || errString.includes('Permission')) {
          setError('Camera access denied. Please allow camera permissions in your browser settings and try again.');
        } else if (errString.includes('NotFoundError') || errString.includes('No cameras')) {
          setError('No camera found on this device. Please ensure a camera is connected.');
        } else if (errString.includes('NotReadableError')) {
          setError('Camera is in use by another application. Please close other apps using the camera.');
        } else {
          setError('Failed to start camera. Please check permissions and try again.');
        }
      }
    }
  }, [stopScanning, handleScan]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (open) {
      // Reset states when opening
      setError(null);
      setHasPermission(null);
      setLastScanned(null);
      
      // Delay start to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          startScanning();
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      stopScanning();
    }
    
    return () => {
      mountedRef.current = false;
      stopScanning();
    };
  }, [open, startScanning, stopScanning]);

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  const handleRetry = () => {
    startScanning();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Camera Barcode Scanner
          </DialogTitle>
          <DialogDescription>
            Point your camera at a barcode or QR code to scan products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Container */}
          <div 
            id={containerIdRef.current}
            className="relative w-full aspect-square bg-black rounded-lg overflow-hidden"
            style={{ minHeight: 280 }}
          >
            {isInitializing && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-white text-sm">Initializing camera...</p>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black z-10">
                <AlertCircle className="w-12 h-12 text-destructive mb-3" />
                <p className="text-white text-sm mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Scanning Indicator */}
          {isScanning && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <ScanLine className="w-4 h-4 animate-pulse text-primary" />
              <span className="text-muted-foreground">Point camera at barcode</span>
            </div>
          )}

          {/* Last Scanned */}
          {lastScanned && (
            <div className="p-2 bg-muted rounded text-center text-sm">
              <span className="text-muted-foreground">Last scanned: </span>
              <span className="font-mono font-medium">{lastScanned}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Position the barcode within the scanning area</p>
            <p>• Ensure good lighting for best results</p>
            <p>• Supports 1D barcodes (EAN, UPC, Code128) and QR codes</p>
          </div>

          <Button variant="outline" className="w-full" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Close Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}