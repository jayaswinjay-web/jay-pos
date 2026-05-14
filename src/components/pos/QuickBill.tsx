import React, { useState } from 'react';
import { usePOS } from '@/context/POSContext';
import { Zap, Plus, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export function QuickBill() {
  const { addToCart, products } = usePOS();
  const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: '1' });

  // Get popular/frequently used products (just show first 8)
  const quickProducts = products.slice(0, 8);

  const handleAddManualItem = () => {
    if (!manualItem.name || !manualItem.price) {
      toast.error('Please fill in item name and price');
      return;
    }
    
    const customProduct = {
      id: Date.now(),
      name: manualItem.name,
      price: parseFloat(manualItem.price),
      stock: 999,
      category: 'Quick Item',
      sku: `QI-${Date.now()}`
    };
    
    addToCart(customProduct, parseInt(manualItem.quantity) || 1);
    setManualItem({ name: '', price: '', quantity: '1' });
    toast.success('Item added to cart');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Zap className="w-7 h-7 text-warning" />
          Quick Bill
        </h2>
        <p className="text-muted-foreground mt-1">Fast billing with popular items and manual entry</p>
      </div>

      {/* Manual Item Entry */}
      <div className="pos-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Add Manual Item
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-2 block">Item Name</label>
            <input
              type="text"
              value={manualItem.name}
              onChange={(e) => setManualItem(prev => ({ ...prev, name: e.target.value }))}
              className="pos-input"
              placeholder="Enter item name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Price (₹)</label>
            <input
              type="number"
              value={manualItem.price}
              onChange={(e) => setManualItem(prev => ({ ...prev, price: e.target.value }))}
              className="pos-input"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Quantity</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={manualItem.quantity}
                onChange={(e) => setManualItem(prev => ({ ...prev, quantity: e.target.value }))}
                className="pos-input"
                min="1"
              />
              <button onClick={handleAddManualItem} className="pos-btn-primary px-6">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Products */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Add Products</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickProducts.map(product => (
            <button
              key={product.id}
              onClick={() => product.stock > 0 && addToCart(product)}
              disabled={product.stock === 0}
              className="pos-product-card text-left disabled:opacity-50"
            >
              <h4 className="font-semibold text-foreground text-sm line-clamp-2">{product.name}</h4>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-primary">₹{product.price.toLocaleString()}</span>
                <span className={`pos-badge text-xs ${
                  product.stock > 10 ? 'pos-badge-success' : 
                  product.stock > 0 ? 'pos-badge-warning' : 'pos-badge-danger'
                }`}>
                  {product.stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="pos-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Amount Entry</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {[10, 20, 50, 100, 200, 500, 1000, 2000].map(amount => (
            <button
              key={amount}
              onClick={() => {
                const quickItem = {
                  id: Date.now(),
                  name: `Item ₹${amount}`,
                  price: amount,
                  stock: 999,
                  category: 'Quick Amount',
                  sku: `QA-${Date.now()}`
                };
                addToCart(quickItem);
              }}
              className="pos-btn-outline py-4 font-semibold"
            >
              ₹{amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
