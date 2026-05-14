import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  QrCode,
  X,
  Loader2,
  Check,
  Package,
  PauseCircle,
  Keyboard,
  Grid3X3,
  Split,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// New components
import { ReceiptModal } from '@/components/receipt/ReceiptModal';
import { HeldBillsDrawer, HeldBill } from '@/components/billing/HeldBillsDrawer';
import { CustomerInput } from '@/components/billing/CustomerInput';
import { DiscountInput } from '@/components/billing/DiscountInput';
import { BarcodeScanner } from '@/components/billing/BarcodeScanner';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import { SplitPayment } from '@/components/billing/SplitPayment';
import { ReturnRefund } from '@/components/billing/ReturnRefund';
import { LoyaltyPoints } from '@/components/billing/LoyaltyPoints';

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

export function BillingView() {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart,
    getCartTotal,
    storeSettings,
    organization,
    member,
    refreshProducts,
    refreshTransactions
  } = useOrganizationContext();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // New state for world-class features
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [showReturnRefund, setShowReturnRefund] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Load held bills from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`held_bills_${organization?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHeldBills(parsed.map((b: any) => ({ ...b, heldAt: new Date(b.heldAt) })));
      } catch (e) {}
    }
  }, [organization?.id]);

  // Save held bills to localStorage
  useEffect(() => {
    if (organization?.id) {
      localStorage.setItem(`held_bills_${organization.id}`, JSON.stringify(heldBills));
    }
  }, [heldBills, organization?.id]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Uncategorized'));
    return ['all', ...Array.from(cats)];
  }, [products]);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.sku?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
                             (p.category || 'Uncategorized') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const { subtotal, tax, total: baseTotal } = getCartTotal();
  const taxRate = Number(storeSettings?.tax_rate || 18);
  
  // Calculate discount
  const discountAmount = useMemo(() => {
    let baseDiscount = discountType === 'percent' 
      ? (discount / 100) * subtotal
      : discount;
    return baseDiscount + loyaltyDiscount;
  }, [discount, discountType, subtotal, loyaltyDiscount]);

  const finalTotal = baseTotal - discountAmount;

  const handleLoyaltyRedeem = (points: number, discount: number) => {
    setLoyaltyDiscount(discount);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: storeSettings?.currency || 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Hold bill
  const handleHoldBill = useCallback(() => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const heldBill: HeldBill = {
      id: Date.now().toString(),
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        lineTotal: item.lineTotal
      })),
      total: finalTotal,
      customerName: customer?.name,
      heldAt: new Date()
    };

    setHeldBills(prev => [...prev, heldBill]);
    clearCart();
    setCustomer(null);
    setDiscount(0);
    toast.success('Bill held');
  }, [cart, finalTotal, customer, clearCart]);

  // Resume held bill
  const handleResumeBill = useCallback((bill: HeldBill) => {
    // Find matching products and add to cart
    bill.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        for (let i = 0; i < item.quantity; i++) {
          addToCart(product);
        }
      }
    });
    
    if (bill.customerName) {
      setCustomer({ name: bill.customerName, phone: '' });
    }
    
    setHeldBills(prev => prev.filter(b => b.id !== bill.id));
    toast.success('Bill resumed');
  }, [products, addToCart]);

  // Delete held bill
  const handleDeleteHeldBill = useCallback((billId: string) => {
    setHeldBills(prev => prev.filter(b => b.id !== billId));
    toast.success('Held bill deleted');
  }, []);

  const handlePayment = async (method: 'cash' | 'upi' | 'card') => {
    if (cart.length === 0) {
      toast.error('Add items to cart first');
      return;
    }
    setPaymentMethod(method);
  };

  const processPayment = async () => {
    if (!organization || !member || !paymentMethod) return;
    
    setProcessing(true);
    try {
      const { data: invoiceNo } = await supabase.rpc('generate_invoice_no', {
        _org_id: organization.id
      });

      const finalInvoiceNo = invoiceNo || `INV-${Date.now()}`;

      const { error: transError } = await supabase
        .from('transactions')
        .insert({
          organization_id: organization.id,
          invoice_no: finalInvoiceNo,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
            total: item.lineTotal
          })),
          subtotal,
          tax,
          discount: discountAmount,
          total: finalTotal,
          payment_method: paymentMethod,
          status: 'completed',
          cashier_id: member.user_id,
          cashier_name: member.display_name,
          customer_name: customer?.name || null,
          customer_phone: customer?.phone || null,
        });

      if (transError) throw transError;

      // Update stock
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.stock - item.quantity })
          .eq('id', item.id);
      }

      // Prepare receipt data
      setReceiptData({
        invoiceNo: finalInvoiceNo,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          total: item.lineTotal
        })),
        subtotal,
        tax,
        discount: discountAmount,
        total: finalTotal,
        paymentMethod,
        cashierName: member.display_name,
        date: new Date(),
        customerName: customer?.name,
        customerPhone: customer?.phone,
      });

      toast.success(`Payment successful! Invoice: ${finalInvoiceNo}`);
      clearCart();
      setShowPayment(false);
      setPaymentMethod(null);
      setCustomer(null);
      setDiscount(0);
      setShowReceipt(true);
      refreshProducts();
      refreshTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'p', ctrl: true, handler: () => cart.length > 0 && setShowPayment(true), description: 'Open Payment' },
    { key: 'h', ctrl: true, handler: handleHoldBill, description: 'Hold Bill' },
    { key: 'Escape', handler: () => { setShowPayment(false); setPaymentMethod(null); }, description: 'Close/Cancel' },
    { key: 'f', ctrl: true, handler: () => document.querySelector<HTMLInputElement>('[data-search-input]')?.focus(), description: 'Focus Search' },
    { key: '/', handler: () => setShowShortcuts(true), description: 'Show Shortcuts' },
  ], [cart.length, handleHoldBill]);

  useKeyboardShortcuts(shortcuts);

  const upiId = storeSettings?.upi_id || '9003368894@upi';
  // Remove beneficiary name (pn parameter) from QR code
  const upiLink = `upi://pay?pa=${upiId}&am=${finalTotal}&tn=POS%20Payment&cu=INR`;

  return (
    <TooltipProvider>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] animate-fade-in">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <BarcodeScanner products={products} onProductScanned={addToCart} />
            <HeldBillsDrawer 
              heldBills={heldBills}
              onResume={handleResumeBill}
              onDelete={handleDeleteHeldBill}
              formatCurrency={formatCurrency}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReturnRefund(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Returns
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode(viewMode === 'grid' ? 'compact' : 'grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowShortcuts(true)}
                >
                  <Keyboard className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard Shortcuts (/)</TooltipContent>
            </Tooltip>
          </div>

          {/* Search & Categories */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-search-input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or SKU... (Ctrl+F)"
                className="pl-10"
              />
            </div>
            
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {cat === 'all' ? 'All Products' : cat}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-auto">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Package className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className={`grid gap-3 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-3 md:grid-cols-4 xl:grid-cols-6'
              }`}>
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      product.stock > 0 
                        ? 'hover:border-primary' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (product.stock > 0) {
                        addToCart(product);
                        toast.success(`${product.name} added`);
                      } else {
                        toast.error('Out of stock');
                      }
                    }}
                  >
                    <CardContent className={`p-3 ${viewMode === 'compact' ? 'p-2' : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-medium text-foreground line-clamp-2 ${
                          viewMode === 'compact' ? 'text-xs' : 'text-sm'
                        }`}>
                          {product.name}
                        </h3>
                        <Badge 
                          variant={product.stock > 10 ? 'secondary' : product.stock > 0 ? 'outline' : 'destructive'}
                          className={`ml-1 flex-shrink-0 ${viewMode === 'compact' ? 'text-[10px] px-1' : ''}`}
                        >
                          {product.stock}
                        </Badge>
                      </div>
                      {viewMode === 'grid' && (
                        <p className="text-xs text-muted-foreground mb-1 truncate">
                          {product.category || 'Uncategorized'}
                        </p>
                      )}
                      <p className={`font-bold text-primary ${viewMode === 'compact' ? 'text-sm' : 'text-base'}`}>
                        {formatCurrency(Number(product.price))}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <Card className="w-full lg:w-96 flex flex-col max-h-[50vh] lg:max-h-full">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Current Bill</CardTitle>
              <div className="flex items-center gap-1">
                {cart.length > 0 && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleHoldBill}>
                          <PauseCircle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hold Bill (Ctrl+H)</TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Customer & Discount */}
            <div className="flex flex-wrap gap-2 mt-2">
              <CustomerInput customer={customer} onCustomerChange={setCustomer} />
              <DiscountInput 
                discount={discount}
                discountType={discountType}
                subtotal={subtotal}
                onDiscountChange={(d, t) => { setDiscount(d); setDiscountType(t); }}
                formatCurrency={formatCurrency}
              />
              <LoyaltyPoints
                customerPhone={customer?.phone}
                totalAmount={finalTotal}
                onPointsRedeemed={handleLoyaltyRedeem}
                formatCurrency={formatCurrency}
              />
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto p-4 pt-0">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Cart is empty</p>
                <p className="text-sm">Click products or scan barcode</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(Number(item.price))}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="w-16 text-right font-semibold text-sm">{formatCurrency(item.lineTotal)}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Totals & Payment */}
          <div className="border-t p-4 space-y-3 flex-shrink-0">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setShowPayment(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay {formatCurrency(finalTotal)}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    size="lg"
                    disabled={cart.length === 0}
                    onClick={() => setShowSplitPayment(true)}
                  >
                    <Split className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Split Payment</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </Card>

        {/* Payment Modal */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                {customer?.name ? `Customer: ${customer.name}` : 'Choose a payment method'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(finalTotal)}</p>
                {discountAmount > 0 && (
                  <p className="text-sm text-green-600">Includes {formatCurrency(discountAmount)} discount</p>
                )}
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
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{formatCurrency(finalTotal)}</p>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="text-center p-6 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
                      <CreditCard className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                      <p className="font-medium text-purple-700 dark:text-purple-400">Swipe or Tap Card</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-300 mt-1">{formatCurrency(finalTotal)}</p>
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

        {/* Keyboard Shortcuts Modal */}
        <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </DialogTitle>
            </DialogHeader>
            <KeyboardShortcutsHelp shortcuts={shortcuts} />
          </DialogContent>
        </Dialog>

        {/* Split Payment Modal */}
        <SplitPayment
          open={showSplitPayment}
          onOpenChange={setShowSplitPayment}
          totalAmount={finalTotal}
          formatCurrency={formatCurrency}
          onConfirm={async (payments) => {
            // Process split payment
            setProcessing(true);
            try {
              const { data: invoiceNo } = await supabase.rpc('generate_invoice_no', {
                _org_id: organization?.id
              });

              const finalInvoiceNo = invoiceNo || `INV-${Date.now()}`;

              const { error } = await supabase
                .from('transactions')
                .insert({
                  organization_id: organization?.id,
                  invoice_no: finalInvoiceNo,
                  items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    quantity: item.quantity,
                    total: item.lineTotal
                  })),
                  subtotal,
                  tax,
                  discount: discountAmount,
                  total: finalTotal,
                  payment_method: 'cash', // Primary method
                  status: 'completed',
                  cashier_id: member?.user_id,
                  cashier_name: member?.display_name,
                  customer_name: customer?.name || null,
                  customer_phone: customer?.phone || null,
                  notes: `Split payment: ${payments.map(p => `${p.method}: ${formatCurrency(p.amount)}`).join(', ')}`
                });

              if (error) throw error;

              // Update stock
              for (const item of cart) {
                await supabase
                  .from('products')
                  .update({ stock: item.stock - item.quantity })
                  .eq('id', item.id);
              }

              setReceiptData({
                invoiceNo: finalInvoiceNo,
                items: cart.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: Number(item.price),
                  total: item.lineTotal
                })),
                subtotal,
                tax,
                discount: discountAmount,
                total: finalTotal,
                paymentMethod: 'split',
                cashierName: member?.display_name || '',
                date: new Date(),
                customerName: customer?.name,
                customerPhone: customer?.phone,
              });

              toast.success(`Split payment successful! Invoice: ${finalInvoiceNo}`);
              clearCart();
              setCustomer(null);
              setDiscount(0);
              setLoyaltyDiscount(0);
              setShowReceipt(true);
              refreshProducts();
              refreshTransactions();
            } catch (error: any) {
              toast.error(error.message || 'Payment failed');
            } finally {
              setProcessing(false);
            }
          }}
        />

        {/* Return/Refund Modal */}
        <ReturnRefund
          open={showReturnRefund}
          onOpenChange={setShowReturnRefund}
          formatCurrency={formatCurrency}
        />
      </div>
    </TooltipProvider>
  );
}