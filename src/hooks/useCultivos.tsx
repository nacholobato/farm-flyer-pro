import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from './use-toast';

export interface Cultivo {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const useCultivos = () => {
  const { organization } = useOrganization();
  const { toast } = useToast();

  const {
    data: cultivos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cultivos', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cultivos')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching cultivos:', error);
        toast({
          title: 'Error al cargar cultivos',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      return data as Cultivo[];
    },
    enabled: !!organization?.id,
  });

  return {
    data: cultivos,
    isLoading,
    error,
  };
};

export const useAddCultivo = () => {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!organization?.id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('cultivos')
        .insert([{ name, organization_id: organization.id }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
            throw new Error('El cultivo ya existe.');
        }
        throw error;
      }
      return data as Cultivo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cultivos', organization?.id] });
      toast({
        title: 'Éxito',
        description: 'Cultivo agregado correctamente',
      });
    },
    onError: (error) => {
      console.error('Error adding cultivo:', error);
      toast({
        title: 'Error al agregar cultivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
