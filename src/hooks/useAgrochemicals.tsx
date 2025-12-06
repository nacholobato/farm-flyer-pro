import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgrochemicalUsed } from '@/types/database';
import { toast } from 'sonner';

export function useAgrochemicals(jobId: string | undefined) {
  return useQuery({
    queryKey: ['agrochemicals', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('agrochemicals_used')
        .select('*')
        .eq('job_id', jobId)
        .order('application_order');
      
      if (error) throw error;
      return data as AgrochemicalUsed[];
    },
    enabled: !!jobId,
  });
}

export function useCreateAgrochemical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agrochemical: Omit<AgrochemicalUsed, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('agrochemicals_used')
        .insert(agrochemical)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agrochemicals', variables.job_id] });
      toast.success('Agroquímico agregado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al agregar agroquímico: ' + error.message);
    },
  });
}

export function useUpdateAgrochemical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, job_id, ...agrochemical }: Partial<AgrochemicalUsed> & { id: string; job_id: string }) => {
      const { data, error } = await supabase
        .from('agrochemicals_used')
        .update(agrochemical)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, job_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agrochemicals', data.job_id] });
      toast.success('Agroquímico actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar agroquímico: ' + error.message);
    },
  });
}

export function useDeleteAgrochemical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, jobId }: { id: string; jobId: string }) => {
      const { error } = await supabase
        .from('agrochemicals_used')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { jobId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agrochemicals', data.jobId] });
      toast.success('Agroquímico eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar agroquímico: ' + error.message);
    },
  });
}