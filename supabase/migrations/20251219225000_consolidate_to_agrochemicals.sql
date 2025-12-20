-- Consolidate products system into agrochemicals catalog
-- This migration unifies the two separate systems
-- Handles both cases: whether product_id exists or not

-- Step 1: Add standard_dose and unit to agrochemicals table
ALTER TABLE public.agrochemicals
  ADD COLUMN IF NOT EXISTS standard_dose NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'L';

-- Step 2: Add agrochemical_id column if it doesn't exist
-- (This handles the case where product_id was never added)
ALTER TABLE public.agrochemicals_used
  ADD COLUMN IF NOT EXISTS agrochemical_id UUID;

-- Step 3: If product_id exists, copy its data to agrochemical_id and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agrochemicals_used' 
    AND column_name = 'product_id'
  ) THEN
    -- Copy data from product_id to agrochemical_id
    UPDATE agrochemicals_used SET agrochemical_id = product_id WHERE product_id IS NOT NULL;
    
    -- Drop the old column
    ALTER TABLE public.agrochemicals_used DROP COLUMN product_id;
  END IF;
END $$;

-- Step 4: Add foreign key constraint to agrochemicals table
ALTER TABLE public.agrochemicals_used
  DROP CONSTRAINT IF EXISTS agrochemicals_used_product_id_fkey,
  DROP CONSTRAINT IF EXISTS agrochemicals_used_agrochemical_id_fkey;

ALTER TABLE public.agrochemicals_used
  ADD CONSTRAINT agrochemicals_used_agrochemical_id_fkey
  FOREIGN KEY (agrochemical_id)
  REFERENCES public.agrochemicals(id)
  ON DELETE SET NULL;

-- Step 5: Drop products table (no longer needed)
DROP TABLE IF EXISTS public.products CASCADE;

-- Step 6: Update comments for clarity
COMMENT ON COLUMN public.agrochemicals_used.agrochemical_id IS 'FK to agrochemicals catalog. Null for manual entries or legacy data.';
COMMENT ON COLUMN public.agrochemicals.standard_dose IS 'Default/recommended dose for this product';
COMMENT ON COLUMN public.agrochemicals.unit IS 'Standard unit of measurement (L, kg, mL, g, etc.)';
