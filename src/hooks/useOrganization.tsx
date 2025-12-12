import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Organization {
  id: string;
  name: string;
  ruc: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrganization() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organization', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // First get the user's organization_id from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profile?.organization_id) return null;
      
      // Then fetch the organization
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Organization | null;
    },
    enabled: !!user,
  });
}

export function useUserOrganizationId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userOrganizationId', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return profile?.organization_id || null;
    },
    enabled: !!user,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (organization: { name: string; ruc?: string }) => {
      if (!user) throw new Error('No user logged in');
      
      // Create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organization.name,
          ruc: organization.ruc || null,
        })
        .select()
        .single();
      
      if (orgError) throw orgError;
      
      // Update the user's profile with the organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['userOrganizationId'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Organización creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear organización: ' + error.message);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; ruc?: string | null }) => {
      const { data: org, error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Organización actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}
