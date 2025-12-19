-- Create agrochemicals catalog table
CREATE TABLE public.agrochemicals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  active_ingredient TEXT,
  category TEXT,
  mode_of_action TEXT,
  toxicological_class TEXT,
  manufacturer TEXT,
  function TEXT,
  safety_precautions TEXT,
  label_url TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.agrochemicals ENABLE ROW LEVEL SECURITY;

-- Agrochemicals catalog policies (organization-based access)
CREATE POLICY "Users can view agrochemicals in their organization" ON public.agrochemicals
  FOR SELECT USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can insert agrochemicals for their organization" ON public.agrochemicals
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can update agrochemicals in their organization" ON public.agrochemicals
  FOR UPDATE USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Users can delete agrochemicals from their organization" ON public.agrochemicals
  FOR DELETE USING (
    organization_id = public.get_user_organization_id(auth.uid())
  );

-- Create index for faster lookups
CREATE INDEX idx_agrochemicals_organization_id ON public.agrochemicals(organization_id);
CREATE INDEX idx_agrochemicals_name ON public.agrochemicals(name);

-- Add comments for documentation
COMMENT ON TABLE public.agrochemicals IS 'Catalog of agrochemical products with technical and safety information';
COMMENT ON COLUMN public.agrochemicals.name IS 'Commercial brand name (Marca comercial)';
COMMENT ON COLUMN public.agrochemicals.active_ingredient IS 'Active chemical component (Principio activo)';
COMMENT ON COLUMN public.agrochemicals.toxicological_class IS 'WHO toxicological classification: Ia (Extremely hazardous), Ib (Highly hazardous), II (Moderately hazardous), III (Slightly hazardous), IV (Unlikely to present acute hazard)';
COMMENT ON COLUMN public.agrochemicals.label_url IS 'URL link to product label PDF or image (Marbete)';
