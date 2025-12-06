import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Job, JobStatus } from '@/types/database';
import { toast } from 'sonner';

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

  return useMutation({
    mutationFn: async (job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client' | 'farm'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...job, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
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