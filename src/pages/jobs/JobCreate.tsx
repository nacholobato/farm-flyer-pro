import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useFarms, useCreateFarm } from '@/hooks/useFarms';
import { useCreateJob } from '@/hooks/useJobs';
import { useCreateAgrochemicalsBulk } from '@/hooks/useAgrochemicals';
import { useAgrochemicalCatalog } from '@/hooks/useAgrochemicalCatalog';
import { JobStatus } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

interface AgrochemicalEntry {
  id: string;
  agrochemical_id: string | null;
  product_name: string;
  dose: string;
  unit: string;
  cost_per_unit: string;
  notes: string;
  manualEntry: boolean;
}

export default function JobCreate() {
  const navigate = useNavigate();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: agrochemicalsCatalog, isLoading: agrochemicalsLoading } = useAgrochemicalCatalog();
  const createJob = useCreateJob();
  const createAgrochemicalsBulk = useCreateAgrochemicalsBulk();
  const createClient = useCreateClient();
  const createFarm = useCreateFarm();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const { data: farms, isLoading: farmsLoading } = useFarms(selectedClientId || undefined);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task: '',
    application_dose: '',
    cuadro: '',
    cultivo: '',
    superficie_teorica_has: '',
    superficie_aplicada_has: '',
    start_date: '',
    due_date: '',
    status: 'pending' as JobStatus,
    notes: '',
    client_id: '',
    farm_id: '',
  });

  const [agrochemicals, setAgrochemicals] = useState<AgrochemicalEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showFarmDialog, setShowFarmDialog] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', phone: '', cuit: '' });
  const [newFarmData, setNewFarmData] = useState({ name: '', area_hectares: '', localidad: '', location: '' });

  useEffect(() => {
    if (selectedClientId) {
      setFormData(prev => ({ ...prev, client_id: selectedClientId, farm_id: '' }));
    }
  }, [selectedClientId]);

  // Auto-populate title based on Client, Farm, and Date
  useEffect(() => {
    const client = clients?.find(c => c.id === formData.client_id);
    const farm = farms?.find(f => f.id === formData.farm_id);

    if (client && farm) {
      const clientName = client.name;
      const farmName = farm.name;
      const date = formData.start_date
        ? new Date(formData.start_date).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        : '';

      const autoTitle = date
        ? `${clientName} - ${farmName} - ${date}`
        : `${clientName} - ${farmName}`;

      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }, [formData.client_id, formData.farm_id, formData.start_date, clients, farms]);

  const addAgrochemical = () => {
    setAgrochemicals([
      ...agrochemicals,
      {
        id: crypto.randomUUID(),
        agrochemical_id: null,
        product_name: '',
        dose: '',
        unit: 'L/ha',
        cost_per_unit: '',
        notes: '',
        manualEntry: false
      }
    ]);
  };

  const updateAgrochemical = (id: string, field: keyof AgrochemicalEntry, value: string | boolean) => {
    setAgrochemicals(agrochemicals.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const toggleManualEntry = (id: string) => {
    setAgrochemicals(agrochemicals.map(a =>
      a.id === id ? {
        ...a,
        manualEntry: !a.manualEntry,
        agrochemical_id: null,
        product_name: '',
        dose: '',
        unit: 'L/ha'
      } : a
    ));
  };

  const handleProductSelect = (agroId: string, agrochemicalId: string) => {
    const agrochemical = agrochemicalsCatalog?.find(p => p.id === agrochemicalId);
    if (agrochemical) {
      setAgrochemicals(agrochemicals.map(a =>
        a.id === agroId ? {
          ...a,
          agrochemical_id: agrochemicalId,
          product_name: agrochemical.name,
          unit: agrochemical.unit,
          dose: agrochemical.standard_dose ? agrochemical.standard_dose.toString() : ''
        } : a
      ));
    }
  };

  const removeAgrochemical = (id: string) => {
    setAgrochemicals(agrochemicals.filter(a => a.id !== id));
  };

  const handleCreateClient = async () => {
    try {
      const newClient = await createClient.mutateAsync({
        name: newClientData.name,
        phone: newClientData.phone || null,
        cuit: newClientData.cuit || null,
        razon_social: null,
        contacto_principal: null,
        puesto: null,
        otro_contacto_1: null,
        telefono_1: null,
        otro_contacto_2: null,
        telefono_2: null,
        notes: null,
      });

      // Auto-select the newly created client
      setSelectedClientId(newClient.id);
      setFormData(prev => ({ ...prev, client_id: newClient.id }));

      // Reset and close dialog
      setNewClientData({ name: '', phone: '', cuit: '' });
      setShowClientDialog(false);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleCreateFarm = async () => {
    if (!selectedClientId) return;

    try {
      const newFarm = await createFarm.mutateAsync({
        client_id: selectedClientId,
        name: newFarmData.name,
        area_hectares: newFarmData.area_hectares ? parseFloat(newFarmData.area_hectares) : null,
        localidad: newFarmData.localidad || null,
        location: newFarmData.location || null,
        cultivo: null,
      });

      // Auto-select the newly created farm
      setFormData(prev => ({ ...prev, farm_id: newFarm.id }));

      // Reset and close dialog
      setNewFarmData({ name: '', area_hectares: '', localidad: '', location: '' });
      setShowFarmDialog(false);
    } catch (error) {
      console.error('Error creating farm:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Step 1: Create the job
      const job = await createJob.mutateAsync({
        ...formData,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        description: formData.description || null,
        task: formData.task || null,
        application_dose: formData.application_dose || null,
        cuadro: formData.cuadro || null,
        cultivo: formData.cultivo || null,
        superficie_teorica_has: formData.superficie_teorica_has ? parseFloat(formData.superficie_teorica_has) : null,
        superficie_aplicada_has: formData.superficie_aplicada_has ? parseFloat(formData.superficie_aplicada_has) : null,
        notes: formData.notes || null,
      });

      // Step 2: Prepare agrochemicals for bulk insert
      const agrochemicalsToInsert = agrochemicals
        .filter(agro => agro.product_name && agro.dose)
        .map((agro, index) => ({
          job_id: job.id,
          agrochemical_id: agro.agrochemical_id || null,
          product_name: agro.product_name,
          dose: parseFloat(agro.dose),
          unit: agro.unit,
          cost_per_unit: agro.cost_per_unit ? parseFloat(agro.cost_per_unit) : null,
          application_order: index + 1,
          notes: agro.notes || null,
        }));

      // Step 3: Bulk insert all agrochemicals
      if (agrochemicalsToInsert.length > 0) {
        await createAgrochemicalsBulk.mutateAsync(agrochemicalsToInsert);
      }

      navigate(`/jobs/${job.id}`);
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (clientsLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Trabajo"
        description="Crea un nuevo trabajo agrícola"
        backHref="/jobs"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos generales del trabajo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Fumigación de soja - Lote 5"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="client">Cliente *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClientDialog(true)}
                    className="h-auto py-1 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Crear Cliente
                  </Button>
                </div>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="farm">Fincas *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFarmDialog(true)}
                    disabled={!selectedClientId}
                    className="h-auto py-1 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Crear Finca
                  </Button>
                </div>
                <Select
                  value={formData.farm_id}
                  onValueChange={(v) => setFormData({ ...formData, farm_id: v })}
                  disabled={!selectedClientId || farmsLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedClientId ? 'Selecciona un cliente primero' :
                        farmsLoading ? 'Cargando...' :
                          farms?.length === 0 ? 'No hay Fincas' :
                            'Seleccionar finca'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {farms?.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.name} {farm.area_hectares && `(${farm.area_hectares} ha)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Aplicación</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, task: 'Líquido' })}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${formData.task === 'Líquido'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted-foreground/20 hover:bg-accent'
                      }`}
                  >
                    <svg
                      className="mb-2 h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L7 4z"
                      />
                    </svg>
                    <span className="font-medium">Líquido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, task: 'Sólido' })}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${formData.task === 'Sólido'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted-foreground/20 hover:bg-accent'
                      }`}
                  >
                    <svg
                      className="mb-2 h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <span className="font-medium">Sólido</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="application_dose">Dosis de Caldo</Label>
                <Input
                  id="application_dose"
                  value={formData.application_dose}
                  onChange={(e) => setFormData({ ...formData, application_dose: e.target.value })}
                  placeholder="Ej: 80 L/ha"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cuadro">Cuadro</Label>
                <Input
                  id="cuadro"
                  value={formData.cuadro}
                  onChange={(e) => setFormData({ ...formData, cuadro: e.target.value })}
                  placeholder="Identificación del cuadro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cultivo">Cultivo</Label>
                <Input
                  id="cultivo"
                  value={formData.cultivo}
                  onChange={(e) => setFormData({ ...formData, cultivo: e.target.value })}
                  placeholder="Tipo de cultivo"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="superficie_teorica">Superficie Teórica (has)</Label>
                <Input
                  id="superficie_teorica"
                  type="number"
                  step="0.01"
                  value={formData.superficie_teorica_has}
                  onChange={(e) => setFormData({ ...formData, superficie_teorica_has: e.target.value })}
                  placeholder="100.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="superficie_aplicada">Superficie Aplicada (has)</Label>
                <Input
                  id="superficie_aplicada"
                  type="number"
                  step="0.01"
                  value={formData.superficie_aplicada_has}
                  onChange={(e) => setFormData({ ...formData, superficie_aplicada_has: e.target.value })}
                  placeholder="98.2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles del trabajo..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Programación</CardTitle>
            <CardDescription>Fechas y estado del trabajo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha de vencimiento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: JobStatus) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="done">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agrochemicals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agroquímicos</CardTitle>
              <CardDescription>Productos a utilizar en este trabajo</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addAgrochemical}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </CardHeader>
          <CardContent>
            {agrochemicals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay agroquímicos agregados. Haz clic en "Agregar" para añadir productos.
              </p>
            ) : (
              <div className="space-y-4">
                {agrochemicals.map((agro, index) => (
                  <div key={agro.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* Product Selection Row */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Producto *</Label>
                          {agro.manualEntry ? (
                            <Input
                              value={agro.product_name}
                              onChange={(e) => updateAgrochemical(agro.id, 'product_name', e.target.value)}
                              placeholder="Nombre del producto"
                            />
                          ) : (
                            <Select
                              value={agro.agrochemical_id || ''}
                              onValueChange={(agrochemicalId) => handleProductSelect(agro.id, agrochemicalId)}
                              disabled={agrochemicalsLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={agrochemicalsLoading ? "Cargando..." : "Seleccionar de catálogo"} />
                              </SelectTrigger>
                              <SelectContent>
                                {agrochemicalsCatalog?.map((agrochemical) => (
                                  <SelectItem key={agrochemical.id} value={agrochemical.id}>
                                    {agrochemical.name} ({agrochemical.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => toggleManualEntry(agro.id)}
                          >
                            {agro.manualEntry ? "← Seleccionar de catálogo" : "O ingresar manualmente →"}
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Costo por Unidad (opcional)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={agro.cost_per_unit}
                            onChange={(e) => updateAgrochemical(agro.id, 'cost_per_unit', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Dose and Unit Row */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Dosis *</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={agro.dose}
                            onChange={(e) => updateAgrochemical(agro.id, 'dose', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unidad</Label>
                          <Select
                            value={agro.unit}
                            onValueChange={(v) => updateAgrochemical(agro.id, 'unit', v)}
                            disabled={!agro.manualEntry && !!agro.product_id}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="L/ha">L/ha</SelectItem>
                              <SelectItem value="kg/ha">kg/ha</SelectItem>
                              <SelectItem value="mL/ha">mL/ha</SelectItem>
                              <SelectItem value="g/ha">g/ha</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeAgrochemical(agro.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales sobre el trabajo..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.title || !formData.client_id || !formData.farm_id}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Trabajo
          </Button>
        </div>
      </form>

      {/* Create Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Agrega un nuevo cliente rápidamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-client-name">Nombre *</Label>
              <Input
                id="new-client-name"
                value={newClientData.name}
                onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-client-phone">Teléfono</Label>
              <Input
                id="new-client-phone"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-client-cuit">CUIT</Label>
              <Input
                id="new-client-cuit"
                value={newClientData.cuit}
                onChange={(e) => setNewClientData({ ...newClientData, cuit: e.target.value })}
                placeholder="20-12345678-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowClientDialog(false);
                setNewClientData({ name: '', phone: '', cuit: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateClient}
              disabled={!newClientData.name || createClient.isPending}
            >
              {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Farm Dialog */}
      <Dialog open={showFarmDialog} onOpenChange={setShowFarmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Finca</DialogTitle>
            <DialogDescription>
              Agrega una nueva finca para {clients?.find(c => c.id === selectedClientId)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-farm-name">Nombre *</Label>
              <Input
                id="new-farm-name"
                value={newFarmData.name}
                onChange={(e) => setNewFarmData({ ...newFarmData, name: e.target.value })}
                placeholder="Nombre de la finca"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-farm-area">Superficie (hectáreas)</Label>
              <Input
                id="new-farm-area"
                type="number"
                step="0.01"
                value={newFarmData.area_hectares}
                onChange={(e) => setNewFarmData({ ...newFarmData, area_hectares: e.target.value })}
                placeholder="100.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-farm-location">Localidad</Label>
              <Input
                id="new-farm-location"
                value={newFarmData.localidad}
                onChange={(e) => setNewFarmData({ ...newFarmData, localidad: e.target.value })}
                placeholder="Ciudad o localidad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-farm-gps">Coordenadas GPS</Label>
              <Input
                id="new-farm-gps"
                value={newFarmData.location}
                onChange={(e) => setNewFarmData({ ...newFarmData, location: e.target.value })}
                placeholder="-34.123, -58.456"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFarmDialog(false);
                setNewFarmData({ name: '', area_hectares: '', localidad: '', location: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateFarm}
              disabled={!newFarmData.name || createFarm.isPending}
            >
              {createFarm.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}