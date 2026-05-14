import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Database } from '@/integrations/supabase/types';

type Organization = Tables<'organizations'>;
type OrganizationMember = Tables<'organization_members'>;
type CustomRole = Tables<'custom_roles'>;
type StoreSettings = Tables<'store_settings'>;
type Product = Tables<'products'>;
type Transaction = Tables<'transactions'>;
type PermissionType = Database['public']['Enums']['permission_type'];

interface MemberWithRole extends OrganizationMember {
  role?: CustomRole;
}

interface CartItem extends Product {
  quantity: number;
  lineTotal: number;
}

interface OrganizationContextType {
  organization: Organization | null;
  member: MemberWithRole | null;
  permissions: PermissionType[];
  storeSettings: StoreSettings | null;
  products: Product[];
  transactions: Transaction[];
  cart: CartItem[];
  loading: boolean;
  hasPermission: (permission: PermissionType) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  refreshOrganization: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; tax: number; total: number };
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [member, setMember] = useState<MemberWithRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionType[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`*, role:custom_roles(*)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError) throw memberError;

      if (memberData) {
        setMember(memberData as MemberWithRole);

        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', memberData.organization_id)
          .single();

        if (orgData) setOrganization(orgData);

        const { data: permData } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role_id', memberData.role_id);

        if (permData) {
          setPermissions(permData.map(p => p.permission));
        }

        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('organization_id', memberData.organization_id)
          .maybeSingle();

        if (settingsData) setStoreSettings(settingsData);

        // Fetch products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('organization_id', memberData.organization_id)
          .eq('is_active', true)
          .order('name');

        if (productsData) setProducts(productsData);

        // Fetch recent transactions
        const { data: transData } = await supabase
          .from('transactions')
          .select('*')
          .eq('organization_id', memberData.organization_id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (transData) setTransactions(transData);
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

  const refreshProducts = useCallback(async () => {
    if (!organization) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('is_active', true)
      .order('name');
    if (data) setProducts(data);
  }, [organization]);

  const refreshTransactions = useCallback(async () => {
    if (!organization) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setTransactions(data);
  }, [organization]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * Number(item.price) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, lineTotal: Number(product.price) }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity, lineTotal: quantity * Number(item.price) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxRate = Number(storeSettings?.tax_rate || 18) / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [cart, storeSettings]);

  return (
    <OrganizationContext.Provider value={{
      organization,
      member,
      permissions,
      storeSettings,
      products,
      transactions,
      cart,
      loading,
      hasPermission,
      isOwner,
      isAdmin,
      refreshOrganization: fetchOrganization,
      refreshSettings,
      refreshProducts,
      refreshTransactions,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      getCartTotal,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}
