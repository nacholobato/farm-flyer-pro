import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { useFarms } from '@/hooks/useFarms';
import { useCreateJob } from '@/hooks/useJobs';
import { useCreateAgrochemical } from '@/hooks/useAgrochemicals';
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
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';

interface AgrochemicalEntry {
  id: string;
  product_name: string;
  dose: string;
  unit: string;
  notes: string;
}

export default function JobCreate() {
  const navigate = useNavigate();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const createJob = useCreateJob();
  const createAgrochemical = useCreateAgrochemical();
  
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

  useEffect(() => {
    if (selectedClientId) {
      setFormData(prev => ({ ...prev, client_id: selectedClientId, farm_id: '' }));
    }
  }, [selectedClientId]);

  const addAgrochemical = () => {
    setAgrochemicals([
      ...agrochemicals,
      { id: crypto.randomUUID(), product_name: '', dose: '', unit: 'L/ha', notes: '' }
    ]);
  };

  const updateAgrochemical = (id: string, field: keyof AgrochemicalEntry, value: string) => {
    setAgrochemicals(agrochemicals.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const removeAgrochemical = (id: string) => {
    setAgrochemicals(agrochemicals.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

      // Create agrochemicals
      for (let i = 0; i < agrochemicals.length; i++) {
        const agro = agrochemicals[i];
        if (agro.product_name && agro.dose) {
          await createAgrochemical.mutateAsync({
            job_id: job.id,
            product_name: agro.product_name,
            dose: parseFloat(agro.dose),
            unit: agro.unit,
            application_order: i + 1,
            notes: agro.notes || null,
          });
        }
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
                <Label htmlFor="client">Cliente *</Label>
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
                <Label htmlFor="farm">Campo *</Label>
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
                      farms?.length === 0 ? 'No hay campos' :
                      'Seleccionar campo'
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
                <Label htmlFor="task">Tarea</Label>
                <Input
                  id="task"
                  value={formData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  placeholder="Ej: Aplicación de herbicida"
                />
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
                    <div className="flex-1 grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Producto *</Label>
                        <Input
                          value={agro.product_name}
                          onChange={(e) => updateAgrochemical(agro.id, 'product_name', e.target.value)}
                          placeholder="Nombre del producto"
                        />
                      </div>
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
    </div>
  );
}