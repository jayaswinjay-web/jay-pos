import React, { useState } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Store, 
  QrCode, 
  Loader2,
  Save,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DataManagement } from '@/components/settings/DataManagement';

export function SettingsView() {
  const { organization, storeSettings, refreshSettings, hasPermission, isOwner } = useOrganizationContext();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    store_name: storeSettings?.store_name || '',
    store_address: storeSettings?.store_address || '',
    store_phone: storeSettings?.store_phone || '',
    gst_number: storeSettings?.gst_number || '',
    upi_id: storeSettings?.upi_id || '9003368894@upi',
    tax_rate: String(storeSettings?.tax_rate || 18),
    receipt_footer: storeSettings?.receipt_footer || ''
  });

  const canManage = hasPermission('manage_settings');

  React.useEffect(() => {
    if (storeSettings) {
      setForm({
        store_name: storeSettings.store_name || '',
        store_address: storeSettings.store_address || '',
        store_phone: storeSettings.store_phone || '',
        gst_number: storeSettings.gst_number || '',
        upi_id: storeSettings.upi_id || '9003368894@upi',
        tax_rate: String(storeSettings.tax_rate || 18),
        receipt_footer: storeSettings.receipt_footer || ''
      });
    }
  }, [storeSettings]);

  const handleSave = async () => {
    if (!storeSettings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name: form.store_name,
          store_address: form.store_address || null,
          store_phone: form.store_phone || null,
          gst_number: form.gst_number || null,
          upi_id: form.upi_id || null,
          tax_rate: parseFloat(form.tax_rate) || 18,
          receipt_footer: form.receipt_footer || null
        })
        .eq('id', storeSettings.id);

      if (error) throw error;
      toast.success('Settings saved successfully!');
      refreshSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          Settings
        </h2>
        <p className="text-muted-foreground mt-1">Configure your store settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store Information
            </CardTitle>
            <CardDescription>Your business details for receipts and invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={form.store_name}
                onChange={(e) => setForm(f => ({ ...f, store_name: e.target.value }))}
                placeholder="My Store"
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label>Store Address</Label>
              <Textarea
                value={form.store_address}
                onChange={(e) => setForm(f => ({ ...f, store_address: e.target.value }))}
                placeholder="123 Main Street, City"
                disabled={!canManage}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={form.store_phone}
                  onChange={(e) => setForm(f => ({ ...f, store_phone: e.target.value }))}
                  placeholder="+91 XXXXXXXXXX"
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  value={form.gst_number}
                  onChange={(e) => setForm(f => ({ ...f, gst_number: e.target.value }))}
                  placeholder="GSTIN"
                  disabled={!canManage}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>Configure UPI and tax settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input
                value={form.upi_id}
                onChange={(e) => setForm(f => ({ ...f, upi_id: e.target.value }))}
                placeholder="yourname@upi"
                disabled={!canManage}
              />
              <p className="text-xs text-muted-foreground">
                This UPI ID will be used to generate QR codes for payments
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={form.tax_rate}
                onChange={(e) => setForm(f => ({ ...f, tax_rate: e.target.value }))}
                placeholder="18"
                disabled={!canManage}
              />
              <p className="text-xs text-muted-foreground">
                Default GST rate applied to all products
              </p>
            </div>
            <div className="space-y-2">
              <Label>Receipt Footer</Label>
              <Textarea
                value={form.receipt_footer}
                onChange={(e) => setForm(f => ({ ...f, receipt_footer: e.target.value }))}
                placeholder="Thank you for shopping with us!"
                disabled={!canManage}
              />
            </div>
            
            {canManage && (
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Data Management - Only for owners */}
        {isOwner() && (
          <div className="lg:col-span-2">
            <DataManagement />
          </div>
        )}

        {/* System Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-lg font-semibold">2.0.0</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="text-lg font-semibold">Cloud</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">License</p>
                <p className="text-lg font-semibold">Enterprise</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Subdomain</p>
                <p className="text-lg font-semibold">{organization?.subdomain || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
