import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingTransaction {
  id: string;
  data: any;
  timestamp: number;
}

interface OfflineModeProps {
  onSync?: (transactions: PendingTransaction[]) => Promise<void>;
}

const STORAGE_KEY = 'pos_pending_transactions';

export function OfflineMode({ onSync }: OfflineModeProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Load pending transactions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPendingTransactions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse pending transactions:', e);
      }
    }
  }, []);

  // Save pending transactions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingTransactions));
  }, [pendingTransactions]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!', {
        description: pendingTransactions.length > 0 
          ? `${pendingTransactions.length} transactions ready to sync`
          : undefined
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline', {
        description: 'Transactions will be saved locally'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingTransactions.length]);

  // Add transaction to pending queue
  const addPendingTransaction = useCallback((data: any) => {
    const transaction: PendingTransaction = {
      id: crypto.randomUUID(),
      data,
      timestamp: Date.now()
    };
    setPendingTransactions(prev => [...prev, transaction]);
    toast.info('Transaction saved offline');
    return transaction.id;
  }, []);

  // Sync pending transactions
  const syncTransactions = useCallback(async () => {
    if (!isOnline || pendingTransactions.length === 0 || !onSync) return;

    setIsSyncing(true);
    try {
      await onSync(pendingTransactions);
      setPendingTransactions([]);
      toast.success('All transactions synced!');
    } catch (error) {
      toast.error('Sync failed. Will retry when stable.');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingTransactions, onSync]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingTransactions.length > 0 && onSync) {
      const timeout = setTimeout(syncTransactions, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, pendingTransactions.length, syncTransactions, onSync]);

  const removePendingTransaction = (id: string) => {
    setPendingTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      <Badge
        variant={isOnline ? "outline" : "destructive"}
        className="cursor-pointer gap-1.5"
        onClick={() => pendingTransactions.length > 0 && setShowDialog(true)}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
        {pendingTransactions.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
            {pendingTransactions.length}
          </span>
        )}
      </Badge>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isOnline ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
              Pending Transactions
            </DialogTitle>
            <DialogDescription>
              {pendingTransactions.length} transaction(s) waiting to sync
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {pendingTransactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {transaction.data.invoice_no || 'Transaction'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">
                  ₹{transaction.data.total || 0}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDialog(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={syncTransactions}
              disabled={!isOnline || isSyncing || pendingTransactions.length === 0}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Sync Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export utility functions
export function useOfflineTransaction() {
  const addTransaction = (data: any): string => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const transactions: PendingTransaction[] = stored ? JSON.parse(stored) : [];
    
    const transaction: PendingTransaction = {
      id: crypto.randomUUID(),
      data,
      timestamp: Date.now()
    };
    
    transactions.push(transaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    return transaction.id;
  };

  const getPendingTransactions = (): PendingTransaction[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const clearPendingTransactions = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  return {
    addTransaction,
    getPendingTransactions,
    clearPendingTransactions,
    isOnline: navigator.onLine
  };
}
