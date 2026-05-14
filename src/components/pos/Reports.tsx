import React from 'react';
import { usePOS } from '@/context/POSContext';
import { BarChart3, TrendingUp, Calendar, FileText } from 'lucide-react';

export function Reports() {
  const { transactions, products } = usePOS();

  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(
    t => new Date(t.date).toDateString() === today && t.status === 'completed'
  );

  const totalRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTax = todayTransactions.reduce((sum, t) => sum + t.tax, 0);
  const totalDiscount = todayTransactions.reduce((sum, t) => sum + t.discount, 0);
  const avgOrderValue = todayTransactions.length > 0 ? totalRevenue / todayTransactions.length : 0;

  const paymentBreakdown = {
    cash: todayTransactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.total, 0),
    upi: todayTransactions.filter(t => t.paymentMethod === 'upi').reduce((sum, t) => sum + t.total, 0),
    card: todayTransactions.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + t.total, 0)
  };

  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" />
          Reports & Analytics
        </h2>
        <p className="text-muted-foreground mt-1">
          <Calendar className="w-4 h-4 inline mr-1" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pos-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="pos-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{todayTransactions.length}</p>
            </div>
          </div>
        </div>

        <div className="pos-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground">₹{avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="pos-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tax</p>
              <p className="text-2xl font-bold text-foreground">₹{totalTax.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Breakdown */}
        <div className="pos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Cash</span>
                <span className="font-semibold">₹{paymentBreakdown.cash.toFixed(2)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full transition-all" 
                  style={{ width: `${totalRevenue ? (paymentBreakdown.cash / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">UPI</span>
                <span className="font-semibold">₹{paymentBreakdown.upi.toFixed(2)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${totalRevenue ? (paymentBreakdown.upi / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Card</span>
                <span className="font-semibold">₹{paymentBreakdown.card.toFixed(2)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning rounded-full transition-all" 
                  style={{ width: `${totalRevenue ? (paymentBreakdown.card / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="pos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Low Stock Alert</h3>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                  <span className={`pos-badge ${product.stock === 0 ? 'pos-badge-danger' : 'pos-badge-warning'}`}>
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">All products are well stocked!</p>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="pos-card">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Today's Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="pos-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Time</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Cashier</th>
              </tr>
            </thead>
            <tbody>
              {todayTransactions.length > 0 ? (
                todayTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.invoiceNo}</td>
                    <td>{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{t.items.length} items</td>
                    <td>₹{t.subtotal.toFixed(2)}</td>
                    <td>₹{t.tax.toFixed(2)}</td>
                    <td className="text-success">₹{t.discount.toFixed(2)}</td>
                    <td className="font-semibold text-primary">₹{t.total.toFixed(2)}</td>
                    <td className="uppercase text-xs">{t.paymentMethod}</td>
                    <td>{t.cashier}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    No transactions today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
