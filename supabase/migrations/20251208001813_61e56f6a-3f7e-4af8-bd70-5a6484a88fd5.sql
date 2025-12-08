-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS razon_social text,
ADD COLUMN IF NOT EXISTS cuit text,
ADD COLUMN IF NOT EXISTS contacto_principal text,
ADD COLUMN IF NOT EXISTS puesto text,
ADD COLUMN IF NOT EXISTS otro_contacto_1 text,
ADD COLUMN IF NOT EXISTS telefono_1 text,
ADD COLUMN IF NOT EXISTS otro_contacto_2 text,
ADD COLUMN IF NOT EXISTS telefono_2 text;

-- Add new columns to farms table
ALTER TABLE public.farms
ADD COLUMN IF NOT EXISTS cultivo text,
ADD COLUMN IF NOT EXISTS localidad text;

-- Add new columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS cuadro text,
ADD COLUMN IF NOT EXISTS cultivo text,
ADD COLUMN IF NOT EXISTS superficie_teorica_has numeric,
ADD COLUMN IF NOT EXISTS superficie_aplicada_has numeric;