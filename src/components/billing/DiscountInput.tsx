import React, { useState } from 'react';
import { Percent, Tag, Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiscountInputProps {
  discount: number;
  discountType: 'amount' | 'percent';
  subtotal: number;
  onDiscountChange: (discount: number, type: 'amount' | 'percent') => void;
  formatCurrency: (amount: number) => string;
}

const QUICK_PERCENTS = [5, 10, 15, 20];
const QUICK_AMOUNTS = [50, 100, 200, 500];

export function DiscountInput({ 
  discount, 
  discountType, 
  subtotal, 
  onDiscountChange,
  formatCurrency 
}: DiscountInputProps) {
  const [open, setOpen] = useState(false);
  const [localDiscount, setLocalDiscount] = useState(discount);
  const [localType, setLocalType] = useState<'amount' | 'percent'>(discountType);

  const calculatedDiscount = localType === 'percent' 
    ? (localDiscount / 100) * subtotal 
    : localDiscount;

  const maxPercent = 50; // Max 50% discount
  const maxAmount = subtotal * 0.5; // Max 50% of subtotal

  const handleApply = () => {
    const finalDiscount = localType === 'percent'
      ? Math.min(localDiscount, maxPercent)
      : Math.min(localDiscount, maxAmount);
    
    onDiscountChange(finalDiscount, localType);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalDiscount(0);
    onDiscountChange(0, 'amount');
    setOpen(false);
  };

  const handleQuickDiscount = (value: number, type: 'amount' | 'percent') => {
    setLocalDiscount(value);
    setLocalType(type);
    onDiscountChange(value, type);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLocalDiscount(discount);
      setLocalType(discountType);
    }
  };

  const currentDiscountAmount = discountType === 'percent' 
    ? (discount / 100) * subtotal 
    : discount;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant={discount > 0 ? 'default' : 'outline'} 
          size="sm" 
          className="gap-1.5 h-8"
        >
          <Tag className="w-3.5 h-3.5" />
          {discount > 0 ? (
            <>
              <span className="text-xs">
                {discountType === 'percent' ? `${discount}%` : formatCurrency(discount)}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">
                -{formatCurrency(currentDiscountAmount)}
              </Badge>
            </>
          ) : (
            <span className="text-muted-foreground text-xs">Discount</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <h4 className="font-medium">Apply Discount</h4>
            </div>
            {discount > 0 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <Tabs value={localType} onValueChange={(v) => setLocalType(v as 'amount' | 'percent')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="percent" className="gap-1">
                <Percent className="w-3 h-3" />
                Percent
              </TabsTrigger>
              <TabsTrigger value="amount" className="gap-1">
                <Tag className="w-3 h-3" />
                Amount
              </TabsTrigger>
            </TabsList>

            <TabsContent value="percent" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Percentage</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={localDiscount || ''}
                    onChange={(e) => setLocalDiscount(Math.min(Number(e.target.value), maxPercent))}
                    placeholder="0"
                    max={maxPercent}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {QUICK_PERCENTS.map(pct => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleQuickDiscount(pct, 'percent')}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="amount" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={localDiscount || ''}
                    onChange={(e) => setLocalDiscount(Math.min(Number(e.target.value), maxAmount))}
                    placeholder="0"
                    max={maxAmount}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {QUICK_AMOUNTS.filter(amt => amt <= maxAmount || maxAmount === 0).map(amt => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleQuickDiscount(amt, 'amount')}
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {calculatedDiscount > 0 && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700 dark:text-emerald-400">Discount:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-300">
                  -{formatCurrency(calculatedDiscount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" className="flex-1" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}