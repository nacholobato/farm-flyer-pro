-- Add dose_caldo field to jobs table
-- This field represents the liters of spray mixture (caldo) per hectare
ALTER TABLE public.jobs
ADD COLUMN dose_caldo NUMERIC(10,2);

-- Set a default value for existing jobs (10 L/ha is a common default)
UPDATE public.jobs
SET dose_caldo = 10.0
WHERE dose_caldo IS NULL;
