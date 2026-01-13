import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OperationalAttendance, HectaresSummary } from '@/types/database';
import { toast } from 'sonner';
import { useUserOrganizationId } from './useOrganization';

interface AttendanceFilters {
    jobId?: string;
    startDate?: string;
    endDate?: string;
    activityType?: string;
}

export function useOperationalAttendance(filters?: AttendanceFilters) {
    const { data: organizationId } = useUserOrganizationId();

    return useQuery({
        queryKey: ['operationalAttendance', organizationId, filters],
        queryFn: async () => {
            if (!organizationId) return [];

            let query = supabase
                .from('operational_attendance')
                .select(`
          *,
          pilot:work_teams!pilot_id(*),
          assistant:work_teams!assistant_id(*),
          drone:drones(*),
          generator:generators(*),
          job:jobs(*)
        `)
                .eq('organization_id', organizationId)
                .order('start_date', { ascending: false });

            if (filters?.jobId) {
                query = query.eq('job_id', filters.jobId);
            }
            if (filters?.startDate) {
                query = query.gte('start_date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('start_date', filters.endDate);
            }
            if (filters?.activityType) {
                query = query.eq('activity_type', filters.activityType);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as OperationalAttendance[];
        },
        enabled: !!organizationId,
    });
}

export function useAttendanceRecord(id: string | undefined) {
    return useQuery({
        queryKey: ['operationalAttendance', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('operational_attendance')
                .select(`
          *,
          pilot:work_teams!pilot_id(*),
          assistant:work_teams!assistant_id(*),
          drone:drones(*),
          generator:generators(*),
          job:jobs(*)
        `)
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as OperationalAttendance | null;
        },
        enabled: !!id,
    });
}

export function useHectaresSummary(jobId: string | undefined) {
    return useQuery({
        queryKey: ['hectaresSummary', jobId],
        queryFn: async () => {
            if (!jobId) return null;

            const { data, error } = await supabase
                .rpc('get_job_hectares_summary', { p_job_id: jobId });

            if (error) throw error;
            return data && data.length > 0 ? data[0] as HectaresSummary : null;
        },
        enabled: !!jobId,
    });
}

export function useCreateAttendance() {
    const queryClient = useQueryClient();
    const { data: organizationId } = useUserOrganizationId();

    return useMutation({
        mutationFn: async (attendance: Omit<OperationalAttendance, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'pilot' | 'assistant' | 'drone' | 'generator' | 'job'>) => {
            if (!organizationId) throw new Error('No organization found');

            // Check hectares validation before insert
            if (attendance.hectares_done && attendance.job_id) {
                const { data: summary } = await supabase
                    .rpc('get_job_hectares_summary', { p_job_id: attendance.job_id });

                if (summary && summary.length > 0) {
                    const hectaresSum = summary[0] as HectaresSummary;
                    const newTotal = (hectaresSum.total_hectares_done || 0) + attendance.hectares_done;

                    if (hectaresSum.job_applied_hectares && newTotal > hectaresSum.job_applied_hectares) {
                        toast.warning(
                            `⚠️ Advertencia: Total de hectáreas (${newTotal.toFixed(2)}) excede las hectáreas aplicadas del trabajo (${hectaresSum.job_applied_hectares.toFixed(2)})`
                        );
                    } else if (hectaresSum.job_theoretical_hectares && newTotal > hectaresSum.job_theoretical_hectares) {
                        toast.warning(
                            `⚠️ Advertencia: Total de hectáreas (${newTotal.toFixed(2)}) excede las hectáreas teóricas del trabajo (${hectaresSum.job_theoretical_hectares.toFixed(2)})`
                        );
                    }
                }
            }

            const { data, error } = await supabase
                .from('operational_attendance')
                .insert({
                    ...attendance,
                    organization_id: organizationId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['operationalAttendance'] });
            queryClient.invalidateQueries({ queryKey: ['hectaresSummary', variables.job_id] });
            queryClient.invalidateQueries({ queryKey: ['drones'] }); // Refresh to show updated hours
            queryClient.invalidateQueries({ queryKey: ['generators'] }); // Refresh to show updated hours
            toast.success('Registro de asistencia creado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al crear registro: ' + error.message);
        },
    });
}

export function useUpdateAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<OperationalAttendance> & { id: string }) => {
            // Remove joined data
            const { pilot, assistant, drone, generator, job, ...safeUpdates } = updates as any;

            // Check hectares validation before update
            if (safeUpdates.hectares_done && safeUpdates.job_id) {
                const { data: summary } = await supabase
                    .rpc('get_job_hectares_summary', { p_job_id: safeUpdates.job_id });

                if (summary && summary.length > 0) {
                    const hectaresSum = summary[0] as HectaresSummary;

                    if (hectaresSum.job_applied_hectares && hectaresSum.total_hectares_done > hectaresSum.job_applied_hectares) {
                        toast.warning(
                            `⚠️ Advertencia: Total de hectáreas (${hectaresSum.total_hectares_done.toFixed(2)}) excede las hectáreas aplicadas del trabajo (${hectaresSum.job_applied_hectares.toFixed(2)})`
                        );
                    } else if (hectaresSum.job_theoretical_hectares && hectaresSum.total_hectares_done > hectaresSum.job_theoretical_hectares) {
                        toast.warning(
                            `⚠️ Advertencia: Total de hectáreas (${hectaresSum.total_hectares_done.toFixed(2)}) excede las hectáreas teóricas del trabajo (${hectaresSum.job_theoretical_hectares.toFixed(2)})`
                        );
                    }
                }
            }

            const { data, error } = await supabase
                .from('operational_attendance')
                .update(safeUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['operationalAttendance'] });
            queryClient.invalidateQueries({ queryKey: ['operationalAttendance', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['hectaresSummary', data.job_id] });
            queryClient.invalidateQueries({ queryKey: ['drones'] });
            queryClient.invalidateQueries({ queryKey: ['generators'] });
            toast.success('Registro actualizado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al actualizar registro: ' + error.message);
        },
    });
}

export function useDeleteAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Get the record first to know which job to refresh
            const { data: record } = await supabase
                .from('operational_attendance')
                .select('job_id')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('operational_attendance')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return record;
        },
        onSuccess: (record) => {
            queryClient.invalidateQueries({ queryKey: ['operationalAttendance'] });
            if (record?.job_id) {
                queryClient.invalidateQueries({ queryKey: ['hectaresSummary', record.job_id] });
            }
            queryClient.invalidateQueries({ queryKey: ['drones'] });
            queryClient.invalidateQueries({ queryKey: ['generators'] });
            toast.success('Registro eliminado exitosamente');
        },
        onError: (error) => {
            toast.error('Error al eliminar registro: ' + error.message);
        },
    });
}
