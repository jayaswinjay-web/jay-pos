import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Barcode, ScanLine, Keyboard, Camera, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { CameraScanner } from './CameraScanner';

type Product = Tables<'products'>;

interface BarcodeScannerProps {
  products: Product[];
  onProductScanned: (product: Product) => void;
}

export function BarcodeScanner({ products, onProductScanned }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play beep sound on successful scan
  const playBeep = useCallback((success: boolean) => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = success ? 800 : 300;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  const searchProduct = useCallback((code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    const product = products.find(
      p => p.sku?.toLowerCase() === trimmedCode.toLowerCase() || 
           p.name.toLowerCase().includes(trimmedCode.toLowerCase())
    );

    if (product) {
      if (product.stock > 0) {
        onProductScanned(product);
        playBeep(true);
        toast.success(`Added: ${product.name}`, {
          description: `Price: ₹${product.price}`
        });
      } else {
        playBeep(false);
        toast.error(`${product.name} is out of stock`);
      }
      setBarcodeInput('');
    } else {
      playBeep(false);
      toast.error(`Product not found: ${trimmedCode}`);
    }
  }, [products, onProductScanned, playBeep]);

  // Handle barcode scanner input (rapid keystrokes)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isListening) return;
    
    // Ignore if focus is on an input field (except our barcode input)
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      if (!target.getAttribute('data-barcode-input')) {
        return;
      }
    }
    
    const now = Date.now();
    
    // If too much time has passed, reset buffer (barcode scanners are fast)
    if (now - lastKeyTime.current > 100) {
      barcodeBuffer.current = '';
    }
    lastKeyTime.current = now;

    if (e.key === 'Enter') {
      if (barcodeBuffer.current.length >= 3) {
        searchProduct(barcodeBuffer.current);
      }
      barcodeBuffer.current = '';
      e.preventDefault();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      barcodeBuffer.current += e.key;
    }
  }, [isListening, searchProduct]);

  useEffect(() => {
    if (isListening) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isListening, handleKeyDown]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      searchProduct(barcodeInput.trim());
    }
  };

  const toggleListening = () => {
    const newState = !isListening;
    setIsListening(newState);
    if (newState) {
      toast.success('Scanner mode activated', {
        description: 'Ready to receive barcode input'
      });
    } else {
      toast.info('Scanner mode deactivated');
    }
  };

  return (
    <>
      <Button 
        variant={isListening ? 'default' : 'outline'} 
        size="sm" 
        onClick={toggleListening}
        className={`gap-1.5 h-8 ${isListening ? 'animate-pulse' : ''}`}
      >
        <Barcode className="w-3.5 h-3.5" />
        <span className="text-xs">{isListening ? 'Scanning...' : 'Scanner'}</span>
      </Button>

      <Button 
        variant="outline" 
        size="sm"
        className="gap-1.5 h-8"
        onClick={() => setShowCamera(true)}
      >
        <Camera className="w-3.5 h-3.5" />
        <span className="text-xs">Camera</span>
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <Keyboard className="w-4 h-4" />
      </Button>

      {/* Camera Scanner */}
      <CameraScanner
        products={products}
        onProductScanned={onProductScanned}
        open={showCamera}
        onOpenChange={setShowCamera}
      />

      {/* Manual Entry Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Manual Barcode Entry
            </DialogTitle>
            <DialogDescription>
              Enter product SKU or name to add to cart
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                data-barcode-input="true"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Enter SKU or product name..."
                autoFocus
                className="flex-1"
              />
              <Button type="submit">
                Add
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="gap-2"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Type SKU code and press Enter</p>
              <p>• Or type product name to search</p>
              <p>• Use Camera button for mobile scanning</p>
              <p>• Physical barcode scanners work when scanner mode is on</p>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-sm">
                <ScanLine className="w-4 h-4 text-primary animate-pulse" />
                <span>Scanner mode active - scan a barcode</span>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}