import React, { useState, useEffect, useMemo } from 'react';
import { Award, Gift, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface LoyaltyPointsProps {
  customerPhone?: string;
  totalAmount: number;
  onPointsRedeemed: (points: number, discount: number) => void;
  formatCurrency: (amount: number) => string;
}

// Points configuration
const POINTS_PER_100 = 5;
const POINT_VALUE = 1;

// Simple storage key for loyalty points (per phone number)
const getStorageKey = (phone: string) => `loyalty_points_${phone.replace(/\D/g, '')}`;

export function LoyaltyPoints({ 
  customerPhone, 
  totalAmount, 
  onPointsRedeemed,
  formatCurrency 
}: LoyaltyPointsProps) {
  const [open, setOpen] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  // Load customer points from localStorage
  useEffect(() => {
    if (customerPhone) {
      setLoading(true);
      const cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const stored = localStorage.getItem(getStorageKey(cleanPhone));
        if (stored) {
          setCustomerPoints(parseInt(stored, 10) || 0);
        } else {
          // New customer starts with welcome bonus
          const welcomeBonus = 50;
          localStorage.setItem(getStorageKey(cleanPhone), String(welcomeBonus));
          setCustomerPoints(welcomeBonus);
        }
      }
      setLoading(false);
      setRedeemed(false);
      setRedeemPoints(0);
    } else {
      setCustomerPoints(0);
      setRedeemed(false);
    }
  }, [customerPhone]);

  const pointsToEarn = useMemo(() => 
    Math.floor(totalAmount / 100) * POINTS_PER_100,
    [totalAmount]
  );
  
  const maxRedeemable = useMemo(() => 
    Math.min(customerPoints, Math.floor(totalAmount / POINT_VALUE)),
    [customerPoints, totalAmount]
  );

  const handleRedeem = () => {
    if (redeemPoints <= 0) {
      toast.error('Enter points to redeem');
      return;
    }
    
    if (redeemPoints > maxRedeemable) {
      toast.error(`Maximum redeemable: ${maxRedeemable} points`);
      return;
    }

    if (!customerPhone) return;

    const discount = redeemPoints * POINT_VALUE;
    const cleanPhone = customerPhone.replace(/\D/g, '');
    
    // Update stored points (deduct redeemed + add earned)
    const newPoints = customerPoints - redeemPoints + pointsToEarn;
    localStorage.setItem(getStorageKey(cleanPhone), String(newPoints));
    
    onPointsRedeemed(redeemPoints, discount);
    setRedeemed(true);
    toast.success(`Redeemed ${redeemPoints} points`, {
      description: `${formatCurrency(discount)} discount applied`
    });
    setOpen(false);
    setRedeemPoints(0);
    setCustomerPoints(prev => prev - redeemPoints);
  };

  const handleEarnOnly = () => {
    if (!customerPhone || pointsToEarn <= 0) return;
    
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const newPoints = customerPoints + pointsToEarn;
    localStorage.setItem(getStorageKey(cleanPhone), String(newPoints));
    
    toast.success(`${pointsToEarn} points will be added after purchase`);
    setOpen(false);
  };

  if (!customerPhone) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground text-xs">
        <Award className="w-3.5 h-3.5 mr-1" />
        Add customer for loyalty
      </Button>
    );
  }

  const cleanPhone = customerPhone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground text-xs">
        <Award className="w-3.5 h-3.5 mr-1" />
        Enter valid phone
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium">{customerPoints}</span>
          <span className="text-muted-foreground text-xs">pts</span>
          {pointsToEarn > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              +{pointsToEarn}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="font-semibold">Loyalty Rewards</h4>
              <p className="text-xs text-muted-foreground">Phone: {customerPhone}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Customer Points */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Available Points</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{customerPoints}</p>
                    <p className="text-xs text-muted-foreground">
                      Worth {formatCurrency(customerPoints * POINT_VALUE)}
                    </p>
                  </div>
                  <Gift className="w-10 h-10 text-amber-500/30" />
                </div>
              </div>

              {/* Points to Earn */}
              {pointsToEarn > 0 && (
                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-900">
                  <span className="text-sm text-emerald-700 dark:text-emerald-400">
                    Points earned this purchase:
                  </span>
                  <Badge className="bg-emerald-500">
                    <Plus className="w-3 h-3 mr-1" />
                    {pointsToEarn}
                  </Badge>
                </div>
              )}

              {/* Redeem Section */}
              {!redeemed && customerPoints > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Redeem Points</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={redeemPoints || ''}
                        onChange={(e) => setRedeemPoints(Math.min(Number(e.target.value), maxRedeemable))}
                        placeholder="0"
                        max={maxRedeemable}
                        className="pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        / {maxRedeemable}
                      </span>
                    </div>
                    <Button 
                      onClick={handleRedeem} 
                      disabled={redeemPoints <= 0}
                      size="sm"
                    >
                      Redeem
                    </Button>
                  </div>
                  {redeemPoints > 0 && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Discount: {formatCurrency(redeemPoints * POINT_VALUE)}
                    </p>
                  )}
                </div>
              )}

              {redeemed && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Points redeemed successfully
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              {!redeemed && customerPoints > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 100].filter(v => v <= maxRedeemable).map(value => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => setRedeemPoints(value)}
                      className="text-xs"
                    >
                      {value} pts
                    </Button>
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>• Earn {POINTS_PER_100} points for every ₹100 spent</p>
                <p>• Each point = ₹{POINT_VALUE} discount</p>
                <p>• Points never expire</p>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}