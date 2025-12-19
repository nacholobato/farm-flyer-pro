-- ====================================
-- SCRIPT PARA CORREGIR LAS POLÍTICAS DE RECURSOS
-- Ejecuta esto si ya ejecutaste la migración anterior y tienes errores de RLS
-- ====================================

-- 1. Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view resources in their organization" ON public.resources;
DROP POLICY IF EXISTS "Users can insert resources for their organization" ON public.resources;
DROP POLICY IF EXISTS "Users can update resources in their organization" ON public.resources;
DROP POLICY IF EXISTS "Users can delete resources in their organization" ON public.resources;

-- 2. Crear las políticas correctas usando get_user_organization_id
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

-- 3. Eliminar políticas de storage antiguas si existen
DROP POLICY IF EXISTS "Users can view resource files in their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload resource files for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can update resource files in their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete resource files in their organization" ON storage.objects;

-- 4. Crear políticas de storage correctas
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

-- 5. Verificar políticas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'resources';

SELECT * FROM storage.policies WHERE bucket_id = 'resources';
