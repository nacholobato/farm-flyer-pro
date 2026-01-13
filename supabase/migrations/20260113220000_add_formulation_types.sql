-- Add formulation types reference table for agrochemicals
-- This table contains standard formulation categories as defined by industry standards

-- Step 1: Create formulation_types reference table (global, no organization_id)
CREATE TABLE IF NOT EXISTS public.formulation_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  physical_state TEXT
);

-- Step 2: Insert the formulation type data
INSERT INTO public.formulation_types (code, name, description, physical_state) VALUES
  ('SL', 'Concentrado Soluble', 'Líquido que forma una solución verdadera en agua.', 'Líquido'),
  ('EC', 'Concentrado Emulsionable', 'Líquido con solventes que forma una emulsión.', 'Líquido'),
  ('SC', 'Suspensión Concentrada', 'Partículas sólidas suspendidas en un líquido.', 'Líquido viscoso'),
  ('WP', 'Polvo Mojable', 'Polvo fino que forma una suspensión.', 'Sólido (Polvo)'),
  ('WG', 'Granulado Dispersable', 'Gránulos que se desintegran en agua (sin polvo).', 'Sólido (Gránulo)'),
  ('SP', 'Polvo Soluble', 'Polvo que se disuelve totalmente.', 'Sólido (Polvo)'),
  ('SG', 'Granulado Soluble', 'Gránulos que se disuelven totalmente.', 'Sólido (Gránulo)'),
  ('EW', 'Emulsión de aceite en agua', 'Líquido con fase aceitosa dispersa en agua.', 'Líquido'),
  ('ME', 'Micro-emulsión', 'Líquido transparente que forma emulsión fina.', 'Líquido'),
  ('CS', 'Suspensión de Encapsulado', 'IA dentro de micro-cápsulas suspendidas.', 'Líquido'),
  ('SE', 'Suspo-emulsión', 'Mezcla de una SC y una EW.', 'Líquido'),
  ('ZC', 'Mezcla de CS y SC', 'Combinación de cápsulas y partículas libres.', 'Líquido')
ON CONFLICT (code) DO NOTHING;

-- Step 3: Add formulation_code column to agrochemicals table
ALTER TABLE public.agrochemicals
  ADD COLUMN IF NOT EXISTS formulation_code TEXT;

-- Step 4: Add foreign key constraint
ALTER TABLE public.agrochemicals
  ADD CONSTRAINT fk_agrochemicals_formulation
  FOREIGN KEY (formulation_code)
  REFERENCES public.formulation_types(code)
  ON DELETE SET NULL;

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agrochemicals_formulation_code 
  ON public.agrochemicals(formulation_code);

-- Step 6: Add comments for documentation
COMMENT ON TABLE public.formulation_types IS 'Reference table for agrochemical formulation types (global, industry-standard classifications)';
COMMENT ON COLUMN public.formulation_types.code IS 'Abbreviation code (e.g., SL, EC, SC)';
COMMENT ON COLUMN public.formulation_types.name IS 'Full name of formulation type in Spanish';
COMMENT ON COLUMN public.formulation_types.description IS 'Technical description of the formulation';
COMMENT ON COLUMN public.formulation_types.physical_state IS 'Physical state of the formulation (Líquido, Sólido, etc.)';
COMMENT ON COLUMN public.agrochemicals.formulation_code IS 'FK to formulation_types. Indicates the physical formulation type of the product';
