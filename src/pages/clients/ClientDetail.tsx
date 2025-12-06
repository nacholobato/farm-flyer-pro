import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useFarms, useCreateFarm, useDeleteFarm } from '@/hooks/useFarms';
import { useJobs } from '@/hooks/useJobs';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Mail, Phone, MapPin, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: client, isLoading: clientLoading } = useClient(id);
  const { data: farms, isLoading: farmsLoading } = useFarms(id);
  const { data: jobs, isLoading: jobsLoading } = useJobs({ clientId: id });
  
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const createFarm = useCreateFarm();
  const deleteFarm = useDeleteFarm();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFarmId, setDeleteFarmId] = useState<string | null>(null);
  
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  
  const [farmData, setFarmData] = useState({
    name: '',
    location: '',
    area_hectares: '',
    notes: '',
  });

  if (clientLoading || farmsLoading || jobsLoading) return <LoadingPage />;
  
  if (!client) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button variant="link" onClick={() => navigate('/clients')}>
          Volver a clientes
        </Button>
      </div>
    );
  }

  const openEditDialog = () => {
    setEditData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateClient.mutateAsync({ id: client.id, ...editData });
    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    await deleteClient.mutateAsync(client.id);
    navigate('/clients');
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFarm.mutateAsync({
      client_id: client.id,
      name: farmData.name,
      location: farmData.location || null,
      area_hectares: farmData.area_hectares ? parseFloat(farmData.area_hectares) : null,
      notes: farmData.notes || null,
    });
    setFarmDialogOpen(false);
    setFarmData({ name: '', location: '', area_hectares: '', notes: '' });
  };

  const handleDeleteFarm = async () => {
    if (deleteFarmId) {
      await deleteFarm.mutateAsync(deleteFarmId);
      setDeleteFarmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description="Información del cliente"
        backHref="/clients"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        }
      />

      {/* Client Info Card */}
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {client.email && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">{client.address}</p>
              </div>
            </div>
          )}
        </CardContent>
        {client.notes && (
          <CardContent className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Notas</p>
            <p className="mt-1">{client.notes}</p>
          </CardContent>
        )}
      </Card>

      {/* Tabs for Farms and Jobs */}
      <Tabs defaultValue="farms">
        <TabsList>
          <TabsTrigger value="farms">Campos ({farms?.length || 0})</TabsTrigger>
          <TabsTrigger value="jobs">Trabajos ({jobs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="farms" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Dialog open={farmDialogOpen} onOpenChange={setFarmDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Campo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateFarm}>
                  <DialogHeader>
                    <DialogTitle>Nuevo Campo</DialogTitle>
                    <DialogDescription>
                      Agrega un campo para este cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="farmName">Nombre *</Label>
                      <Input
                        id="farmName"
                        value={farmData.name}
                        onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                        placeholder="Nombre del campo"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <Input
                          id="location"
                          value={farmData.location}
                          onChange={(e) => setFarmData({ ...farmData, location: e.target.value })}
                          placeholder="Ubicación del campo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Área (hectáreas)</Label>
                        <Input
                          id="area"
                          type="number"
                          step="0.01"
                          value={farmData.area_hectares}
                          onChange={(e) => setFarmData({ ...farmData, area_hectares: e.target.value })}
                          placeholder="100.5"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farmNotes">Notas</Label>
                      <Textarea
                        id="farmNotes"
                        value={farmData.notes}
                        onChange={(e) => setFarmData({ ...farmData, notes: e.target.value })}
                        placeholder="Notas adicionales..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setFarmDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createFarm.isPending}>
                      Crear Campo
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {farms?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Este cliente no tiene campos aún</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {farms?.map((farm) => (
                <Card key={farm.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteFarmId(farm.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {farm.location && (
                      <CardDescription>{farm.location}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {farm.area_hectares && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Área:</span>{' '}
                        <span className="font-medium">{farm.area_hectares} ha</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          {jobs?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Este cliente no tiene trabajos aún</p>
                <Button variant="link" onClick={() => navigate('/jobs/new')}>
                  Crear trabajo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs?.map((job) => (
                <Link 
                  key={job.id} 
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.farm?.name}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nombre *</Label>
                <Input
                  id="editName"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Teléfono</Label>
                  <Input
                    id="editPhone"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAddress">Dirección</Label>
                <Input
                  id="editAddress"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNotes">Notas</Label>
                <Textarea
                  id="editNotes"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateClient.isPending}>
                {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Client Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el cliente, todos sus campos y trabajos asociados. No se puede deshacer.
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

      {/* Delete Farm Dialog */}
      <AlertDialog open={!!deleteFarmId} onOpenChange={() => setDeleteFarmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el campo y todos los trabajos asociados. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFarm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}