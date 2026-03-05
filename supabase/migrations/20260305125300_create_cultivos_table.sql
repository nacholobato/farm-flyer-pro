-- Create cultivos table and RLS policies
-- Author: Antigravity AI
-- Date: 2026-03-05

CREATE TABLE public.cultivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE public.cultivos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view organization cultivos"
ON public.cultivos
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organization cultivos"
ON public.cultivos
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update organization cultivos"
ON public.cultivos
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete organization cultivos"
ON public.cultivos
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER set_cultivos_updated_at
  BEFORE UPDATE ON public.cultivos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for better query performance
CREATE INDEX idx_cultivos_organization_id ON public.cultivos(organization_id);
CREATE INDEX idx_cultivos_name ON public.cultivos(name);
