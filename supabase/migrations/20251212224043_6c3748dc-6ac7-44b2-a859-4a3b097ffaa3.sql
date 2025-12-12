-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ruc TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Add organization_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 3. Add organization_id to clients (replacing user_id dependency)
ALTER TABLE public.clients 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 4. Add organization_id to farms
ALTER TABLE public.farms 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- 5. Create security definer function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id
$$;

-- 6. Create trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 7. RLS Policies for organizations
CREATE POLICY "Users can view own organization"
ON public.organizations
FOR SELECT
USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update own organization"
ON public.organizations
FOR UPDATE
USING (id = public.get_user_organization_id(auth.uid()));

-- 8. Drop old client policies and create new organization-based ones
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

CREATE POLICY "Users can view organization clients"
ON public.clients
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organization clients"
ON public.clients
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update organization clients"
ON public.clients
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete organization clients"
ON public.clients
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 9. Drop old farm policies and create new organization-based ones
DROP POLICY IF EXISTS "Users can view farms of own clients" ON public.farms;
DROP POLICY IF EXISTS "Users can insert farms for own clients" ON public.farms;
DROP POLICY IF EXISTS "Users can update farms of own clients" ON public.farms;
DROP POLICY IF EXISTS "Users can delete farms of own clients" ON public.farms;

CREATE POLICY "Users can view organization farms"
ON public.farms
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organization farms"
ON public.farms
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update organization farms"
ON public.farms
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete organization farms"
ON public.farms
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 10. Drop old job policies and create new organization-based ones (via farms)
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

CREATE POLICY "Users can view organization jobs"
ON public.jobs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.farms 
  WHERE farms.id = jobs.farm_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can insert organization jobs"
ON public.jobs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.farms 
  WHERE farms.id = jobs.farm_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can update organization jobs"
ON public.jobs
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.farms 
  WHERE farms.id = jobs.farm_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can delete organization jobs"
ON public.jobs
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.farms 
  WHERE farms.id = jobs.farm_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));

-- 11. Update agrochemicals policies (via jobs -> farms -> organization)
DROP POLICY IF EXISTS "Users can view agrochemicals of own jobs" ON public.agrochemicals_used;
DROP POLICY IF EXISTS "Users can insert agrochemicals for own jobs" ON public.agrochemicals_used;
DROP POLICY IF EXISTS "Users can update agrochemicals of own jobs" ON public.agrochemicals_used;
DROP POLICY IF EXISTS "Users can delete agrochemicals of own jobs" ON public.agrochemicals_used;

CREATE POLICY "Users can view organization agrochemicals"
ON public.agrochemicals_used
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  JOIN public.farms ON farms.id = jobs.farm_id
  WHERE jobs.id = agrochemicals_used.job_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can insert organization agrochemicals"
ON public.agrochemicals_used
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.jobs 
  JOIN public.farms ON farms.id = jobs.farm_id
  WHERE jobs.id = agrochemicals_used.job_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can update organization agrochemicals"
ON public.agrochemicals_used
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  JOIN public.farms ON farms.id = jobs.farm_id
  WHERE jobs.id = agrochemicals_used.job_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can delete organization agrochemicals"
ON public.agrochemicals_used
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.jobs 
  JOIN public.farms ON farms.id = jobs.farm_id
  WHERE jobs.id = agrochemicals_used.job_id 
  AND farms.organization_id = public.get_user_organization_id(auth.uid())
));