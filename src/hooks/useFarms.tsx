import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Farm } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

export function useFarms(clientId?: string) {
  const { data: organizationId } = useUserOrganizationId();

  return useQuery({
    queryKey: ['farms', clientId, organizationId],
    queryFn: async () => {
      let query = supabase.from('farms').select('*').order('name');
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Farm[];
    },
    enabled: !!organizationId,
  });
}

export function useFarm(id: string | undefined) {
  return useQuery({
    queryKey: ['farms', 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Farm | null;
    },
    enabled: !!id,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  const { data: organizationId } = useUserOrganizationId();

  return useMutation({
    mutationFn: async (farm: Omit<Farm, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!organizationId) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('farms')
        .insert({
          ...farm,
          organization_id: organizationId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['farms', variables.client_id] });
      toast.success('Finca creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear finca: ' + error.message);
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...farm }: Partial<Farm> & { id: string }) => {
      const { data, error } = await supabase
        .from('farms')
        .update(farm)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast.success('Finca actualizada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar finca: ' + error.message);
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast.success('Finca eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar finca: ' + error.message);
    },
  });
}
