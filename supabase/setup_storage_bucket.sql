-- ====================================
-- SCRIPT PARA CREAR EL BUCKET DE RECURSOS
-- Ejecuta este script en el SQL Editor de Supabase
-- ====================================

-- 1. Crear el bucket de almacenamiento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'resources',
  'resources',
  false,  -- private bucket (requires authentication)
  52428800,  -- 50 MB max file size
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];

-- 2. Verificar que el bucket fue creado
SELECT * FROM storage.buckets WHERE id = 'resources';
