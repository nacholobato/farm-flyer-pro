-- Create resource category enum
CREATE TYPE public.resource_category AS ENUM (
  'weather_climate',
  'crop_information',
  'market_prices',
  'pest_management',
  'education_research',
  'data_statistics',
  'equipment',
  'regulations',
  'other'
);

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category public.resource_category NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Resources policies (organization-based access using the same pattern as other tables)
CREATE POLICY "Users can view resources in their organization" ON public.resources
  FOR SELECT USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert resources for their organization" ON public.resources
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update resources in their organization" ON public.resources
  FOR UPDATE USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete resources in their organization" ON public.resources
  FOR DELETE USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER set_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for resource files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'resources',
  'resources',
  false,
  52428800,  -- 50 MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];

-- Storage policies for resources bucket
CREATE POLICY "Users can view resource files in their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resources' AND
  EXISTS (
    SELECT 1 FROM public.resources
    WHERE resources.file_path = storage.objects.name
    AND resources.organization_id = public.get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can upload resource files for their organization"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update resource files in their organization"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources' AND
  EXISTS (
    SELECT 1 FROM public.resources
    WHERE resources.file_path = storage.objects.name
    AND resources.organization_id = public.get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can delete resource files in their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' AND
  EXISTS (
    SELECT 1 FROM public.resources
    WHERE resources.file_path = storage.objects.name
    AND resources.organization_id = public.get_user_organization_id(auth.uid())
  )
);
