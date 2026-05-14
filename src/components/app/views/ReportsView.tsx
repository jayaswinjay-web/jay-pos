import React from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { 
  BarChart3, 
  TrendingUp,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ReportsView() {
  const { transactions, products, storeSettings } = useOrganizationContext();

  // Calculate stats
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => 
    new Date(t.created_at).toDateString() === today && t.status === 'completed'
  );
  
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const todayOrders = todayTransactions.length;
  const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
  const todayTax = todayTransactions.reduce((sum, t) => sum + Number(t.tax), 0);

  // Payment method breakdown
  const cashPayments = todayTransactions.filter(t => t.payment_method === 'cash');
  const upiPayments = todayTransactions.filter(t => t.payment_method === 'upi');
  const cardPayments = todayTransactions.filter(t => t.payment_method === 'card');

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
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
        <p className="text-muted-foreground">
          Today's summary - {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(todayRevenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{todayOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(avgOrderValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tax Collected</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(todayTax)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(cashPayments.reduce((sum, t) => sum + Number(t.total), 0))}
                </p>
                <p className="text-xs text-muted-foreground">{cashPayments.length} transactions</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UPI</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(upiPayments.reduce((sum, t) => sum + Number(t.total), 0))}
                </p>
                <p className="text-xs text-muted-foreground">{upiPayments.length} transactions</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Card</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(cardPayments.reduce((sum, t) => sum + Number(t.total), 0))}
                </p>
                <p className="text-xs text-muted-foreground">{cardPayments.length} transactions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Time</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Items</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Payment</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayTransactions.map((transaction) => {
                  const items = transaction.items as any[];
                  return (
                    <tr key={transaction.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{transaction.invoice_no}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {items?.length || 0} items
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {transaction.payment_method.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatCurrency(Number(transaction.total))}
                      </td>
                      <td className="p-4">
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {todayTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No transactions today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
