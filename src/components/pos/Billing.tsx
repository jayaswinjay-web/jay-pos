import React, { useState } from 'react';
import { usePOS } from '@/context/POSContext';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

const UPI_ID = '9003368894@upi';

export function Billing() {
  const { products, cart, addToCart, updateCartQuantity, removeFromCart, clearCart, getCartTotal, processPayment } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showUPIQR, setShowUPIQR] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const { subtotal, tax, total } = getCartTotal();
  const finalTotal = total - discount;

  const generateUPILink = () => {
    return `upi://pay?pa=${UPI_ID}&pn=JAY%20POS&am=${finalTotal.toFixed(2)}&tn=POS%20Payment&cu=INR`;
  };

  const handlePayment = (method: 'cash' | 'upi' | 'card') => {
    if (method === 'upi') {
      setShowUPIQR(true);
      return;
    }
    
    const transaction = processPayment(method, discount);
    if (transaction) {
      setShowPayment(false);
      setDiscount(0);
    }
  };

  const confirmUPIPayment = () => {
    const transaction = processPayment('upi', discount);
    if (transaction) {
      setShowUPIQR(false);
      setShowPayment(false);
      setDiscount(0);
    }
  };

  return (
    <div className="animate-fade-in h-full flex gap-6">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Billing</h2>
          <div className="flex gap-2">
            <button onClick={clearCart} className="pos-btn-outline text-sm">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="space-y-4 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="pos-input pl-12"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => product.stock > 0 && addToCart(product)}
                className={`pos-product-card ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <h4 className="font-semibold text-foreground text-sm line-clamp-2">{product.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-primary">₹{product.price.toLocaleString()}</span>
                  <span className={`pos-badge text-xs ${
                    product.stock > 10 ? 'pos-badge-success' : 
                    product.stock > 0 ? 'pos-badge-warning' : 'pos-badge-danger'
                  }`}>
                    {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col">
        <div className="pos-card flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Current Bill</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No items in cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="w-20 text-right">
                      <p className="font-semibold text-foreground">₹{item.total.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="pos-btn-success w-full py-4 text-lg"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Payment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center p-6 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
              <p className="text-4xl font-bold text-primary">₹{finalTotal.toFixed(2)}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Discount (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                className="pos-input"
                placeholder="Enter discount amount"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handlePayment('cash')}
                  className="pos-btn-outline flex-col py-6 hover:border-success hover:text-success"
                >
                  <Banknote className="w-8 h-8 mb-2" />
                  <span>Cash</span>
                </button>
                <button
                  onClick={() => handlePayment('upi')}
                  className="pos-btn-outline flex-col py-6 hover:border-primary hover:text-primary"
                >
                  <QrCode className="w-8 h-8 mb-2" />
                  <span>UPI</span>
                </button>
                <button
                  onClick={() => handlePayment('card')}
                  className="pos-btn-outline flex-col py-6 hover:border-warning hover:text-warning"
                >
                  <CreditCard className="w-8 h-8 mb-2" />
                  <span>Card</span>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPI QR Code Modal */}
      <Dialog open={showUPIQR} onOpenChange={setShowUPIQR}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Scan to Pay via UPI</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG 
                  value={generateUPILink()} 
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-2">₹{finalTotal.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">UPI ID: {UPI_ID}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmUPIPayment}
                className="pos-btn-success w-full py-3"
              >
                <Check className="w-5 h-5" />
                Payment Received
              </button>
              <button
                onClick={() => setShowUPIQR(false)}
                className="pos-btn-outline w-full py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
