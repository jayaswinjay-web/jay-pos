-- =====================================================
-- ENTERPRISE MULTI-TENANT POS SYSTEM
-- =====================================================

-- 1. ENUMS
-- =====================================================
CREATE TYPE public.default_role_type AS ENUM ('owner', 'admin', 'cashier');
CREATE TYPE public.permission_type AS ENUM (
  'manage_organization',
  'manage_users',
  'manage_roles',
  'manage_products',
  'manage_transactions',
  'manage_cash',
  'manage_settings',
  'view_reports',
  'create_bills'
);
CREATE TYPE public.cash_log_type AS ENUM ('in', 'out');
CREATE TYPE public.payment_method AS ENUM ('cash', 'upi', 'card');
CREATE TYPE public.transaction_status AS ENUM ('completed', 'pending', 'cancelled');

-- 2. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CUSTOM ROLES TABLE
-- =====================================================
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  default_role_type public.default_role_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- 4. ROLE PERMISSIONS TABLE
-- =====================================================
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission public.permission_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission)
);

-- 5. ORGANIZATION MEMBERS TABLE
-- =====================================================
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 6. STORE SETTINGS TABLE
-- =====================================================
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  store_name TEXT NOT NULL DEFAULT 'My Store',
  store_address TEXT,
  store_phone TEXT,
  gst_number TEXT,
  upi_id TEXT DEFAULT '9003368894@upi',
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  currency TEXT DEFAULT 'INR',
  receipt_footer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PRODUCTS TABLE
-- =====================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_no TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  status public.transaction_status NOT NULL DEFAULT 'completed',
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, invoice_no)
);

-- 9. CASH LOGS TABLE
-- =====================================================
CREATE TABLE public.cash_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.cash_log_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id
    AND user_id = auth.uid()
    AND is_active = true
  )
$$;

-- Get user's role ID in organization
CREATE OR REPLACE FUNCTION public.get_user_role_in_org(_org_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_id FROM public.organization_members
  WHERE organization_id = _org_id
  AND user_id = auth.uid()
  AND is_active = true
  LIMIT 1
$$;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_org_permission(_org_id UUID, _permission public.permission_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.role_permissions rp ON rp.role_id = om.role_id
    WHERE om.organization_id = _org_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND rp.permission = _permission
  )
$$;

-- Check if user is organization owner
CREATE OR REPLACE FUNCTION public.is_org_owner(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.custom_roles cr ON cr.id = om.role_id
    WHERE om.organization_id = _org_id
    AND om.user_id = auth.uid()
    AND om.is_active = true
    AND cr.default_role_type = 'owner'
  )
$$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- ORGANIZATIONS: Members can view their org
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

CREATE POLICY "Owners can update their organizations"
  ON public.organizations FOR UPDATE
  USING (public.is_org_owner(id));

-- CUSTOM ROLES: Members can view, owners can manage
CREATE POLICY "Members can view roles"
  ON public.custom_roles FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Owners can insert roles"
  ON public.custom_roles FOR INSERT
  WITH CHECK (public.is_org_owner(organization_id));

CREATE POLICY "Owners can update roles"
  ON public.custom_roles FOR UPDATE
  USING (public.is_org_owner(organization_id));

CREATE POLICY "Owners can delete roles"
  ON public.custom_roles FOR DELETE
  USING (public.is_org_owner(organization_id) AND is_system_role = false);

-- ROLE PERMISSIONS: Members can view, owners can manage
CREATE POLICY "Members can view permissions"
  ON public.role_permissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.custom_roles cr
    WHERE cr.id = role_id AND public.is_org_member(cr.organization_id)
  ));

CREATE POLICY "Owners can manage permissions"
  ON public.role_permissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.custom_roles cr
    WHERE cr.id = role_id AND public.is_org_owner(cr.organization_id)
  ));

-- ORGANIZATION MEMBERS: Members can view, authorized can manage
CREATE POLICY "Members can view members"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Authorized users can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.has_org_permission(organization_id, 'manage_users'));

CREATE POLICY "Authorized users can update members"
  ON public.organization_members FOR UPDATE
  USING (public.has_org_permission(organization_id, 'manage_users'));

CREATE POLICY "Authorized users can delete members"
  ON public.organization_members FOR DELETE
  USING (public.has_org_permission(organization_id, 'manage_users'));

-- STORE SETTINGS: Members can view, owners can update
CREATE POLICY "Members can view settings"
  ON public.store_settings FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Owners can update settings"
  ON public.store_settings FOR UPDATE
  USING (public.has_org_permission(organization_id, 'manage_settings'));

CREATE POLICY "Owners can insert settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (public.is_org_owner(organization_id));

-- PRODUCTS: Members can view, authorized can manage
CREATE POLICY "Members can view products"
  ON public.products FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Authorized users can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.has_org_permission(organization_id, 'manage_products'));

CREATE POLICY "Authorized users can update products"
  ON public.products FOR UPDATE
  USING (public.has_org_permission(organization_id, 'manage_products'));

CREATE POLICY "Authorized users can delete products"
  ON public.products FOR DELETE
  USING (public.has_org_permission(organization_id, 'manage_products'));

-- TRANSACTIONS: Members can view, authorized can manage
CREATE POLICY "Members can view transactions"
  ON public.transactions FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Authorized users can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.has_org_permission(organization_id, 'create_bills'));

CREATE POLICY "Authorized users can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.has_org_permission(organization_id, 'manage_transactions'));

-- CASH LOGS: Members can view, authorized can manage
CREATE POLICY "Members can view cash logs"
  ON public.cash_logs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Authorized users can insert cash logs"
  ON public.cash_logs FOR INSERT
  WITH CHECK (public.has_org_permission(organization_id, 'manage_cash'));

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_organization_members
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_store_settings
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Create organization with owner
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_organization(
  _name TEXT,
  _subdomain TEXT,
  _owner_name TEXT,
  _owner_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _owner_role_id UUID;
  _admin_role_id UUID;
  _cashier_role_id UUID;
BEGIN
  -- Create organization
  INSERT INTO public.organizations (name, subdomain)
  VALUES (_name, _subdomain)
  RETURNING id INTO _org_id;

  -- Create default roles
  INSERT INTO public.custom_roles (organization_id, name, description, is_system_role, default_role_type)
  VALUES (_org_id, 'Owner', 'Full access to all features', true, 'owner')
  RETURNING id INTO _owner_role_id;

  INSERT INTO public.custom_roles (organization_id, name, description, is_system_role, default_role_type)
  VALUES (_org_id, 'Admin', 'Manage products, users, and view reports', true, 'admin')
  RETURNING id INTO _admin_role_id;

  INSERT INTO public.custom_roles (organization_id, name, description, is_system_role, default_role_type)
  VALUES (_org_id, 'Cashier', 'Create bills and manage cash', true, 'cashier')
  RETURNING id INTO _cashier_role_id;

  -- Add all permissions to owner
  INSERT INTO public.role_permissions (role_id, permission)
  SELECT _owner_role_id, p::public.permission_type
  FROM unnest(ARRAY['manage_organization', 'manage_users', 'manage_roles', 'manage_products', 
                    'manage_transactions', 'manage_cash', 'manage_settings', 'view_reports', 'create_bills']) AS p;

  -- Add admin permissions
  INSERT INTO public.role_permissions (role_id, permission)
  SELECT _admin_role_id, p::public.permission_type
  FROM unnest(ARRAY['manage_users', 'manage_products', 'manage_transactions', 
                    'manage_cash', 'view_reports', 'create_bills']) AS p;

  -- Add cashier permissions
  INSERT INTO public.role_permissions (role_id, permission)
  SELECT _cashier_role_id, p::public.permission_type
  FROM unnest(ARRAY['create_bills', 'manage_cash']) AS p;

  -- Add owner as member
  INSERT INTO public.organization_members (organization_id, user_id, role_id, display_name, email)
  VALUES (_org_id, auth.uid(), _owner_role_id, _owner_name, _owner_email);

  -- Create default store settings
  INSERT INTO public.store_settings (organization_id, store_name)
  VALUES (_org_id, _name);

  RETURN _org_id;
END;
$$;

-- =====================================================
-- FUNCTION: Generate invoice number
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_invoice_no(_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO _count
  FROM public.transactions
  WHERE organization_id = _org_id;
  
  RETURN 'INV-' || LPAD(_count::TEXT, 5, '0');
END;
$$;