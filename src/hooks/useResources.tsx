import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Resource, ResourceCategory } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

export function useResources() {
    const { data: organizationId } = useUserOrganizationId();

    return useQuery({
        queryKey: ['resources', organizationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Resource[];
        },
        enabled: !!organizationId,
    });
}

export function useResource(id: string | undefined) {
    return useQuery({
        queryKey: ['resources', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as Resource | null;
        },
        enabled: !!id,
    });
}

interface CreateResourceParams {
    title: string;
    description?: string;
    category: ResourceCategory;
    file: File;
}

export function useCreateResource() {
    const queryClient = useQueryClient();
    const { data: organizationId } = useUserOrganizationId();

    return useMutation({
        mutationFn: async ({ title, description, category, file }: CreateResourceParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');
            if (!organizationId) throw new Error('No organization found');

            // Generate unique file path
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${organizationId}/${fileName}`;

            // Upload file to storage
            const { error: uploadError } = await supabase.storage
                .from('resources')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Create resource record
            const { data, error } = await supabase
                .from('resources')
                .insert({
                    organization_id: organizationId,
                    user_id: user.id,
                    title,
                    description: description || null,
                    category,
                    file_path: filePath,
                    file_name: file.name,
                    file_size: file.size,
                    mime_type: file.type,
                })
                .select()
                .single();

            if (error) {
                // Cleanup: delete uploaded file if database insert fails
                await supabase.storage.from('resources').remove([filePath]);
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            toast.success('Recurso subido exitosamente');
        },
        onError: (error) => {
            console.error('Error creating resource:', error);
            toast.error('Error al subir recurso: ' + error.message);
        },
    });
}

export function useUpdateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Resource> & { id: string }) => {
            const { data, error } = await supabase
                .from('resources')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            queryClient.invalidateQueries({ queryKey: ['resources', variables.id] });
            toast.success('Recurso actualizado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al actualizar recurso: ' + error.message);
        },
    });
}

export function useDeleteResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resource: Resource) => {
            // Delete file from storage
            const { error: storageError } = await supabase.storage
                .from('resources')
                .remove([resource.file_path]);

            if (storageError) {
                console.error('Error deleting file from storage:', storageError);
                // Continue with database deletion even if storage deletion fails
            }

            // Delete resource record
            const { error } = await supabase
                .from('resources')
                .delete()
                .eq('id', resource.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
            toast.success('Recurso eliminado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al eliminar recurso: ' + error.message);
        },
    });
}

export function useResourceDownloadUrl(filePath: string | undefined) {
    return useQuery({
        queryKey: ['resource-download-url', filePath],
        queryFn: async () => {
            if (!filePath) return null;

            const { data, error } = await supabase.storage
                .from('resources')
                .createSignedUrl(filePath, 3600); // URL valid for 1 hour

            if (error) throw error;
            return data.signedUrl;
        },
        enabled: !!filePath,
        staleTime: 3000 * 1000, // 50 minutes (URLs valid for 1 hour)
    });
}
