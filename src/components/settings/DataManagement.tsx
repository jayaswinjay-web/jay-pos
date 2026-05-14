import React, { useState, useRef } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Loader2,
  AlertTriangle,
  FileJson,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function DataManagement() {
  const { organization, refreshProducts, refreshTransactions } = useOrganizationContext();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showEraseDialog, setShowEraseDialog] = useState(false);
  const [erasePassword, setErasePassword] = useState('');
  const [erasing, setErasing] = useState(false);
  const [eraseType, setEraseType] = useState<'products' | 'transactions' | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!organization) return;
    
    setExporting(true);
    try {
      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organization.id);

      if (productsError) throw productsError;

      // Fetch all transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', organization.id);

      if (transError) throw transError;

      // Fetch store settings
      const { data: settings } = await supabase
        .from('store_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .single();

      // Fetch cash logs
      const { data: cashLogs } = await supabase
        .from('cash_logs')
        .select('*')
        .eq('organization_id', organization.id);

      const exportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        organization: {
          name: organization.name,
          subdomain: organization.subdomain
        },
        data: {
          products: products || [],
          transactions: transactions || [],
          settings: settings || null,
          cashLogs: cashLogs || []
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jaypos-backup-${organization.subdomain}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    setImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.version || !importData.data) {
        throw new Error('Invalid backup file format');
      }

      // Import products with validation
      if (importData.data.products?.length) {
        const productsToImport = importData.data.products
          .filter((p: any) => {
            // Validate each product before import
            if (!p.name || typeof p.name !== 'string') return false;
            if (p.name.length > 200) return false;
            if (p.price !== undefined && (typeof p.price !== 'number' || p.price < 0)) return false;
            if (p.stock !== undefined && (typeof p.stock !== 'number' || p.stock < 0)) return false;
            if (p.description && p.description.length > 1000) return false;
            if (p.category && p.category.length > 100) return false;
            if (p.sku && p.sku.length > 50) return false;
            return true;
          })
          .map((p: any) => ({
            organization_id: organization.id,
            name: String(p.name).slice(0, 200).trim(),
            price: Math.max(0, Number(p.price) || 0),
            stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
            category: p.category ? String(p.category).slice(0, 100).trim() : null,
            sku: p.sku ? String(p.sku).slice(0, 50).trim() : null,
            description: p.description ? String(p.description).slice(0, 1000).trim() : null,
            is_active: p.is_active ?? true
          }));

        if (productsToImport.length === 0) {
          throw new Error('No valid products found in import file');
        }

        const { error: productsError } = await supabase
          .from('products')
          .insert(productsToImport);

        if (productsError) throw productsError;
      }

      refreshProducts();
      toast.success(`Imported ${importData.data.products?.length || 0} products`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import data');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleErase = async () => {
    if (!organization) return;
    
    // Simple password check - in production, this should be server-side
    if (erasePassword !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }

    setErasing(true);
    try {
      if (eraseType === 'products' || eraseType === 'all') {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('organization_id', organization.id);
        if (error) throw error;
      }

      if (eraseType === 'transactions' || eraseType === 'all') {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('organization_id', organization.id);
        if (error) throw error;

        const { error: cashError } = await supabase
          .from('cash_logs')
          .delete()
          .eq('organization_id', organization.id);
        if (cashError) throw cashError;
      }

      refreshProducts();
      refreshTransactions();
      toast.success('Data erased successfully');
      setShowEraseDialog(false);
      setErasePassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to erase data');
    } finally {
      setErasing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Management
        </CardTitle>
        <CardDescription>Backup, restore, and manage your data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex-col gap-2" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            ) : (
              <Download className="w-8 h-8 text-emerald-500" />
            )}
            <span className="font-medium">Export Data</span>
            <span className="text-xs text-muted-foreground">Download JSON backup</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-24 flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            ) : (
              <Upload className="w-8 h-8 text-blue-500" />
            )}
            <span className="font-medium">Import Data</span>
            <span className="text-xs text-muted-foreground">Restore from backup</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <Button 
            variant="outline" 
            className="h-24 flex-col gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={() => setShowEraseDialog(true)}
          >
            <Trash2 className="w-8 h-8" />
            <span className="font-medium">Erase Data</span>
            <span className="text-xs">Password protected</span>
          </Button>
        </div>
      </CardContent>

      {/* Erase Confirmation Dialog */}
      <Dialog open={showEraseDialog} onOpenChange={setShowEraseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Erase Data
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please select what to erase and type DELETE to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What to erase?</Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={eraseType === 'products' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setEraseType('products')}
                >
                  Products Only
                </Button>
                <Button 
                  variant={eraseType === 'transactions' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setEraseType('transactions')}
                >
                  Transactions Only
                </Button>
                <Button 
                  variant={eraseType === 'all' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setEraseType('all')}
                >
                  All Data
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Type DELETE to confirm
              </Label>
              <Input
                value={erasePassword}
                onChange={(e) => setErasePassword(e.target.value)}
                placeholder="Type DELETE"
                className="font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEraseDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleErase}
                disabled={erasing || erasePassword !== 'DELETE'}
              >
                {erasing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Erase {eraseType === 'all' ? 'All Data' : eraseType}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
