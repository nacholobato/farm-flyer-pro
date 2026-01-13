import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Generator } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

export function useGenerators() {
    const { data: organizationId } = useUserOrganizationId();

    return useQuery({
        queryKey: ['generators', organizationId],
        queryFn: async () => {
            if (!organizationId) return [];

            const { data, error } = await supabase
                .from('generators')
                .select('*')
                .eq('organization_id', organizationId)
                .order('brand', { ascending: true });

            if (error) throw error;
            return data as Generator[];
        },
        enabled: !!organizationId,
    });
}

export function useGenerator(id: string | undefined) {
    return useQuery({
        queryKey: ['generators', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('generators')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as Generator | null;
        },
        enabled: !!id,
    });
}

export function useCreateGenerator() {
    const queryClient = useQueryClient();
    const { data: organizationId } = useUserOrganizationId();

    return useMutation({
        mutationFn: async (generator: Omit<Generator, 'id' | 'organization_id' | 'total_hours' | 'created_at' | 'updated_at'>) => {
            if (!organizationId) throw new Error('No organization found');

            const { data, error } = await supabase
                .from('generators')
                .insert({
                    ...generator,
                    organization_id: organizationId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generators'] });
            toast.success('Generador creado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al crear generador: ' + error.message);
        },
    });
}

export function useUpdateGenerator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Generator> & { id: string }) => {
            // Don't allow updating total_hours manually
            const { total_hours, ...safeUpdates } = updates as any;

            const { data, error } = await supabase
                .from('generators')
                .update(safeUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['generators'] });
            queryClient.invalidateQueries({ queryKey: ['generators', variables.id] });
            toast.success('Generador actualizado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al actualizar generador: ' + error.message);
        },
    });
}

export function useDeleteGenerator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('generators')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generators'] });
            toast.success('Generador eliminado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al eliminar generador: ' + error.message);
        },
    });
}
