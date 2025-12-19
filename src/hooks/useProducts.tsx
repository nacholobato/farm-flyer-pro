import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

export function useProducts() {
    const { data: organizationId } = useUserOrganizationId();

    return useQuery({
        queryKey: ['products', organizationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            return data as Product[];
        },
        enabled: !!organizationId,
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();
    const { data: organizationId } = useUserOrganizationId();

    return useMutation({
        mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'organization_id'>) => {
            if (!organizationId) throw new Error('No organization found');

            const { data, error } = await supabase
                .from('products')
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
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto creado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al crear producto: ' + error.message);
        },
    });
}
