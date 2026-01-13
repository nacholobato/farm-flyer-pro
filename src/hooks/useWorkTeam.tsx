import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkTeam, StaffRole } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

interface WorkTeamFilters {
    role?: StaffRole;
}

export function useWorkTeams(filters?: WorkTeamFilters) {
    const { data: organizationId } = useUserOrganizationId();

    return useQuery({
        queryKey: ['workTeams', organizationId, filters],
        queryFn: async () => {
            if (!organizationId) return [];

            let query = supabase
                .from('work_teams')
                .select('*')
                .eq('organization_id', organizationId)
                .order('full_name', { ascending: true });

            if (filters?.role) {
                query = query.eq('role', filters.role);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as WorkTeam[];
        },
        enabled: !!organizationId,
    });
}

export function useWorkTeam(id: string | undefined) {
    return useQuery({
        queryKey: ['workTeams', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('work_teams')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as WorkTeam | null;
        },
        enabled: !!id,
    });
}

export function useCreateWorkTeam() {
    const queryClient = useQueryClient();
    const { data: organizationId } = useUserOrganizationId();

    return useMutation({
        mutationFn: async (teamMember: Omit<WorkTeam, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
            if (!organizationId) throw new Error('No organization found');

            const { data, error } = await supabase
                .from('work_teams')
                .insert({
                    ...teamMember,
                    organization_id: organizationId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workTeams'] });
            toast.success('Miembro del equipo creado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al crear miembro: ' + error.message);
        },
    });
}

export function useUpdateWorkTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<WorkTeam> & { id: string }) => {
            const { data, error } = await supabase
                .from('work_teams')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['workTeams'] });
            queryClient.invalidateQueries({ queryKey: ['workTeams', variables.id] });
            toast.success('Miembro actualizado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al actualizar miembro: ' + error.message);
        },
    });
}

export function useDeleteWorkTeam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('work_teams')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workTeams'] });
            toast.success('Miembro eliminado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al eliminar miembro: ' + error.message);
        },
    });
}
