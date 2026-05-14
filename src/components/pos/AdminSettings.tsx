import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, QrCode, Palette, Database, Download, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadData, saveData } from '@/lib/store';

const UPI_ID = '9003368894@upi';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  gstNumber: string;
  upiId: string;
  taxRate: number;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'JAY POS Store',
    storeAddress: '',
    storePhone: '',
    gstNumber: '',
    upiId: UPI_ID,
    taxRate: 18
  });

  useEffect(() => {
    const data = loadData();
    const storeSettings = data.settings?.store as StoreSettings | undefined;
    if (storeSettings) {
      setSettings(prev => ({ ...prev, ...storeSettings }));
    }
  }, []);

  const handleSave = () => {
    const data = loadData();
    data.settings = { ...data.settings, store: settings };
    saveData(data);
    toast.success('Settings saved successfully!');
  };

  const handleExport = () => {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jaypos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            saveData(data);
            toast.success('Data imported successfully! Refresh to see changes.');
          } catch {
            toast.error('Invalid file format!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
      localStorage.removeItem('jay_pos_data');
      toast.success('All data has been reset. Refresh to start fresh.');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-primary" />
          Admin Settings
        </h2>
        <p className="text-muted-foreground mt-1">Configure your POS system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings */}
        <div className="pos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Store Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                className="pos-input"
                placeholder="Enter store name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Store Address</label>
              <textarea
                value={settings.storeAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, storeAddress: e.target.value }))}
                className="pos-input min-h-[80px]"
                placeholder="Enter store address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, storePhone: e.target.value }))}
                  className="pos-input"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">GST Number</label>
                <input
                  type="text"
                  value={settings.gstNumber}
                  onChange={(e) => setSettings(prev => ({ ...prev, gstNumber: e.target.value }))}
                  className="pos-input"
                  placeholder="GSTIN"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="pos-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Payment Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">UPI ID</label>
              <input
                type="text"
                value={settings.upiId}
                onChange={(e) => setSettings(prev => ({ ...prev, upiId: e.target.value }))}
                className="pos-input"
                placeholder="yourname@upi"
              />
              <p className="text-xs text-muted-foreground mt-1">This UPI ID will be used for QR code payments</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tax Rate (%)</label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                className="pos-input"
                placeholder="18"
              />
              <p className="text-xs text-muted-foreground mt-1">Default GST rate applied to all products</p>
            </div>
            <button onClick={handleSave} className="pos-btn-primary w-full mt-4">
              Save Settings
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="pos-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={handleExport} className="pos-btn-outline py-6 flex-col">
              <Download className="w-8 h-8 mb-2 text-success" />
              <span className="font-medium">Export Data</span>
              <span className="text-xs text-muted-foreground mt-1">Download backup file</span>
            </button>
            <button onClick={handleImport} className="pos-btn-outline py-6 flex-col">
              <Upload className="w-8 h-8 mb-2 text-primary" />
              <span className="font-medium">Import Data</span>
              <span className="text-xs text-muted-foreground mt-1">Restore from backup</span>
            </button>
            <button onClick={handleReset} className="pos-btn-outline py-6 flex-col text-destructive border-destructive hover:bg-destructive/10">
              <Trash2 className="w-8 h-8 mb-2" />
              <span className="font-medium">Reset All Data</span>
              <span className="text-xs mt-1">Clear everything</span>
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="pos-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            System Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Platform</p>
              <p className="text-lg font-semibold">Web</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">License</p>
              <p className="text-lg font-semibold">Professional</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Support</p>
              <p className="text-lg font-semibold">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
