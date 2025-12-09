import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useFarms, useCreateFarm, useUpdateFarm, useDeleteFarm } from '@/hooks/useFarms';
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
import { LocationPicker } from '@/components/LocationPicker';
import { Farm } from '@/types/database';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: client, isLoading: clientLoading } = useClient(id);
  const { data: farms, isLoading: farmsLoading } = useFarms(id);
  const { data: jobs, isLoading: jobsLoading } = useJobs({ clientId: id });
  
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();
  const deleteFarm = useDeleteFarm();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [editFarmDialogOpen, setEditFarmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFarmId, setDeleteFarmId] = useState<string | null>(null);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  
  const [editData, setEditData] = useState({
    name: '',
    razon_social: '',
    cuit: '',
    contacto_principal: '',
    puesto: '',
    phone: '',
    otro_contacto_1: '',
    telefono_1: '',
    otro_contacto_2: '',
    telefono_2: '',
    notes: '',
  });
  
  const [farmData, setFarmData] = useState({
    name: '',
    cultivo: '',
    area_hectares: '',
    localidad: '',
    location: '',
  });

  const [editFarmData, setEditFarmData] = useState({
    name: '',
    cultivo: '',
    area_hectares: '',
    localidad: '',
    location: '',
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
      razon_social: client.razon_social || '',
      cuit: client.cuit || '',
      contacto_principal: client.contacto_principal || '',
      puesto: client.puesto || '',
      phone: client.phone || '',
      otro_contacto_1: client.otro_contacto_1 || '',
      telefono_1: client.telefono_1 || '',
      otro_contacto_2: client.otro_contacto_2 || '',
      telefono_2: client.telefono_2 || '',
      notes: client.notes || '',
    });
    setEditDialogOpen(true);
  };

  const openEditFarmDialog = (farm: Farm) => {
    setEditingFarm(farm);
    setEditFarmData({
      name: farm.name,
      cultivo: farm.cultivo || '',
      area_hectares: farm.area_hectares?.toString() || '',
      localidad: farm.localidad || '',
      location: farm.location || '',
    });
    setEditFarmDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateClient.mutateAsync({ 
      id: client.id, 
      ...editData,
      razon_social: editData.razon_social || null,
      cuit: editData.cuit || null,
      contacto_principal: editData.contacto_principal || null,
      puesto: editData.puesto || null,
      phone: editData.phone || null,
      otro_contacto_1: editData.otro_contacto_1 || null,
      telefono_1: editData.telefono_1 || null,
      otro_contacto_2: editData.otro_contacto_2 || null,
      telefono_2: editData.telefono_2 || null,
      notes: editData.notes || null,
    });
    setEditDialogOpen(false);
  };

  const handleUpdateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;
    await updateFarm.mutateAsync({
      id: editingFarm.id,
      name: editFarmData.name,
      cultivo: editFarmData.cultivo || null,
      area_hectares: editFarmData.area_hectares ? parseFloat(editFarmData.area_hectares) : null,
      localidad: editFarmData.localidad || null,
      location: editFarmData.location || null,
    });
    setEditFarmDialogOpen(false);
    setEditingFarm(null);
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
      cultivo: farmData.cultivo || null,
      area_hectares: farmData.area_hectares ? parseFloat(farmData.area_hectares) : null,
      localidad: farmData.localidad || null,
      location: farmData.location || null,
    });
    setFarmDialogOpen(false);
    setFarmData({ name: '', cultivo: '', area_hectares: '', localidad: '', location: '' });
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
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {client.razon_social && (
              <div>
                <p className="text-sm text-muted-foreground">Razón Social</p>
                <p className="font-medium">{client.razon_social}</p>
              </div>
            )}
            {client.cuit && (
              <div>
                <p className="text-sm text-muted-foreground">CUIT</p>
                <p className="font-medium">{client.cuit}</p>
              </div>
            )}
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {client.contacto_principal && (
              <div>
                <p className="text-sm text-muted-foreground">Contacto Principal</p>
                <p className="font-medium">{client.contacto_principal}</p>
                {client.puesto && <p className="text-sm text-muted-foreground">{client.puesto}</p>}
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
          </div>

          {(client.otro_contacto_1 || client.otro_contacto_2) && (
            <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
              {client.otro_contacto_1 && (
                <div>
                  <p className="text-sm text-muted-foreground">Otro Contacto 1</p>
                  <p className="font-medium">{client.otro_contacto_1}</p>
                  {client.telefono_1 && <p className="text-sm text-muted-foreground">{client.telefono_1}</p>}
                </div>
              )}
              {client.otro_contacto_2 && (
                <div>
                  <p className="text-sm text-muted-foreground">Otro Contacto 2</p>
                  <p className="font-medium">{client.otro_contacto_2}</p>
                  {client.telefono_2 && <p className="text-sm text-muted-foreground">{client.telefono_2}</p>}
                </div>
              )}
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
          <TabsTrigger value="farms">Fincas ({farms?.length || 0})</TabsTrigger>
          <TabsTrigger value="jobs">Trabajos ({jobs?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="farms" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Dialog open={farmDialogOpen} onOpenChange={setFarmDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Finca
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateFarm}>
                  <DialogHeader>
                    <DialogTitle>Nueva Finca</DialogTitle>
                    <DialogDescription>
                      Agrega una finca para este cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="farmName">Finca *</Label>
                        <Input
                          id="farmName"
                          value={farmData.name}
                          onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                          placeholder="Nombre de la finca"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cultivo">Cultivo</Label>
                        <Input
                          id="cultivo"
                          value={farmData.cultivo}
                          onChange={(e) => setFarmData({ ...farmData, cultivo: e.target.value })}
                          placeholder="Tipo de cultivo"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="area">Superficie (has)</Label>
                        <Input
                          id="area"
                          type="number"
                          step="0.01"
                          value={farmData.area_hectares}
                          onChange={(e) => setFarmData({ ...farmData, area_hectares: e.target.value })}
                          placeholder="100.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="localidad">Localidad</Label>
                        <Input
                          id="localidad"
                          value={farmData.localidad}
                          onChange={(e) => setFarmData({ ...farmData, localidad: e.target.value })}
                          placeholder="Localidad"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación GPS</Label>
                      <LocationPicker
                        value={farmData.location}
                        onChange={(value) => setFarmData({ ...farmData, location: value })}
                        placeholder="Coordenadas GPS"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setFarmDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createFarm.isPending}>
                      Crear Finca
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {farms?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Este cliente no tiene fincas aún</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {farms?.map((farm) => (
                <Card key={farm.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditFarmDialog(farm)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteFarmId(farm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {farm.localidad && (
                      <CardDescription>{farm.localidad}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {farm.cultivo && (
                      <p>
                        <span className="text-muted-foreground">Cultivo:</span>{' '}
                        <span className="font-medium">{farm.cultivo}</span>
                      </p>
                    )}
                    {farm.area_hectares && (
                      <p>
                        <span className="text-muted-foreground">Superficie:</span>{' '}
                        <span className="font-medium">{farm.area_hectares} ha</span>
                      </p>
                    )}
                    {farm.location && (
                      <p>
                        <span className="text-muted-foreground">Ubicación:</span>{' '}
                        <span className="font-medium">{farm.location}</span>
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
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editName">Cliente *</Label>
                  <Input
                    id="editName"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRazonSocial">Razón Social</Label>
                  <Input
                    id="editRazonSocial"
                    value={editData.razon_social}
                    onChange={(e) => setEditData({ ...editData, razon_social: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editCuit">CUIT</Label>
                  <Input
                    id="editCuit"
                    value={editData.cuit}
                    onChange={(e) => setEditData({ ...editData, cuit: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editContacto">Contacto Principal</Label>
                  <Input
                    id="editContacto"
                    value={editData.contacto_principal}
                    onChange={(e) => setEditData({ ...editData, contacto_principal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPuesto">Puesto</Label>
                  <Input
                    id="editPuesto"
                    value={editData.puesto}
                    onChange={(e) => setEditData({ ...editData, puesto: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Teléfono</Label>
                <Input
                  id="editPhone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editOtroContacto1">Otro Contacto 1</Label>
                  <Input
                    id="editOtroContacto1"
                    value={editData.otro_contacto_1}
                    onChange={(e) => setEditData({ ...editData, otro_contacto_1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTelefono1">Teléfono 1</Label>
                  <Input
                    id="editTelefono1"
                    value={editData.telefono_1}
                    onChange={(e) => setEditData({ ...editData, telefono_1: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editOtroContacto2">Otro Contacto 2</Label>
                  <Input
                    id="editOtroContacto2"
                    value={editData.otro_contacto_2}
                    onChange={(e) => setEditData({ ...editData, otro_contacto_2: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTelefono2">Teléfono 2</Label>
                  <Input
                    id="editTelefono2"
                    value={editData.telefono_2}
                    onChange={(e) => setEditData({ ...editData, telefono_2: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNotes">Notas</Label>
                <Textarea
                  id="editNotes"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={2}
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
            <AlertDialogTitle>¿Eliminar finca?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la finca y todos los trabajos asociados. No se puede deshacer.
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

      {/* Edit Farm Dialog */}
      <Dialog open={editFarmDialogOpen} onOpenChange={setEditFarmDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateFarm}>
            <DialogHeader>
              <DialogTitle>Editar Finca</DialogTitle>
              <DialogDescription>
                Modifica los datos de la finca
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editFarmName">Finca *</Label>
                  <Input
                    id="editFarmName"
                    value={editFarmData.name}
                    onChange={(e) => setEditFarmData({ ...editFarmData, name: e.target.value })}
                    placeholder="Nombre de la finca"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editFarmCultivo">Cultivo</Label>
                  <Input
                    id="editFarmCultivo"
                    value={editFarmData.cultivo}
                    onChange={(e) => setEditFarmData({ ...editFarmData, cultivo: e.target.value })}
                    placeholder="Tipo de cultivo"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editFarmArea">Superficie (has)</Label>
                  <Input
                    id="editFarmArea"
                    type="number"
                    step="0.01"
                    value={editFarmData.area_hectares}
                    onChange={(e) => setEditFarmData({ ...editFarmData, area_hectares: e.target.value })}
                    placeholder="100.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editFarmLocalidad">Localidad</Label>
                  <Input
                    id="editFarmLocalidad"
                    value={editFarmData.localidad}
                    onChange={(e) => setEditFarmData({ ...editFarmData, localidad: e.target.value })}
                    placeholder="Localidad"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editFarmLocation">Ubicación GPS</Label>
                <LocationPicker
                  value={editFarmData.location}
                  onChange={(value) => setEditFarmData({ ...editFarmData, location: value })}
                  placeholder="Coordenadas GPS"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditFarmDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateFarm.isPending}>
                {updateFarm.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}