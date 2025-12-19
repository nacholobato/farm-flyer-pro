-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  standard_dose NUMERIC,
  unit TEXT NOT NULL DEFAULT 'L',
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products policies (organization-based access using the same pattern as other tables)
CREATE POLICY "Users can view products in their organization" ON public.products
  FOR SELECT USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert products for their organization" ON public.products
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update products in their organization" ON public.products
  FOR UPDATE USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete products in their organization" ON public.products
  FOR DELETE USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );
