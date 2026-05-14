import React, { useState, useEffect } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  UserX,
  UserCheck,
  Loader2,
  Save,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';

type OrganizationMember = Tables<'organization_members'>;
type CustomRole = Tables<'custom_roles'>;

interface MemberWithRole extends OrganizationMember {
  role?: CustomRole;
}

export function TeamView() {
  const { organization, hasPermission, isOwner } = useOrganizationContext();
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: '',
    displayName: '',
    roleId: ''
  });

  const canManage = hasPermission('manage_users');

  useEffect(() => {
    if (organization) {
      fetchMembers();
      fetchRoles();
    }
  }, [organization]);

  const fetchMembers = async () => {
    if (!organization) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`*, role:custom_roles(*)`)
        .eq('organization_id', organization.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setMembers(data as MemberWithRole[]);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    if (!organization) return;
    
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      if (error) throw error;
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const filteredMembers = members.filter(m =>
    m.display_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (member: MemberWithRole) => {
    setEditingMember(member);
    setForm({
      email: member.email,
      displayName: member.display_name,
      roleId: member.role_id
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingMember) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({
          display_name: form.displayName,
          role_id: form.roleId
        })
        .eq('id', editingMember.id);

      if (error) throw error;
      toast.success('Member updated');
      setShowModal(false);
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (member: MemberWithRole) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);

      if (error) throw error;
      toast.success(member.is_active ? 'Member deactivated' : 'Member activated');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member');
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
          <h2 className="text-2xl font-bold text-foreground">Team</h2>
          <p className="text-muted-foreground">{members.length} members</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="pl-10"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {member.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{member.display_name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant={(member.role as CustomRole)?.default_role_type === 'owner' ? 'default' : 'secondary'}>
                  <Shield className="w-3 h-3 mr-1" />
                  {(member.role as CustomRole)?.name || 'Member'}
                </Badge>
                {!member.is_active && (
                  <Badge variant="outline" className="text-destructive">Inactive</Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Joined {new Date(member.joined_at).toLocaleDateString()}
              </p>

              {canManage && (member.role as CustomRole)?.default_role_type !== 'owner' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(member)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleActive(member)}
                  >
                    {member.is_active ? (
                      <><UserX className="w-4 h-4 mr-1" />Deactivate</>
                    ) : (
                      <><UserCheck className="w-4 h-4 mr-1" />Activate</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.roleId} onValueChange={(v) => setForm(f => ({ ...f, roleId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter(r => r.default_role_type !== 'owner').map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        roles={roles}
        onInviteSent={fetchMembers}
      />
    </div>
  );
}
