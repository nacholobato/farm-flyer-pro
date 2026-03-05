-- Add image_url to jobs table
ALTER TABLE public.jobs
  ADD COLUMN image_url TEXT;

-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'job_photos',
  'job_photos',
  false,
  10485760,  -- 10 MB limit for photos
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Storage policies for job_photos bucket

-- Check if policies exist before creating to avoid errors on rerun
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Users can upload job photos for their organization"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'job_photos' AND
          auth.role() = 'authenticated'
        );
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can view job photos belonging to their organization"
        ON storage.objects FOR SELECT
        USING (
          bucket_id = 'job_photos' AND
          (
            -- Allow viewing if the file path matches a job belonging to the user's organization
            EXISTS (
              SELECT 1 FROM public.jobs
              WHERE jobs.image_url = storage.objects.name
              AND jobs.client_id IN (
                SELECT id FROM public.clients WHERE organization_id = public.get_user_organization_id(auth.uid())
              )
            )
            OR
            -- Or if the uploader's path starts with their organization ID
            storage.objects.name LIKE public.get_user_organization_id(auth.uid())::text || '/%'
          )
        );
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        CREATE POLICY "Users can delete job photos belonging to their organization"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'job_photos' AND
          storage.objects.name LIKE public.get_user_organization_id(auth.uid())::text || '/%'
        );
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END
$$;
