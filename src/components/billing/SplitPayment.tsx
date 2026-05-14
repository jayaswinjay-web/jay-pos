import React, { useState, useMemo } from 'react';
import { Split, Plus, Trash2, Check, Banknote, QrCode, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SplitPaymentMethod {
  id: string;
  method: 'cash' | 'upi' | 'card';
  amount: number;
}

interface SplitPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  formatCurrency: (amount: number) => string;
  onConfirm: (payments: SplitPaymentMethod[]) => void;
}

const METHODS = [
  { key: 'cash' as const, icon: Banknote, label: 'Cash', color: 'text-emerald-500' },
  { key: 'upi' as const, icon: QrCode, label: 'UPI', color: 'text-blue-500' },
  { key: 'card' as const, icon: CreditCard, label: 'Card', color: 'text-purple-500' },
];

export function SplitPayment({ 
  open, 
  onOpenChange, 
  totalAmount, 
  formatCurrency,
  onConfirm 
}: SplitPaymentProps) {
  const [payments, setPayments] = useState<SplitPaymentMethod[]>([
    { id: '1', method: 'cash', amount: 0 }
  ]);

  const totalPaid = useMemo(() => 
    payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );

  const remaining = totalAmount - totalPaid;
  const isBalanced = Math.abs(remaining) < 0.01;
  const isOverpaid = remaining < -0.01;

  const addPayment = () => {
    const remainingAmount = remaining > 0 ? remaining : 0;
    setPayments(prev => [
      ...prev,
      { id: Date.now().toString(), method: 'cash', amount: remainingAmount }
    ]);
  };

  const removePayment = (id: string) => {
    if (payments.length === 1) return;
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const updatePayment = (id: string, field: 'method' | 'amount', value: any) => {
    setPayments(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: field === 'amount' ? Math.max(0, Number(value) || 0) : value } : p
    ));
  };

  const handleAutoFill = (id: string) => {
    if (remaining <= 0) return;
    setPayments(prev => prev.map(p => 
      p.id === id ? { ...p, amount: p.amount + remaining } : p
    ));
  };

  const handleConfirm = () => {
    if (!isBalanced) {
      toast.error('Total payments must equal the bill amount');
      return;
    }

    const validPayments = payments.filter(p => p.amount > 0);
    if (validPayments.length === 0) {
      toast.error('Add at least one payment');
      return;
    }

    onConfirm(validPayments);
    // Reset for next use
    setPayments([{ id: '1', method: 'cash', amount: 0 }]);
  };

  const handleClose = () => {
    setPayments([{ id: '1', method: 'cash', amount: 0 }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="w-5 h-5 text-primary" />
            Split Payment
          </DialogTitle>
          <DialogDescription>
            Split the bill across multiple payment methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total Summary */}
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Bill Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div key={payment.id} className="p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Payment {index + 1}
                  </Badge>
                  {payments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto text-destructive"
                      onClick={() => removePayment(payment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Method Selection */}
                  <div className="space-y-1">
                    <Label className="text-xs">Method</Label>
                    <div className="flex gap-1">
                      {METHODS.map(({ key, icon: Icon, color }) => (
                        <Button
                          key={key}
                          type="button"
                          variant={payment.method === key ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-9 px-2"
                          onClick={() => updatePayment(payment.id, 'method', key)}
                        >
                          <Icon className={`w-4 h-4 ${payment.method === key ? '' : color}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        type="number"
                        value={payment.amount || ''}
                        onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="h-9 pl-7 pr-12"
                      />
                      {remaining > 0 && payment.amount < remaining && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-1.5 text-xs text-primary"
                          onClick={() => handleAutoFill(payment.id)}
                        >
                          Fill
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Payment Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={addPayment}
            disabled={payments.length >= 3}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>

          {/* Summary */}
          <div className="p-3 border rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid:</span>
              <span className="font-medium">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Remaining:</span>
              <span className={`font-bold ${
                isBalanced ? 'text-emerald-500' : 
                isOverpaid ? 'text-destructive' : 'text-amber-500'
              }`}>
                {isBalanced ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Balanced
                  </span>
                ) : (
                  formatCurrency(Math.abs(remaining)) + (isOverpaid ? ' over' : '')
                )}
              </span>
            </div>
          </div>

          {/* Warning for overpayment */}
          {isOverpaid && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Payment exceeds bill total</span>
            </div>
          )}

          {/* Confirm Button */}
          <Button 
            className="w-full" 
            onClick={handleConfirm}
            disabled={!isBalanced}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm Split Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}