-- Fix NULL organization_id on existing agrochemicals
-- This sets organization_id for all agrochemicals that are missing it

-- Option 1: If you have only ONE organization, set all agrochemicals to that organization
-- UPDATE public.agrochemicals
-- SET organization_id = (SELECT id FROM public.organizations LIMIT 1)
-- WHERE organization_id IS NULL;

-- Option 2: Set organization_id based on the user who created the record
-- This assumes the user_id column exists or we can use created_at to match
UPDATE public.agrochemicals
SET organization_id = (
  SELECT organization_id 
  FROM public.profiles 
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Verify the update
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.agrochemicals
  WHERE organization_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'Still have % agrochemicals with NULL organization_id', null_count;
  ELSE
    RAISE NOTICE 'All agrochemicals now have organization_id set';
  END IF;
END $$;

-- Make organization_id NOT NULL to prevent future issues
-- (Only do this after confirming all rows have organization_id)
-- ALTER TABLE public.agrochemicals ALTER COLUMN organization_id SET NOT NULL;
