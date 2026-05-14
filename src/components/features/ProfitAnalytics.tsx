import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock: number;
}

interface Transaction {
  id: string;
  items: any[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  created_at: string;
  status: string;
}

interface ProfitAnalyticsProps {
  products: Product[];
  transactions: Transaction[];
  currency?: string;
}

export function ProfitAnalytics({ products, transactions, currency = 'INR' }: ProfitAnalyticsProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (t.status !== 'completed') return false;
      const date = new Date(t.created_at);
      
      switch (period) {
        case 'today':
          return date.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return date >= monthAgo;
        default:
          return true;
      }
    });
  }, [transactions, period]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const revenue = filteredTransactions.reduce((sum, t) => sum + Number(t.total), 0);
    const tax = filteredTransactions.reduce((sum, t) => sum + Number(t.tax), 0);
    const discounts = filteredTransactions.reduce((sum, t) => sum + Number(t.discount), 0);
    const orders = filteredTransactions.length;
    const avgOrderValue = orders > 0 ? revenue / orders : 0;
    
    // Estimate gross profit (assuming 30% margin - this would need cost price in real app)
    const estimatedCost = revenue * 0.7;
    const grossProfit = revenue - estimatedCost;
    const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Calculate hourly breakdown
    const hourlyRevenue: Record<number, number> = {};
    filteredTransactions.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + Number(t.total);
    });

    // Find peak hour
    const peakHour = Object.entries(hourlyRevenue)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      revenue,
      tax,
      discounts,
      orders,
      avgOrderValue,
      grossProfit,
      profitMargin,
      peakHour: peakHour ? { hour: parseInt(peakHour[0]), revenue: peakHour[1] } : null
    };
  }, [filteredTransactions]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productRevenue: Record<string, { quantity: number; revenue: number; name: string }> = {};
    
    filteredTransactions.forEach(t => {
      const items = t.items as any[];
      if (!items) return;
      
      items.forEach((item: any) => {
        const id = item.id || item.productId;
        const name = item.name || products.find(p => p.id === id)?.name || 'Unknown';
        const quantity = item.quantity || 1;
        const itemTotal = (item.price || 0) * quantity;
        
        if (!productRevenue[id]) {
          productRevenue[id] = { quantity: 0, revenue: 0, name };
        }
        productRevenue[id].quantity += quantity;
        productRevenue[id].revenue += itemTotal;
      });
    });

    return Object.entries(productRevenue)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredTransactions, products]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories: Record<string, number> = {};
    
    filteredTransactions.forEach(t => {
      const items = t.items as any[];
      if (!items) return;
      
      items.forEach((item: any) => {
        const category = item.category || 'Uncategorized';
        const quantity = item.quantity || 1;
        const itemTotal = (item.price || 0) * quantity;
        categories[category] = (categories[category] || 0) + itemTotal;
      });
    });

    return Object.entries(categories)
      .map(([name, revenue]) => ({ name, revenue, percentage: (revenue / metrics.revenue) * 100 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredTransactions, metrics.revenue]);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Profit Analytics
        </h3>
        <div className="flex gap-1">
          {(['today', 'week', 'month'] as const).map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.revenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Gross Profit</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.grossProfit)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-2 text-xs">
              {metrics.profitMargin.toFixed(1)}% margin
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Order</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.avgOrderValue)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.orders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Peak Hour</p>
                <p className="text-xl font-bold">
                  {metrics.peakHour ? formatHour(metrics.peakHour.hour) : '-'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            {metrics.peakHour && (
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(metrics.peakHour.revenue)} revenue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No sales data</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {categoryBreakdown.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No sales data</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map((category) => (
                    <div key={category.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{category.name}</p>
                        <p className="text-sm">{formatCurrency(category.revenue)}</p>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Tax Collected</span>
            </div>
            <p className="text-lg font-bold mt-1">{formatCurrency(metrics.tax)}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Discounts Given</span>
            </div>
            <p className="text-lg font-bold mt-1">{formatCurrency(metrics.discounts)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
