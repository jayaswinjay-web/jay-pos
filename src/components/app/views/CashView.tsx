import React, { useState, useEffect } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tables, Database } from '@/integrations/supabase/types';

type CashLog = Tables<'cash_logs'>;

export function CashView() {
  const { organization, member, storeSettings, hasPermission } = useOrganizationContext();
  const [logs, setLogs] = useState<CashLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: 'in' as 'in' | 'out',
    amount: '',
    description: ''
  });

  const canManage = hasPermission('manage_cash');

  useEffect(() => {
    if (organization) {
      fetchLogs();
    }
  }, [organization]);

  const fetchLogs = async () => {
    if (!organization) return;
    
    try {
      const { data, error } = await supabase
        .from('cash_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: storeSettings?.currency || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals
  const today = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === today);
  const todayIn = todayLogs.filter(l => l.type === 'in').reduce((sum, l) => sum + Number(l.amount), 0);
  const todayOut = todayLogs.filter(l => l.type === 'out').reduce((sum, l) => sum + Number(l.amount), 0);
  const todayBalance = todayIn - todayOut;

  const handleSave = async () => {
    if (!organization || !member) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cash_logs')
        .insert({
          organization_id: organization.id,
          type: form.type,
          amount: parseFloat(form.amount) || 0,
          description: form.description || null,
          user_id: member.user_id,
          user_name: member.display_name
        });

      if (error) throw error;
      toast.success('Cash entry added');
      setShowModal(false);
      setForm({ type: 'in', amount: '', description: '' });
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cash Management</h2>
          <p className="text-muted-foreground">Track cash flow</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Cash In</p>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(todayIn)}</p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Cash Out</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(todayOut)}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Balance</p>
                <p className={`text-2xl font-bold ${todayBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatCurrency(todayBalance)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">By</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{new Date(log.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="p-4">
                      <Badge variant={log.type === 'in' ? 'default' : 'destructive'}>
                        {log.type === 'in' ? 'Cash In' : 'Cash Out'}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{log.description || '-'}</td>
                    <td className={`p-4 text-right font-semibold ${log.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {log.type === 'in' ? '+' : '-'}{formatCurrency(Number(log.amount))}
                    </td>
                    <td className="p-4 text-muted-foreground">{log.user_name || 'Unknown'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No cash entries yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Entry Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cash Entry</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: 'in' | 'out') => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Cash In</SelectItem>
                  <SelectItem value="out">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Opening balance, petty cash, etc."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.amount}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
