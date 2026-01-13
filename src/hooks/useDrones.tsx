import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Drone } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

export function useDrones() {
    const { data: organizationId } = useUserOrganizationId();

    return useQuery({
        queryKey: ['drones', organizationId],
        queryFn: async () => {
            if (!organizationId) return [];

            const { data, error } = await supabase
                .from('drones')
                .select('*')
                .eq('organization_id', organizationId)
                .order('model', { ascending: true });

            if (error) throw error;
            return data as Drone[];
        },
        enabled: !!organizationId,
    });
}

export function useDrone(id: string | undefined) {
    return useQuery({
        queryKey: ['drones', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('drones')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as Drone | null;
        },
        enabled: !!id,
    });
}

export function useCreateDrone() {
    const queryClient = useQueryClient();
    const { data: organizationId } = useUserOrganizationId();

    return useMutation({
        mutationFn: async (drone: Omit<Drone, 'id' | 'organization_id' | 'total_hours' | 'created_at' | 'updated_at'>) => {
            if (!organizationId) throw new Error('No organization found');

            const { data, error } = await supabase
                .from('drones')
                .insert({
                    ...drone,
                    organization_id: organizationId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drones'] });
            toast.success('Dron creado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al crear dron: ' + error.message);
        },
    });
}

export function useUpdateDrone() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Drone> & { id: string }) => {
            // Don't allow updating total_hours manually
            const { total_hours, ...safeUpdates } = updates as any;

            const { data, error } = await supabase
                .from('drones')
                .update(safeUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['drones'] });
            queryClient.invalidateQueries({ queryKey: ['drones', variables.id] });
            toast.success('Dron actualizado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al actualizar dron: ' + error.message);
        },
    });
}

export function useDeleteDrone() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('drones')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drones'] });
            toast.success('Dron eliminado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al eliminar dron: ' + error.message);
        },
    });
}
