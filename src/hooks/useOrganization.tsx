import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Database } from '@/integrations/supabase/types';

type Organization = Tables<'organizations'>;
type OrganizationMember = Tables<'organization_members'>;
type CustomRole = Tables<'custom_roles'>;
type RolePermission = Tables<'role_permissions'>;
type StoreSettings = Tables<'store_settings'>;
type PermissionType = Database['public']['Enums']['permission_type'];

interface MemberWithRole extends OrganizationMember {
  role?: CustomRole;
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [member, setMember] = useState<MemberWithRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionType[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's organization membership
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          *,
          role:custom_roles(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError) throw memberError;

      if (memberData) {
        setMember(memberData as MemberWithRole);

        // Get organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', memberData.organization_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        // Get role permissions
        const { data: permData } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role_id', memberData.role_id);

        if (permData) {
          setPermissions(permData.map(p => p.permission));
        }

        // Get store settings
        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('organization_id', memberData.organization_id)
          .maybeSingle();

        if (settingsData) {
          setStoreSettings(settingsData);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const hasPermission = useCallback((permission: PermissionType) => {
    return permissions.includes(permission);
  }, [permissions]);

  const isOwner = useCallback(() => {
    return (member?.role as CustomRole)?.default_role_type === 'owner';
  }, [member]);

  const isAdmin = useCallback(() => {
    const roleType = (member?.role as CustomRole)?.default_role_type;
    return roleType === 'owner' || roleType === 'admin';
  }, [member]);

  const refreshSettings = useCallback(async () => {
    if (!organization) return;
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('organization_id', organization.id)
      .maybeSingle();
    if (data) setStoreSettings(data);
  }, [organization]);

  return {
    organization,
    member,
    permissions,
    storeSettings,
    loading,
    hasPermission,
    isOwner,
    isAdmin,
    refreshOrganization: fetchOrganization,
    refreshSettings,
  };
}
