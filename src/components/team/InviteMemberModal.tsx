import React, { useState } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserPlus, 
  Loader2, 
  Mail,
  Send,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type CustomRole = Tables<'custom_roles'>;

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: CustomRole[];
  onInviteSent: () => void;
}

export function InviteMemberModal({ open, onOpenChange, roles, onInviteSent }: InviteMemberModalProps) {
  const { organization } = useOrganizationContext();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const availableRoles = roles.filter(r => r.default_role_type !== 'owner');

  const handleSendInvite = async () => {
    if (!email || !displayName || !roleId || !organization) {
      toast.error('Please fill in all fields');
      return;
    }

    if (email.length > 255) {
      toast.error('Email too long (max 255 characters)');
      return;
    }
    
    if (displayName.length > 200) {
      toast.error('Display name too long (max 200 characters)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Invalid email format');
      return;
    }

    setSending(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({
            email,
            displayName,
            roleId,
            organizationId: organization.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }
      
      setInviteSuccess(true);
      toast.success('Invitation email sent!');
      onInviteSent();
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered');
      } else {
        toast.error(error.message || 'Failed to send invitation');
      }
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setDisplayName('');
    setRoleId('');
    setInviteSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to join {organization?.name}
          </DialogDescription>
        </DialogHeader>

        {!inviteSuccess ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              An invitation email will be sent. The member will set their own password when they accept.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSendInvite} disabled={sending}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                Invitation Sent!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                An email has been sent to <strong>{email}</strong> with instructions to join {organization?.name}.
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {displayName} will receive an email with a link to set their password and access the store.
            </p>

            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
