import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient, useDeleteClient } from '@/hooks/useClients';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Users, Mail, Phone, MapPin, Trash2 } from 'lucide-react';

export default function ClientsList() {
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();
  
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    razon_social: '',
    cuit: '',
    contacto_principal: '',
    puesto: '',
    email: '',
    phone: '',
    otro_contacto_1: '',
    telefono_1: '',
    otro_contacto_2: '',
    telefono_2: '',
    address: '',
    notes: '',
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClient.mutateAsync({
      ...formData,
      razon_social: formData.razon_social || null,
      cuit: formData.cuit || null,
      contacto_principal: formData.contacto_principal || null,
      puesto: formData.puesto || null,
      email: formData.email || null,
      phone: formData.phone || null,
      otro_contacto_1: formData.otro_contacto_1 || null,
      telefono_1: formData.telefono_1 || null,
      otro_contacto_2: formData.otro_contacto_2 || null,
      telefono_2: formData.telefono_2 || null,
      address: formData.address || null,
      notes: formData.notes || null,
    });
    setDialogOpen(false);
    setFormData({ 
      name: '', razon_social: '', cuit: '', contacto_principal: '', puesto: '',
      email: '', phone: '', otro_contacto_1: '', telefono_1: '', otro_contacto_2: '', 
      telefono_2: '', address: '', notes: '' 
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteClient.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona tu cartera de clientes"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Nuevo Cliente</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo cliente a tu cartera
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Cliente *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nombre del cliente"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razon_social">Razón Social</Label>
                      <Input
                        id="razon_social"
                        value={formData.razon_social}
                        onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                        placeholder="Razón social"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cuit">CUIT</Label>
                      <Input
                        id="cuit"
                        value={formData.cuit}
                        onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                        placeholder="XX-XXXXXXXX-X"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contacto_principal">Contacto Principal</Label>
                      <Input
                        id="contacto_principal"
                        value={formData.contacto_principal}
                        onChange={(e) => setFormData({ ...formData, contacto_principal: e.target.value })}
                        placeholder="Nombre del contacto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="puesto">Puesto</Label>
                      <Input
                        id="puesto"
                        value={formData.puesto}
                        onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                        placeholder="Cargo o puesto"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="otro_contacto_1">Otro Contacto 1</Label>
                      <Input
                        id="otro_contacto_1"
                        value={formData.otro_contacto_1}
                        onChange={(e) => setFormData({ ...formData, otro_contacto_1: e.target.value })}
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono_1">Teléfono 1</Label>
                      <Input
                        id="telefono_1"
                        value={formData.telefono_1}
                        onChange={(e) => setFormData({ ...formData, telefono_1: e.target.value })}
                        placeholder="Teléfono"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="otro_contacto_2">Otro Contacto 2</Label>
                      <Input
                        id="otro_contacto_2"
                        value={formData.otro_contacto_2}
                        onChange={(e) => setFormData({ ...formData, otro_contacto_2: e.target.value })}
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono_2">Teléfono 2</Label>
                      <Input
                        id="telefono_2"
                        value={formData.telefono_2}
                        onChange={(e) => setFormData({ ...formData, telefono_2: e.target.value })}
                        placeholder="Teléfono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Dirección del cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notas adicionales..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createClient.isPending}>
                    Crear Cliente
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      {filteredClients?.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No hay clientes"
          description={search ? 'No se encontraron clientes con ese término' : 'Comienza agregando tu primer cliente'}
          action={!search ? { label: 'Agregar Cliente', onClick: () => setDialogOpen(true) } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients?.map((client) => (
            <Card 
              key={client.id} 
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{client.name}</h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(client.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{client.address}</span>
                    </div>
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
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el cliente y todos sus campos y trabajos asociados. Esta acción no se puede deshacer.
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