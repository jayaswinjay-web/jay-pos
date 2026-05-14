-- Fix 1: Add access control to generate_invoice_no function
-- Also fix info leakage by using date-based + random invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_no(_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _date_prefix TEXT;
  _random_suffix TEXT;
BEGIN
  -- Security check: Verify user has permission to create bills for this org
  IF NOT has_org_permission(_org_id, 'create_bills'::permission_type) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;
  
  -- Generate date-based prefix (YYYYMMDD)
  _date_prefix := to_char(now(), 'YYYYMMDD');
  
  -- Generate random alphanumeric suffix (prevents count disclosure)
  _random_suffix := upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 6));
  
  RETURN 'INV-' || _date_prefix || '-' || _random_suffix;
END;
$$;

-- Fix 2: Add database constraints for data validation
-- Products: price must be >= 0, stock must be >= 0
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_price_positive;
ALTER TABLE public.products ADD CONSTRAINT products_price_positive CHECK (price >= 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_stock_non_negative;
ALTER TABLE public.products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);

-- Transactions: discount cannot exceed subtotal, amounts must be non-negative
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_discount_valid;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_discount_valid CHECK (discount >= 0 AND discount <= subtotal);

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_amounts_positive;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amounts_positive CHECK (subtotal >= 0 AND total >= 0 AND tax >= 0);

-- Add text length constraints using triggers (CHECK constraints can't do this easily)
CREATE OR REPLACE FUNCTION public.validate_product_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate name length
  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Product name too long (max 200 characters)';
  END IF;
  
  -- Validate description length
  IF NEW.description IS NOT NULL AND length(NEW.description) > 1000 THEN
    RAISE EXCEPTION 'Product description too long (max 1000 characters)';
  END IF;
  
  -- Validate category length
  IF NEW.category IS NOT NULL AND length(NEW.category) > 100 THEN
    RAISE EXCEPTION 'Category name too long (max 100 characters)';
  END IF;
  
  -- Validate SKU format
  IF NEW.sku IS NOT NULL AND length(NEW.sku) > 50 THEN
    RAISE EXCEPTION 'SKU too long (max 50 characters)';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_product_data_trigger ON public.products;
CREATE TRIGGER validate_product_data_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_product_data();

-- Validate transaction data
CREATE OR REPLACE FUNCTION public.validate_transaction_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate customer name length
  IF NEW.customer_name IS NOT NULL AND length(NEW.customer_name) > 200 THEN
    RAISE EXCEPTION 'Customer name too long (max 200 characters)';
  END IF;
  
  -- Validate customer phone (max 20 chars)
  IF NEW.customer_phone IS NOT NULL AND length(NEW.customer_phone) > 20 THEN
    RAISE EXCEPTION 'Customer phone too long (max 20 characters)';
  END IF;
  
  -- Validate notes length
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 500 THEN
    RAISE EXCEPTION 'Notes too long (max 500 characters)';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_transaction_data_trigger ON public.transactions;
CREATE TRIGGER validate_transaction_data_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_data();

-- Fix 3: Add DELETE policy for transactions (owners only)
CREATE POLICY "Owners can delete transactions"
  ON public.transactions FOR DELETE
  USING (is_org_owner(organization_id));

-- Fix 4: Restrict member visibility to those with manage_users permission or self
DROP POLICY IF EXISTS "Members can view members" ON public.organization_members;
CREATE POLICY "Authorized users can view members"
  ON public.organization_members FOR SELECT
  USING (
    has_org_permission(organization_id, 'manage_users'::permission_type)
    OR user_id = auth.uid()
  );