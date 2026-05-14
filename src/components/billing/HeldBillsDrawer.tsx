import React, { useState } from 'react';
import { 
  PauseCircle, 
  Play, 
  Trash2, 
  Clock,
  ShoppingCart,
  User,
  StickyNote,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HeldBillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface HeldBill {
  id: string;
  items: HeldBillItem[];
  total: number;
  customerName?: string;
  note?: string;
  heldAt: Date;
}

interface HeldBillsDrawerProps {
  heldBills: HeldBill[];
  onResume: (bill: HeldBill) => void;
  onDelete: (billId: string) => void;
  formatCurrency: (amount: number) => string;
}

export function HeldBillsDrawer({ 
  heldBills, 
  onResume, 
  onDelete,
  formatCurrency 
}: HeldBillsDrawerProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const held = new Date(date);
    const diffMs = now.getTime() - held.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(held);
  };

  const handleResume = (bill: HeldBill) => {
    onResume(bill);
    setOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const getTotalItems = (bill: HeldBill) => {
    return bill.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative gap-1.5 h-8">
            <PauseCircle className="w-3.5 h-3.5" />
            <span className="text-xs">Held</span>
            {heldBills.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {heldBills.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-primary" />
              Held Bills
            </SheetTitle>
            <SheetDescription>
              {heldBills.length} bill(s) waiting to be resumed
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
            {heldBills.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
                <p className="font-medium">No held bills</p>
                <p className="text-sm text-center">
                  Press Ctrl+H or click "Hold" to park a bill for later
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {heldBills.map((bill) => (
                  <div 
                    key={bill.id}
                    className="border rounded-lg p-3 bg-card hover:border-primary transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTime(bill.heldAt)}
                        </span>
                      </div>
                      <span className="font-bold text-primary">
                        {formatCurrency(bill.total)}
                      </span>
                    </div>

                    {/* Customer Info */}
                    {bill.customerName && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{bill.customerName}</span>
                      </div>
                    )}

                    {/* Note */}
                    {bill.note && (
                      <div className="flex items-start gap-1.5 mb-2 p-2 bg-muted/50 rounded text-xs">
                        <StickyNote className="w-3 h-3 text-muted-foreground mt-0.5" />
                        <span className="italic text-muted-foreground">{bill.note}</span>
                      </div>
                    )}

                    {/* Items Summary */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{getTotalItems(bill)} items</span>
                        <span>{bill.items.length} unique</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="max-h-24 overflow-auto space-y-1 text-xs">
                        {bill.items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="truncate flex-1 mr-2">{item.name}</span>
                            <span className="text-muted-foreground">×{item.quantity}</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.lineTotal)}</span>
                          </div>
                        ))}
                        {bill.items.length > 4 && (
                          <p className="text-center text-muted-foreground pt-1">
                            +{bill.items.length - 4} more items
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleResume(bill)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Resume
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(bill.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Held Bill?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The held bill and all its items will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}