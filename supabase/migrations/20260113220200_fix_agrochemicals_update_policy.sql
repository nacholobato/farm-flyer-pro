-- Fix agrochemicals UPDATE policy to include WITH CHECK clause
-- This ensures updates can both read the existing row and verify the updated row

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update agrochemicals in their organization" ON public.agrochemicals;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Users can update agrochemicals in their organization" 
ON public.agrochemicals
FOR UPDATE 
USING (organization_id = public.get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- Add comment
COMMENT ON POLICY "Users can update agrochemicals in their organization" ON public.agrochemicals IS 
  'Allows users to update agrochemicals that belong to their organization. Both USING and WITH CHECK ensure the row belongs to user organization before and after update.';
