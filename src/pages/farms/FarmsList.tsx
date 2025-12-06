import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarms, useDeleteFarm } from '@/hooks/useFarms';
import { useClients } from '@/hooks/useClients';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FarmsList() {
  const navigate = useNavigate();
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const deleteFarm = useDeleteFarm();
  
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredFarms = farms?.filter(farm => {
    const matchesSearch = farm.name.toLowerCase().includes(search.toLowerCase()) ||
      farm.location?.toLowerCase().includes(search.toLowerCase());
    const matchesClient = clientFilter === 'all' || farm.client_id === clientFilter;
    return matchesSearch && matchesClient;
  });

  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || 'Cliente desconocido';
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteFarm.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (farmsLoading || clientsLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campos"
        description="Todos los campos de tus clientes"
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar campos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Farms List */}
      {filteredFarms?.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title="No hay campos"
          description={search || clientFilter !== 'all' 
            ? 'No se encontraron campos con esos filtros' 
            : 'Los campos se crean desde la ficha de cada cliente'}
          action={{ label: 'Ir a Clientes', onClick: () => navigate('/clients') }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFarms?.map((farm) => (
            <Card key={farm.id} className="transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                      <MapPin className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      {farm.location && (
                        <CardDescription>{farm.location}</CardDescription>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(farm.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <Link 
                    to={`/clients/${farm.client_id}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Users className="h-4 w-4" />
                    {getClientName(farm.client_id)}
                  </Link>
                  {farm.area_hectares && (
                    <p>
                      <span className="text-muted-foreground">Área:</span>{' '}
                      <span className="font-medium">{farm.area_hectares} ha</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el campo y todos los trabajos asociados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}