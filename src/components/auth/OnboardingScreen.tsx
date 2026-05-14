import React, { memo, useState } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Building2, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const OnboardingScreen = memo(function OnboardingScreen() {
  const { loading, refreshOrganization } = useOrganizationContext();
  const { signOut, user } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  const handleRefresh = async () => {
    await refreshOrganization();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedSubdomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');

    if (!orgName.trim() || !sanitizedSubdomain) {
      toast.error('Please enter a valid business name and URL');
      return;
    }

    if (sanitizedSubdomain.length < 3) {
      toast.error('Store URL must be at least 3 characters');
      return;
    }

    if (!user?.email) {
      toast.error('User email not found. Please sign out and sign in again.');
      return;
    }

    setCreatingOrg(true);
    try {
      const { error } = await supabase.rpc('create_organization', {
        _name: orgName.trim(),
        _subdomain: sanitizedSubdomain,
        _owner_name: user.user_metadata?.display_name || user.email.split('@')[0],
        _owner_email: user.email,
      });

      if (error) throw error;

      await refreshOrganization();
      toast.success('Organization created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Building2 className="w-10 h-10 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">No Organization Found</h1>
          <p className="text-muted-foreground mt-2">
            You are not yet linked to a store. Create one below or ask your admin to invite you.
          </p>
        </div>

        <form onSubmit={handleCreateOrganization} className="text-left space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="space-y-2">
            <Label htmlFor="onboardingOrgName">Business Name</Label>
            <Input
              id="onboardingOrgName"
              value={orgName}
              onChange={(e) => {
                const value = e.target.value;
                setOrgName(value);
                setSubdomain(value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32));
              }}
              placeholder="My Store"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboardingSubdomain">Store URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="onboardingSubdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32))}
                placeholder="mystore"
                required
                className="flex-1"
              />
              <span className="text-muted-foreground text-sm whitespace-nowrap">.jaypos.app</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={creatingOrg}>
            {creatingOrg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Organization
          </Button>
        </form>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSignOut} variant="destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
});
