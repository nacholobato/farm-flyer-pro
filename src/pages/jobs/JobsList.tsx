import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useJobs, useDeleteJob } from '@/hooks/useJobs';
import { useClients } from '@/hooks/useClients';
import { useFarms } from '@/hooks/useFarms';
import { JobStatus } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Search, ClipboardList, Calendar, Trash2, MapPin, Users, LayoutList, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { KanbanBoard } from '@/components/jobs/KanbanBoard';

export default function JobsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialStatus = searchParams.get('status') as JobStatus | null;

  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const deleteJob = useDeleteJob();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const filteredJobs = useMemo(() => {
    return jobs?.filter(job => {
      const matchesSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.client?.name.toLowerCase().includes(search.toLowerCase()) ||
        job.farm?.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesClient = clientFilter === 'all' || job.client_id === clientFilter;
      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [jobs, search, statusFilter, clientFilter]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteJob.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (jobsLoading || clientsLoading || farmsLoading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trabajos"
        description="Gestiona tus trabajos agrícolas"
        actions={
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg border bg-background p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8"
              >
                <LayoutList className="mr-2 h-4 w-4" />
                Lista
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-8"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban
              </Button>
            </div>

            {/* New Job Button */}
            <Button onClick={() => navigate('/jobs/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Trabajo
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar trabajos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En Curso</SelectItem>
              <SelectItem value="done">Completado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Cliente" />
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
      </div>

      {/* Jobs List */}
      {filteredJobs?.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title="No hay trabajos"
          description={search || statusFilter !== 'all' || clientFilter !== 'all'
            ? 'No se encontraron trabajos con esos filtros'
            : 'Comienza creando tu primer trabajo'}
          action={{ label: 'Crear Trabajo', onClick: () => navigate('/jobs/new') }}
        />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          jobs={filteredJobs || []}
          onJobClick={(id) => navigate(`/jobs/${id}`)}
          onJobDelete={(id) => setDeleteId(id)}
        />
      ) : (
        <div className="space-y-3">
          {filteredJobs?.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => navigate(`/jobs/${job.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-primary/10 sm:flex">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {job.client?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.farm?.name}
                        </span>
                        {job.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(job.due_date), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(job.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
    </div>
  );
}