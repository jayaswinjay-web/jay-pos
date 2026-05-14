import React, { useRef } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { 
  Printer, 
  MessageCircle, 
  Download, 
  X,
  Check,
  Store,
  Phone,
  MapPin,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  invoiceNo: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashierName: string;
  date: Date;
  customerPhone?: string;
  customerName?: string;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export function ReceiptModal({ open, onClose, receiptData }: ReceiptModalProps) {
  const { storeSettings, organization } = useOrganizationContext();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receiptData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: storeSettings?.currency || 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups for printing');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptData.invoiceNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              width: 80mm; 
              padding: 10px;
              background: white;
              color: black;
            }
            .receipt { width: 100%; }
            .header { text-align: center; margin-bottom: 10px; }
            .store-name { font-size: 18px; font-weight: bold; }
            .store-info { font-size: 10px; color: #666; }
            .divider { border-top: 1px dashed #ccc; margin: 8px 0; }
            .items { width: 100%; }
            .item { display: flex; justify-content: space-between; margin: 4px 0; }
            .item-name { flex: 1; }
            .item-qty { width: 30px; text-align: center; }
            .item-price { width: 70px; text-align: right; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 4px 0; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .invoice-no { font-size: 11px; margin: 5px 0; }
            @media print {
              body { width: 80mm !important; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="store-name">${storeSettings?.store_name || organization?.name || 'Store'}</div>
              ${storeSettings?.store_address ? `<div class="store-info">${storeSettings.store_address}</div>` : ''}
              ${storeSettings?.store_phone ? `<div class="store-info">Tel: ${storeSettings.store_phone}</div>` : ''}
              ${storeSettings?.gst_number ? `<div class="store-info">GST: ${storeSettings.gst_number}</div>` : ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="invoice-no">
              <strong>Invoice:</strong> ${receiptData.invoiceNo}<br/>
              <strong>Date:</strong> ${formatDate(receiptData.date)}<br/>
              <strong>Cashier:</strong> ${receiptData.cashierName}
              ${receiptData.customerName ? `<br/><strong>Customer:</strong> ${receiptData.customerName}` : ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="items">
              <div class="item" style="font-weight: bold;">
                <span class="item-name">Item</span>
                <span class="item-qty">Qty</span>
                <span class="item-price">Amount</span>
              </div>
              ${receiptData.items.map(item => `
                <div class="item">
                  <span class="item-name">${item.name}</span>
                  <span class="item-qty">${item.quantity}</span>
                  <span class="item-price">${formatCurrency(item.total)}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="divider"></div>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(receiptData.subtotal)}</span>
              </div>
              <div class="total-row">
                <span>Tax (${storeSettings?.tax_rate || 18}%):</span>
                <span>${formatCurrency(receiptData.tax)}</span>
              </div>
              ${receiptData.discount > 0 ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-${formatCurrency(receiptData.discount)}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>TOTAL:</span>
                <span>${formatCurrency(receiptData.total)}</span>
              </div>
              <div class="total-row">
                <span>Payment:</span>
                <span>${receiptData.paymentMethod.toUpperCase()}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              ${storeSettings?.receipt_footer || 'Thank you for your business!'}<br/>
              <small>Powered by JAY POS</small>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast.success('Receipt sent to printer');
  };

  const handleWhatsAppShare = () => {
    const receiptText = `
🧾 *${storeSettings?.store_name || organization?.name || 'Receipt'}*

Invoice: ${receiptData.invoiceNo}
Date: ${formatDate(receiptData.date)}
${receiptData.customerName ? `Customer: ${receiptData.customerName}` : ''}

*Items:*
${receiptData.items.map(item => `• ${item.name} x${item.quantity} - ${formatCurrency(item.total)}`).join('\n')}

---
Subtotal: ${formatCurrency(receiptData.subtotal)}
Tax: ${formatCurrency(receiptData.tax)}
${receiptData.discount > 0 ? `Discount: -${formatCurrency(receiptData.discount)}` : ''}
*Total: ${formatCurrency(receiptData.total)}*
Payment: ${receiptData.paymentMethod.toUpperCase()}

${storeSettings?.receipt_footer || 'Thank you for your business!'}
    `.trim();

    const phoneNumber = receiptData.customerPhone?.replace(/\D/g, '') || '';
    const whatsappUrl = phoneNumber 
      ? `https://wa.me/${phoneNumber.startsWith('91') ? phoneNumber : '91' + phoneNumber}?text=${encodeURIComponent(receiptText)}`
      : `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const handleDownloadPDF = () => {
    // Create a printable version and trigger download
    handlePrint();
    toast.info('Use Print to PDF to save as PDF');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Receipt Generated
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div 
          ref={receiptRef}
          className="bg-white text-black rounded-lg p-4 font-mono text-sm border"
        >
          {/* Header */}
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold">
              {storeSettings?.store_name || organization?.name || 'Store'}
            </h2>
            {storeSettings?.store_address && (
              <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {storeSettings.store_address}
              </p>
            )}
            {storeSettings?.store_phone && (
              <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <Phone className="w-3 h-3" />
                {storeSettings.store_phone}
              </p>
            )}
            {storeSettings?.gst_number && (
              <p className="text-xs text-gray-600">GST: {storeSettings.gst_number}</p>
            )}
          </div>

          <Separator className="my-2 border-dashed" />

          {/* Invoice Details */}
          <div className="text-xs space-y-1 mb-3">
            <p><strong>Invoice:</strong> {receiptData.invoiceNo}</p>
            <p><strong>Date:</strong> {formatDate(receiptData.date)}</p>
            <p><strong>Cashier:</strong> {receiptData.cashierName}</p>
            {receiptData.customerName && (
              <p><strong>Customer:</strong> {receiptData.customerName}</p>
            )}
          </div>

          <Separator className="my-2 border-dashed" />

          {/* Items */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Amt</span>
            </div>
            {receiptData.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="flex-1 truncate">{item.name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-16 text-right">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-2 border-dashed" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(receiptData.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({storeSettings?.tax_rate || 18}%):</span>
              <span>{formatCurrency(receiptData.tax)}</span>
            </div>
            {receiptData.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(receiptData.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-black">
              <span>TOTAL:</span>
              <span>{formatCurrency(receiptData.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="uppercase">{receiptData.paymentMethod}</span>
            </div>
          </div>

          <Separator className="my-2 border-dashed" />

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <p>{storeSettings?.receipt_footer || 'Thank you for your business!'}</p>
            <p className="mt-1 text-[10px]">Powered by JAY POS</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button 
            variant="outline" 
            className="flex-col h-20 gap-1"
            onClick={handlePrint}
          >
            <Printer className="w-5 h-5" />
            <span className="text-xs">Print</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-20 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleWhatsAppShare}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">WhatsApp</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-20 gap-1"
            onClick={handleDownloadPDF}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">PDF</span>
          </Button>
        </div>

        <Button 
          className="w-full mt-2" 
          onClick={onClose}
        >
          <Check className="w-4 h-4 mr-2" />
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}