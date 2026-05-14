import React, { useState } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Package, 
  DollarSign,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfitAnalytics } from '@/components/features/ProfitAnalytics';

export function DashboardView() {
  const { products, transactions, storeSettings } = useOrganizationContext();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Calculate stats
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => 
    new Date(t.created_at).toDateString() === today && t.status === 'completed'
  );
  
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const todayOrders = todayTransactions.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10);

  // Calculate week stats for comparison
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const lastWeekSameDay = new Date(weekAgo);
  const lastWeekTransactions = transactions.filter(t => 
    new Date(t.created_at).toDateString() === lastWeekSameDay.toDateString() && t.status === 'completed'
  );
  const lastWeekRevenue = lastWeekTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const revenueChange = lastWeekRevenue > 0 
    ? ((todayRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: storeSettings?.currency || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button
          variant={showAnalytics ? "default" : "outline"}
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {showAnalytics ? 'Hide' : 'Show'} Analytics
        </Button>
      </div>

      {/* Profit Analytics Panel */}
      {showAnalytics && (
        <ProfitAnalytics 
          products={products}
          transactions={transactions.map(t => ({
            ...t,
            items: Array.isArray(t.items) ? t.items : []
          }))}
          currency={storeSettings?.currency || 'INR'}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(todayRevenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(revenueChange).toFixed(0)}% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold text-foreground">{todayOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Updated just now</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <ArrowUpRight className="w-4 h-4" />
              <span>Active in inventory</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-foreground">{lowStockProducts.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-amber-500">
              <TrendingDown className="w-4 h-4" />
              <span>Needs attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Start billing to see transactions here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.invoice_no}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(Number(transaction.total))}</p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All products stocked well</p>
                <p className="text-sm">No items need restocking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <Badge variant={product.stock === 0 ? 'destructive' : 'outline'}>
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
