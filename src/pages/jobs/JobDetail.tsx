import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob, useUpdateJob, useDeleteJob } from '@/hooks/useJobs';
import { useAgrochemicals, useCreateAgrochemical, useUpdateAgrochemical, useDeleteAgrochemical } from '@/hooks/useAgrochemicals';
import { useAgrochemicalCatalog } from '@/hooks/useAgrochemicalCatalog';
import { JobStatus } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { Edit, Trash2, Plus, Loader2, Calendar, MapPin, Users, Beaker } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading: jobLoading } = useJob(id);
  const { data: agrochemicals, isLoading: agroLoading } = useAgrochemicals(id);
  const { data: catalogProducts } = useAgrochemicalCatalog();

  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const createAgrochemical = useCreateAgrochemical();
  const updateAgrochemical = useUpdateAgrochemical();
  const deleteAgrochemical = useDeleteAgrochemical();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [agroDialogOpen, setAgroDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAgroId, setDeleteAgroId] = useState<string | null>(null);
  const [editAgroId, setEditAgroId] = useState<string | null>(null);

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    task: '',
    application_dose: '',
    start_date: '',
    due_date: '',
    status: 'pending' as JobStatus,
    notes: '',
  });

  const [agroData, setAgroData] = useState({
    catalog_id: '',
    product_name: '',
    dose: '',
    unit: 'L/ha',
    cost_per_unit: '',
    notes: '',
  });

  if (jobLoading || agroLoading) return <LoadingPage />;

  if (!job) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Trabajo no encontrado</p>
        <Button variant="link" onClick={() => navigate('/jobs')}>
          Volver a trabajos
        </Button>
      </div>
    );
  }

  const openEditDialog = () => {
    setEditData({
      title: job.title,
      description: job.description || '',
      task: job.task || '',
      application_dose: job.application_dose || '',
      start_date: job.start_date || '',
      due_date: job.due_date || '',
      status: job.status,
      notes: job.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateJob.mutateAsync({
      id: job.id,
      ...editData,
      description: editData.description || null,
      task: editData.task || null,
      application_dose: editData.application_dose || null,
      start_date: editData.start_date || null,
      due_date: editData.due_date || null,
      notes: editData.notes || null,
    });
    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    await deleteJob.mutateAsync(job.id);
    navigate('/jobs');
  };

  const handleStatusChange = async (status: JobStatus) => {
    await updateJob.mutateAsync({ id: job.id, status });
  };

  const openAgroDialog = (agroId?: string) => {
    if (agroId) {
      const agro = agrochemicals?.find(a => a.id === agroId);
      if (agro) {
        setAgroData({
          catalog_id: agro.agrochemical_id || '',
          product_name: agro.product_name,
          dose: agro.dose.toString(),
          unit: agro.unit,
          cost_per_unit: agro.cost_per_unit?.toString() || '',
          notes: agro.notes || '',
        });
        setEditAgroId(agroId);
      }
    } else {
      setAgroData({ catalog_id: '', product_name: '', dose: '', unit: 'L/ha', cost_per_unit: '', notes: '' });
      setEditAgroId(null);
    }
    setAgroDialogOpen(true);
  };

  const handleCatalogSelection = (catalogId: string) => {
    if (catalogId === 'manual') {
      setAgroData({
        catalog_id: '',
        product_name: '',
        dose: '',
        unit: 'L/ha',
        cost_per_unit: '',
        notes: ''
      });
    } else {
      const product = catalogProducts?.find(p => p.id === catalogId);
      if (product) {
        setAgroData({
          catalog_id: catalogId,
          product_name: product.name,
          dose: product.recommended_dose?.toString() || '',
          unit: product.unit || 'L/ha',
          cost_per_unit: product.cost_per_unit?.toString() || '',
          notes: '',
        });
      }
    }
  };

  const handleAgroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editAgroId) {
      await updateAgrochemical.mutateAsync({
        id: editAgroId,
        job_id: job.id,
        agrochemical_id: agroData.catalog_id || null,
        product_name: agroData.product_name,
        dose: parseFloat(agroData.dose),
        unit: agroData.unit,
        cost_per_unit: agroData.cost_per_unit ? parseFloat(agroData.cost_per_unit) : null,
        application_order: 1, // Will be preserved from existing record
        notes: agroData.notes || null,
      });
    } else {
      await createAgrochemical.mutateAsync({
        job_id: job.id,
        agrochemical_id: agroData.catalog_id || null,
        product_name: agroData.product_name,
        dose: parseFloat(agroData.dose),
        unit: agroData.unit,
        cost_per_unit: agroData.cost_per_unit ? parseFloat(agroData.cost_per_unit) : null,
        application_order: (agrochemicals?.length || 0) + 1,
        notes: agroData.notes || null,
      });
    }
    setAgroDialogOpen(false);
  };

  const handleDeleteAgro = async () => {
    if (deleteAgroId) {
      await deleteAgrochemical.mutateAsync({ id: deleteAgroId, jobId: job.id });
      setDeleteAgroId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        backHref="/jobs"
        actions={
          <div className="flex items-center gap-2">
            <Select value={job.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="done">Completado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Job Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalles del Trabajo</CardTitle>
              <StatusBadge status={job.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <Link to={`/clients/${job.client?.id}`} className="font-medium hover:text-primary">
                    {job.client?.name}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finca</p>
                  <p className="font-medium">{job.farm?.name}</p>
                </div>
              </div>
            </div>

            {(job.start_date || job.due_date) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {job.start_date && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                      <p className="font-medium">
                        {format(new Date(job.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {job.due_date && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de vencimiento</p>
                      <p className="font-medium">
                        {format(new Date(job.due_date), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(job.task || job.application_dose) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {job.task && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tarea</p>
                    <p className="font-medium">{job.task}</p>
                  </div>
                )}
                {job.application_dose && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dosis de aplicación</p>
                    <p className="font-medium">{job.application_dose}</p>
                  </div>
                )}
              </div>
            )}

            {job.description && (
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="mt-1">{job.description}</p>
              </div>
            )}

            {job.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="mt-1">{job.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agrochemicals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                Agroquímicos
              </CardTitle>
              <CardDescription>{agrochemicals?.length || 0} productos</CardDescription>
            </div>
            <Button size="sm" onClick={() => openAgroDialog()}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {agrochemicals?.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay agroquímicos registrados
              </p>
            ) : (
              <div className="space-y-3">
                {agrochemicals?.map((agro, index) => (
                  <div
                    key={agro.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{agro.product_name}</p>
                          {agro.agrochemical_id ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Catálogo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                              Manual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{agro.dose} {agro.unit}</span>
                          {agro.cost_per_unit && (
                            <>
                              <span>•</span>
                              <span>${agro.cost_per_unit.toFixed(2)}/{agro.unit}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openAgroDialog(agro.id)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteAgroId(agro.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Job Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Trabajo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTitle">Título *</Label>
                <Input
                  id="editTitle"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editTask">Tarea</Label>
                  <Input
                    id="editTask"
                    value={editData.task}
                    onChange={(e) => setEditData({ ...editData, task: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDose">Dosis de aplicación</Label>
                  <Input
                    id="editDose"
                    value={editData.application_dose}
                    onChange={(e) => setEditData({ ...editData, application_dose: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Fecha de inicio</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={editData.start_date}
                    onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDueDate">Fecha de vencimiento</Label>
                  <Input
                    id="editDueDate"
                    type="date"
                    value={editData.due_date}
                    onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStatus">Estado</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(v: JobStatus) => setEditData({ ...editData, status: v })}
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
              <div className="space-y-2">
                <Label htmlFor="editDescription">Descripción</Label>
                <Textarea
                  id="editDescription"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
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
              <Button type="submit" disabled={updateJob.isPending}>
                {updateJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Agrochemical Dialog */}
      <Dialog open={agroDialogOpen} onOpenChange={setAgroDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAgroSubmit}>
            <DialogHeader>
              <DialogTitle>{editAgroId ? 'Editar' : 'Agregar'} Agroquímico</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="catalogSelect">Seleccionar del Catálogo</Label>
                <Select
                  value={agroData.catalog_id || 'manual'}
                  onValueChange={handleCatalogSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">✏️ Entrada Manual</SelectItem>
                    {catalogProducts?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agroProduct">Producto *</Label>
                <Input
                  id="agroProduct"
                  value={agroData.product_name}
                  onChange={(e) => setAgroData({ ...agroData, product_name: e.target.value })}
                  placeholder="Nombre del producto"
                  required
                  disabled={!!agroData.catalog_id}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agroDose">Dosis *</Label>
                  <Input
                    id="agroDose"
                    type="number"
                    step="0.001"
                    value={agroData.dose}
                    onChange={(e) => setAgroData({ ...agroData, dose: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agroUnit">Unidad</Label>
                  <Select
                    value={agroData.unit}
                    onValueChange={(v) => setAgroData({ ...agroData, unit: v })}
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
              <div className="space-y-2">
                <Label htmlFor="agroCost">Costo por Unidad</Label>
                <Input
                  id="agroCost"
                  type="number"
                  step="0.01"
                  value={agroData.cost_per_unit}
                  onChange={(e) => setAgroData({ ...agroData, cost_per_unit: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agroNotes">Notas</Label>
                <Textarea
                  id="agroNotes"
                  value={agroData.notes}
                  onChange={(e) => setAgroData({ ...agroData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAgroDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAgrochemical.isPending || updateAgrochemical.isPending}>
                {(createAgrochemical.isPending || updateAgrochemical.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editAgroId ? 'Guardar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Job Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar trabajo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el trabajo y todos los agroquímicos asociados. No se puede deshacer.
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

      {/* Delete Agrochemical Dialog */}
      <AlertDialog open={!!deleteAgroId} onOpenChange={() => setDeleteAgroId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agroquímico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgro} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}