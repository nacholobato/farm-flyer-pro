import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Job, JobStatus } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

interface JobFilters {
  clientId?: string;
  farmId?: string;
  status?: JobStatus;
}

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          client:clients(*),
          farm:farms(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.farmId) {
        query = query.eq('farm_id', filters.farmId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Job[];
    },
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          client:clients(*),
          farm:farms(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Job | null;
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { data: organizationId } = useUserOrganizationId();

  return useMutation({
    mutationFn: async (params: { job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client' | 'farm'>, file?: File | null }) => {
      const { job, file } = params;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      let image_url = job.image_url || null;

      if (file) {
        if (!organizationId) throw new Error('No organization found for file upload');
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${organizationId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('job_photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        image_url = filePath;
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...job, user_id: user.id, image_url: image_url })
        .select()
        .single();

      if (error) {
        // Cleanup photo if db insert failed
        if (image_url && file) {
          await supabase.storage.from('job_photos').remove([image_url]);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Trabajo creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear trabajo: ' + error.message);
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...job }: Partial<Job> & { id: string }) => {
      const { client, farm, ...jobData } = job as any;
      const { data, error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.id] });
      toast.success('Trabajo actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar trabajo: ' + error.message);
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Handle fetching the job first to delete image
      const { data: jobInfo } = await supabase
        .from('jobs')
        .select('image_url')
        .eq('id', id)
        .single();

      if (jobInfo?.image_url) {
        await supabase.storage.from('job_photos').remove([jobInfo.image_url]);
      }

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Trabajo eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar trabajo: ' + error.message);
    },
  });
}

export function useJobPhotoUrl(filePath: string | null | undefined) {
  return useQuery({
    queryKey: ['job-photo-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;

      const { data, error } = await supabase.storage
        .from('job_photos')
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
    staleTime: 3000 * 1000, // 50 minutes (URLs valid for 1 hour)
  });
}