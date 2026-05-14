import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Calculator, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { loadData, saveData } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';

interface CashLog {
  id: number;
  type: 'in' | 'out';
  amount: number;
  description: string;
  date: string;
  user: string;
}

export function CashManagement() {
  const { currentUser } = useAuth();
  const [cashLogs, setCashLogs] = useState<CashLog[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [logType, setLogType] = useState<'in' | 'out'>('in');
  const [formData, setFormData] = useState({ amount: '', description: '' });
  const [openingBalance, setOpeningBalance] = useState(0);

  useEffect(() => {
    const data = loadData();
    setCashLogs(data.cashLogs || []);
    const balance = data.settings?.openingBalance as number | undefined;
    setOpeningBalance(balance || 0);
  }, []);

  const todayLogs = cashLogs.filter(log => 
    new Date(log.date).toDateString() === new Date().toDateString()
  );

  const totalCashIn = todayLogs.filter(l => l.type === 'in').reduce((sum, l) => sum + l.amount, 0);
  const totalCashOut = todayLogs.filter(l => l.type === 'out').reduce((sum, l) => sum + l.amount, 0);
  const currentBalance = openingBalance + totalCashIn - totalCashOut;

  const openAddModal = (type: 'in' | 'out') => {
    setLogType(type);
    setFormData({ amount: '', description: '' });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const newLog: CashLog = {
      id: Date.now(),
      type: logType,
      amount: parseFloat(formData.amount),
      description: formData.description || (logType === 'in' ? 'Cash In' : 'Cash Out'),
      date: new Date().toISOString(),
      user: currentUser?.name || 'Unknown'
    };

    const data = loadData();
    data.cashLogs = [...(data.cashLogs || []), newLog];
    saveData(data);
    setCashLogs(data.cashLogs);

    toast.success(`Cash ${logType === 'in' ? 'added' : 'removed'} successfully!`);
    setShowModal(false);
  };

  const updateOpeningBalance = () => {
    const amount = prompt('Enter opening balance:', openingBalance.toString());
    if (amount !== null) {
      const newBalance = parseFloat(amount) || 0;
      const data = loadData();
      data.settings = { ...data.settings, openingBalance: newBalance };
      saveData(data);
      setOpeningBalance(newBalance);
      toast.success('Opening balance updated!');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Wallet className="w-7 h-7 text-success" />
            Cash Management
          </h2>
          <p className="text-muted-foreground mt-1">Track daily cash flow</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAddModal('in')} className="pos-btn-success">
            <ArrowDownLeft className="w-5 h-5" />
            Cash In
          </button>
          <button onClick={() => openAddModal('out')} className="pos-btn-outline text-destructive border-destructive hover:bg-destructive/10">
            <ArrowUpRight className="w-5 h-5" />
            Cash Out
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="pos-card p-5 cursor-pointer hover:border-primary" onClick={updateOpeningBalance}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Calculator className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opening Balance</p>
              <p className="text-2xl font-bold text-foreground">₹{openingBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="pos-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash In</p>
              <p className="text-2xl font-bold text-success">+₹{totalCashIn.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="pos-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash Out</p>
              <p className="text-2xl font-bold text-destructive">-₹{totalCashOut.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="pos-stat-card primary">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Current Balance</p>
              <p className="text-2xl font-bold">₹{currentBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Logs Table */}
      <div className="pos-card">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Today's Cash Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="pos-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {todayLogs.length > 0 ? (
                todayLogs.reverse().map(log => (
                  <tr key={log.id}>
                    <td className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className={`pos-badge ${log.type === 'in' ? 'pos-badge-success' : 'pos-badge-danger'}`}>
                        {log.type === 'in' ? (
                          <><ArrowDownLeft className="w-3 h-3 mr-1" /> Cash In</>
                        ) : (
                          <><ArrowUpRight className="w-3 h-3 mr-1" /> Cash Out</>
                        )}
                      </span>
                    </td>
                    <td className={`font-semibold ${log.type === 'in' ? 'text-success' : 'text-destructive'}`}>
                      {log.type === 'in' ? '+' : '-'}₹{log.amount.toLocaleString()}
                    </td>
                    <td>{log.description}</td>
                    <td>{log.user}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No cash transactions today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cash Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {logType === 'in' ? (
                <><ArrowDownLeft className="w-5 h-5 text-success" /> Add Cash</>
              ) : (
                <><ArrowUpRight className="w-5 h-5 text-destructive" /> Remove Cash</>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (₹)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pos-input"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="pos-input"
                placeholder="e.g., Sales revenue, Expense payment"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="pos-btn-outline flex-1">
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                className={`flex-1 ${logType === 'in' ? 'pos-btn-success' : 'pos-btn-primary'}`}
              >
                {logType === 'in' ? 'Add Cash' : 'Remove Cash'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
