import React, { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Search, Loader2, Check, Package, Receipt, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/context/OrganizationContext';

interface ReturnItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  returnQty: number;
}

interface ReturnRefundProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatCurrency: (amount: number) => string;
}

export function ReturnRefund({ open, onOpenChange, formatCurrency }: ReturnRefundProps) {
  const { organization, member, refreshProducts, refreshTransactions, products } = useOrganizationContext();
  const [invoiceNo, setInvoiceNo] = useState('');
  const [searching, setSearching] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refundComplete, setRefundComplete] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState('');

  const searchTransaction = async () => {
    if (!invoiceNo.trim() || !organization) return;

    setSearching(true);
    setTransaction(null);
    setReturnItems([]);
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('invoice_no', invoiceNo.trim())
        .single();

      if (error || !data) {
        toast.error('Transaction not found');
        return;
      }

      // Check if it's a refund transaction
      if (data.total < 0) {
        toast.error('This is already a refund transaction');
        return;
      }

      setTransaction(data);
      const items = (data.items as any[]).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        returnQty: 0
      }));
      setReturnItems(items);
    } catch (error) {
      toast.error('Failed to search transaction');
    } finally {
      setSearching(false);
    }
  };

  const updateReturnQty = (index: number, qty: number) => {
    setReturnItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, returnQty: Math.min(Math.max(0, qty), item.quantity) }
        : item
    ));
  };

  const selectAll = () => {
    setReturnItems(prev => prev.map(item => ({
      ...item,
      returnQty: item.quantity
    })));
  };

  const clearSelection = () => {
    setReturnItems(prev => prev.map(item => ({
      ...item,
      returnQty: 0
    })));
  };

  const refundAmount = useMemo(() => 
    returnItems.reduce((sum, item) => sum + (item.returnQty * item.price), 0),
    [returnItems]
  );

  const itemsToReturn = useMemo(() => 
    returnItems.filter(item => item.returnQty > 0),
    [returnItems]
  );

  const processReturn = async () => {
    if (!organization || !member || !transaction) return;

    if (itemsToReturn.length === 0) {
      toast.error('Select items to return');
      return;
    }

    setProcessing(true);
    try {
      // Restore stock for returned items
      for (const item of itemsToReturn) {
        // Try to find product by ID first, then by name
        const product = products.find(p => 
          p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase()
        );

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.returnQty })
            .eq('id', product.id);
        }
      }

      // Create refund transaction
      const { data: newInvoiceNo } = await supabase.rpc('generate_invoice_no', {
        _org_id: organization.id
      });

      const finalInvoiceNo = newInvoiceNo || `REF-${Date.now()}`;

      await supabase
        .from('transactions')
        .insert({
          organization_id: organization.id,
          invoice_no: finalInvoiceNo,
          items: itemsToReturn.map(item => ({
            id: item.id,
            name: item.name,
            quantity: -item.returnQty,
            price: item.price,
            total: -(item.returnQty * item.price)
          })),
          subtotal: -refundAmount,
          tax: 0,
          discount: 0,
          total: -refundAmount,
          payment_method: transaction.payment_method,
          status: 'completed',
          cashier_id: member.user_id,
          cashier_name: member.display_name,
          notes: `Return for ${transaction.invoice_no}. Reason: ${reason || 'Not specified'}`
        });

      setRefundInvoice(finalInvoiceNo);
      setRefundComplete(true);
      toast.success(`Refund processed: ${formatCurrency(refundAmount)}`);
      refreshProducts();
      refreshTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process return');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setInvoiceNo('');
    setTransaction(null);
    setReturnItems([]);
    setReason('');
    setRefundComplete(false);
    setRefundInvoice('');
    onOpenChange(false);
  };

  const printRefund = () => {
    // Simple print implementation
    const printContent = `
      REFUND RECEIPT
      ==============
      Invoice: ${refundInvoice}
      Original: ${transaction.invoice_no}
      Date: ${new Date().toLocaleString()}
      
      Items Returned:
      ${itemsToReturn.map(i => `${i.name} x${i.returnQty} - ${formatCurrency(i.returnQty * i.price)}`).join('\n')}
      
      Refund Amount: ${formatCurrency(refundAmount)}
      Reason: ${reason || 'Not specified'}
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace;">${printContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Return & Refund
          </DialogTitle>
          <DialogDescription>
            Search transaction and process returns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!refundComplete ? (
            <>
              {/* Search Transaction */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                    placeholder="Enter invoice number (e.g., INV-00001)"
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && searchTransaction()}
                  />
                </div>
                <Button onClick={searchTransaction} disabled={searching || !invoiceNo.trim()}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Transaction Details */}
              {transaction && (
                <>
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice:</span>
                      <span className="font-medium">{transaction.invoice_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(transaction.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(transaction.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment:</span>
                      <Badge variant="outline">{transaction.payment_method.toUpperCase()}</Badge>
                    </div>
                  </div>

                  {/* Return Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Items to Return</Label>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                          Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs h-7">
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-auto border rounded-lg p-2">
                      {returnItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Return:</Label>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.returnQty}
                              onChange={(e) => updateReturnQty(index, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 text-center"
                            />
                            <span className="text-xs text-muted-foreground">/ {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label>Return Reason</Label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is the customer returning these items?"
                      rows={2}
                    />
                  </div>

                  {/* Refund Amount */}
                  {refundAmount > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Refund Summary
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-amber-700 dark:text-amber-400">
                          {itemsToReturn.length} item(s)
                        </span>
                        <span className="text-2xl font-bold text-amber-600">{formatCurrency(refundAmount)}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={processReturn}
                      disabled={processing || refundAmount === 0}
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Process Refund
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            // Refund Complete
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Refund Processed</h3>
                <p className="text-muted-foreground">Invoice: {refundInvoice}</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Amount Refunded</p>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(refundAmount)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={printRefund}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button className="flex-1" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}