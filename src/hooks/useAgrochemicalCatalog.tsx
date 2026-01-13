import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agrochemical, FormulationType } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

export function useAgrochemicalCatalog() {
    const { data: organizationId } = useUserOrganizationId();

    return useQuery({
        queryKey: ['agrochemical-catalog', organizationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('agrochemicals')
                .select('*')
                .order('name');

            if (error) throw error;
            return data as Agrochemical[];
        },
        enabled: !!organizationId,
    });
}

export function useCreateAgrochemicalProduct() {
    const queryClient = useQueryClient();
    const { data: organizationId } = useUserOrganizationId();

    return useMutation({
        mutationFn: async (product: Omit<Agrochemical, 'id' | 'created_at' | 'organization_id'>) => {
            if (!organizationId) throw new Error('No organization found');

            const { data, error } = await supabase
                .from('agrochemicals')
                .insert({
                    ...product,
                    organization_id: organizationId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agrochemical-catalog'] });
            toast.success('Producto agregado al catálogo');
        },
        onError: (error) => {
            toast.error('Error al agregar producto: ' + error.message);
        },
    });
}

export function useUpdateAgrochemicalProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...product }: Partial<Agrochemical> & { id: string }) => {
            console.log('Attempting to update agrochemical:', { id, product });

            const { data, error, count } = await supabase
                .from('agrochemicals')
                .update(product)
                .eq('id', id)
                .select()
                .maybeSingle();

            console.log('Update result:', { data, error, count });

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            if (!data) {
                console.warn('Update succeeded but no data returned. This might be an RLS issue.');
            }

            return data || { id };
        },
        onSuccess: (data) => {
            console.log('Update successful:', data);
            queryClient.invalidateQueries({ queryKey: ['agrochemical-catalog'] });
            toast.success('Producto actualizado');
        },
        onError: (error: any) => {
            console.error('Update mutation error:', error);
            toast.error('Error al actualizar producto: ' + error.message);
        },
    });
}

export function useDeleteAgrochemicalProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('agrochemicals')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agrochemical-catalog'] });
            toast.success('Producto eliminado del catálogo');
        },
        onError: (error) => {
            toast.error('Error al eliminar producto: ' + error.message);
        },
    });
}

export function useFormulationTypes() {
    return useQuery({
        queryKey: ['formulation-types'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('formulation_types')
                .select('*')
                .order('code');

            if (error) throw error;
            return data as FormulationType[];
        },
        staleTime: Infinity, // Formulation types are static reference data
    });
}
