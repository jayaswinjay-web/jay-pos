import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Clock, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  created_at: string;
  customer_phone?: string;
}

interface SmartSuggestionsProps {
  products: Product[];
  transactions: Transaction[];
  currentCart: { productId: string; quantity: number }[];
  customerPhone?: string;
  onAddProduct: (product: Product) => void;
}

export function SmartSuggestions({
  products,
  transactions,
  currentCart,
  customerPhone,
  onAddProduct
}: SmartSuggestionsProps) {
  // Calculate frequently bought together
  const frequentlyBoughtTogether = useMemo(() => {
    const cartProductIds = currentCart.map(item => item.productId);
    if (cartProductIds.length === 0) return [];

    const coOccurrences: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const items = transaction.items as any[];
      if (!items) return;
      
      const productIds = items.map((item: any) => item.id || item.productId);
      const hasCartItem = cartProductIds.some(id => productIds.includes(id));
      
      if (hasCartItem) {
        productIds.forEach((id: string) => {
          if (!cartProductIds.includes(id)) {
            coOccurrences[id] = (coOccurrences[id] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(coOccurrences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => products.find(p => p.id === id))
      .filter(Boolean) as Product[];
  }, [currentCart, transactions, products]);

  // Customer's previous purchases
  const customerFavorites = useMemo(() => {
    if (!customerPhone) return [];
    
    const productCounts: Record<string, number> = {};
    
    transactions
      .filter(t => t.customer_phone === customerPhone)
      .forEach(transaction => {
        const items = transaction.items as any[];
        if (!items) return;
        
        items.forEach((item: any) => {
          const id = item.id || item.productId;
          productCounts[id] = (productCounts[id] || 0) + (item.quantity || 1);
        });
      });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => products.find(p => p.id === id))
      .filter(Boolean) as Product[];
  }, [customerPhone, transactions, products]);

  // Top selling products today
  const topSelling = useMemo(() => {
    const today = new Date().toDateString();
    const productCounts: Record<string, number> = {};
    
    transactions
      .filter(t => new Date(t.created_at).toDateString() === today)
      .forEach(transaction => {
        const items = transaction.items as any[];
        if (!items) return;
        
        items.forEach((item: any) => {
          const id = item.id || item.productId;
          productCounts[id] = (productCounts[id] || 0) + (item.quantity || 1);
        });
      });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id]) => products.find(p => p.id === id))
      .filter(Boolean) as Product[];
  }, [transactions, products]);

  // Time-based suggestions (peak hour items)
  const timeBasedSuggestions = useMemo(() => {
    const currentHour = new Date().getHours();
    const productCounts: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const transactionHour = new Date(transaction.created_at).getHours();
      // Within 2 hours of current time
      if (Math.abs(transactionHour - currentHour) <= 2) {
        const items = transaction.items as any[];
        if (!items) return;
        
        items.forEach((item: any) => {
          const id = item.id || item.productId;
          productCounts[id] = (productCounts[id] || 0) + 1;
        });
      }
    });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => products.find(p => p.id === id))
      .filter(Boolean) as Product[];
  }, [transactions, products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const SuggestionCard = ({ 
    title, 
    icon: Icon, 
    items, 
    emptyMessage 
  }: { 
    title: string; 
    icon: React.ElementType; 
    items: Product[]; 
    emptyMessage: string;
  }) => (
    <Card className="flex-1 min-w-[250px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {items.map(product => (
              <Button
                key={product.id}
                variant="ghost"
                size="sm"
                className="w-full justify-between h-auto py-2 px-2"
                onClick={() => onAddProduct(product)}
                disabled={product.stock === 0}
              >
                <div className="text-left">
                  <p className="text-xs font-medium truncate max-w-[120px]">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                </div>
                {product.stock <= 5 && (
                  <Badge variant="outline" className="text-[10px]">
                    {product.stock} left
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {frequentlyBoughtTogether.length > 0 && (
        <SuggestionCard
          title="Frequently Bought Together"
          icon={Sparkles}
          items={frequentlyBoughtTogether}
          emptyMessage="Add items to see suggestions"
        />
      )}
      
      {customerPhone && customerFavorites.length > 0 && (
        <SuggestionCard
          title="Customer Favorites"
          icon={TrendingUp}
          items={customerFavorites}
          emptyMessage="No purchase history"
        />
      )}
      
      <SuggestionCard
        title="Popular Right Now"
        icon={Clock}
        items={timeBasedSuggestions.length > 0 ? timeBasedSuggestions : topSelling}
        emptyMessage="No data yet"
      />
    </div>
  );
}
