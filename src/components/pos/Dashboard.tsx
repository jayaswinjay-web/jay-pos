import React from 'react';
import { usePOS } from '@/context/POSContext';
import { IndianRupee, ShoppingCart, Package, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';

export function Dashboard() {
  const { getTodayStats, transactions } = usePOS();
  const stats = getTodayStats();

  const recentTransactions = transactions
    .filter(t => t.status === 'completed')
    .slice(-5)
    .reverse();

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="pos-stat-card primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Today's Revenue</p>
              <p className="text-3xl font-bold mt-1">₹{stats.revenue.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-7 h-7" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm opacity-80">
            <ArrowUpRight className="w-4 h-4" />
            <span>+12.5% from yesterday</span>
          </div>
        </div>

        <div className="pos-stat-card success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Today's Orders</p>
              <p className="text-3xl font-bold mt-1">{stats.orders}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShoppingCart className="w-7 h-7" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm opacity-80">
            <TrendingUp className="w-4 h-4" />
            <span>Active today</span>
          </div>
        </div>

        <div className="pos-stat-card warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Products</p>
              <p className="text-3xl font-bold mt-1">{stats.products}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm opacity-80">
            <span>In inventory</span>
          </div>
        </div>

        <div className="pos-stat-card danger">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Low Stock Items</p>
              <p className="text-3xl font-bold mt-1">{stats.lowStock}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm opacity-80">
            <span>Needs attention</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="pos-card">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="pos-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="font-medium text-foreground">{transaction.invoiceNo}</td>
                    <td>{transaction.customer || 'Walk-in'}</td>
                    <td className="font-semibold text-primary">₹{transaction.total.toFixed(2)}</td>
                    <td className="uppercase text-xs">{transaction.paymentMethod}</td>
                    <td>
                      <span className="pos-badge-success">Completed</span>
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(transaction.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions yet today
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
