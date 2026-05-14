import React, { useState, useMemo } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  Plus, 
  DollarSign,
  Loader2,
  Check,
  Minus,
  Trash2,
  Calculator,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { ReceiptModal } from '@/components/receipt/ReceiptModal';
import { CustomerInput } from '@/components/billing/CustomerInput';

const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

interface QuickItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
}

interface ReceiptData {
  invoiceNo: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashierName: string;
  date: Date;
  customerPhone?: string;
  customerName?: string;
}

export function QuickBillView() {
  const { organization, member, storeSettings, refreshTransactions } = useOrganizationContext();
  const [customItem, setCustomItem] = useState({ name: '', price: '' });
  const [quickCart, setQuickCart] = useState<QuickItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: storeSettings?.currency || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const taxRate = Number(storeSettings?.tax_rate || 18) / 100;
  
  const totals = useMemo(() => {
    const itemsTotal = quickCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const subtotal = itemsTotal / (1 + taxRate);
    const tax = itemsTotal - subtotal;
    return { subtotal, tax, total: itemsTotal };
  }, [quickCart, taxRate]);

  const addQuickAmount = (amount: number) => {
    const id = Date.now().toString();
    setQuickCart(prev => [...prev, {
      id,
      name: `Quick Item`,
      price: amount,
      quantity: 1
    }]);
  };

  const addCustomItem = () => {
    if (!customItem.name.trim() || !customItem.price) {
      toast.error('Enter item name and price');
      return;
    }
    
    const price = parseFloat(customItem.price);
    if (price <= 0) {
      toast.error('Enter a valid price');
      return;
    }

    setQuickCart(prev => [...prev, {
      id: Date.now().toString(),
      name: customItem.name.trim(),
      price,
      quantity: 1
    }]);
    setCustomItem({ name: '', price: '' });
    toast.success('Item added');
  };

  const updateQuantity = (id: string, delta: number) => {
    setQuickCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setQuickCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setQuickCart([]);
    setCustomer(null);
  };

  const handlePayment = (method: 'cash' | 'upi' | 'card') => {
    if (quickCart.length === 0) {
      toast.error('Add items first');
      return;
    }
    setPaymentMethod(method);
  };

  const processPayment = async () => {
    if (!organization || !member || !paymentMethod || quickCart.length === 0) return;
    
    setProcessing(true);
    try {
      const { data: invoiceNo } = await supabase.rpc('generate_invoice_no', {
        _org_id: organization.id
      });

      const finalInvoiceNo = invoiceNo || `INV-${Date.now()}`;

      const { error } = await supabase
        .from('transactions')
        .insert({
          organization_id: organization.id,
          invoice_no: finalInvoiceNo,
          items: quickCart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          })),
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: 0,
          total: totals.total,
          payment_method: paymentMethod,
          status: 'completed',
          cashier_id: member.user_id,
          cashier_name: member.display_name,
          customer_name: customer?.name || null,
          customer_phone: customer?.phone || null,
        });

      if (error) throw error;
      
      // Prepare receipt
      setReceiptData({
        invoiceNo: finalInvoiceNo,
        items: quickCart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: 0,
        total: totals.total,
        paymentMethod,
        cashierName: member.display_name,
        date: new Date(),
        customerName: customer?.name,
        customerPhone: customer?.phone,
      });

      toast.success(`Bill created: ${formatCurrency(totals.total)}`);
      clearCart();
      setShowPayment(false);
      setPaymentMethod(null);
      setShowReceipt(true);
      refreshTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create bill');
    } finally {
      setProcessing(false);
    }
  };

  const upiId = storeSettings?.upi_id || '9003368894@upi';
  // Remove beneficiary name (pn parameter) from QR code
  const upiLink = `upi://pay?pa=${upiId}&am=${totals.total}&tn=Quick%20Bill&cu=INR`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Zap className="w-7 h-7 text-primary" />
            Quick Bill
          </h2>
          <p className="text-muted-foreground mt-1">Create instant bills with quick amounts</p>
        </div>
        <CustomerInput customer={customer} onCustomerChange={setCustomer} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Amounts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Quick Amounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {quickAmounts.map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  className="h-16 text-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => addQuickAmount(amount)}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            {/* Custom Item Entry */}
            <div className="mt-6 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Custom Item
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={customItem.name}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                  className="flex-1"
                />
                <div className="relative w-full sm:w-32">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={customItem.price}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Price"
                    className="pl-8"
                  />
                </div>
                <Button onClick={addCustomItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Bill Items</CardTitle>
              {quickCart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {quickCart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No items yet</p>
                <p className="text-sm">Click quick amounts to add</p>
              </div>
            ) : (
              <div className="space-y-2">
                {quickCart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="w-16 text-right font-semibold text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Totals */}
          {quickCart.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({storeSettings?.tax_rate || 18}%)</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowPayment(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay {formatCurrency(totals.total)}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              {customer?.name ? `Customer: ${customer.name}` : 'Quick Bill Payment'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totals.total)}</p>
            </div>

            {!paymentMethod ? (
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handlePayment('cash')}
                >
                  <Banknote className="w-8 h-8 text-emerald-500" />
                  <span>Cash</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handlePayment('upi')}
                >
                  <QrCode className="w-8 h-8 text-blue-500" />
                  <span>UPI</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handlePayment('card')}
                >
                  <CreditCard className="w-8 h-8 text-purple-500" />
                  <span>Card</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethod === 'upi' && (
                  <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border">
                    <QRCodeSVG value={upiLink} size={180} />
                    <p className="text-sm text-muted-foreground">Scan to pay via UPI</p>
                    <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {upiId}
                    </p>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    <Banknote className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Collect Cash</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{formatCurrency(totals.total)}</p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="text-center p-6 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
                    <CreditCard className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <p className="font-medium text-purple-700 dark:text-purple-400">Swipe or Tap Card</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-300 mt-1">{formatCurrency(totals.total)}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setPaymentMethod(null)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={processPayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal 
        open={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        receiptData={receiptData}
      />
    </div>
  );
}