import { useJobs } from '@/hooks/useJobs';
import { useClients } from '@/hooks/useClients';
import { useFarms } from '@/hooks/useFarms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import { Users, MapPin, ClipboardList, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: farms, isLoading: farmsLoading } = useFarms();

  if (jobsLoading || clientsLoading || farmsLoading) {
    return <LoadingPage />;
  }

  const pendingJobs = jobs?.filter(j => j.status === 'pending') || [];
  const inProgressJobs = jobs?.filter(j => j.status === 'in_progress') || [];
  const doneJobs = jobs?.filter(j => j.status === 'done') || [];
  const recentJobs = jobs?.slice(0, 5) || [];

  const stats = [
    { 
      label: 'Clientes', 
      value: clients?.length || 0, 
      icon: Users, 
      href: '/clients',
      color: 'bg-info/10 text-info'
    },
    { 
      label: 'Campos', 
      value: farms?.length || 0, 
      icon: MapPin, 
      href: '/farms',
      color: 'bg-success/10 text-success'
    },
    { 
      label: 'Trabajos Pendientes', 
      value: pendingJobs.length, 
      icon: Clock, 
      href: '/jobs?status=pending',
      color: 'bg-warning/10 text-warning'
    },
    { 
      label: 'En Progreso', 
      value: inProgressJobs.length, 
      icon: AlertCircle, 
      href: '/jobs?status=in_progress',
      color: 'bg-info/10 text-info'
    },
    { 
      label: 'Completados', 
      value: doneJobs.length, 
      icon: CheckCircle, 
      href: '/jobs?status=done',
      color: 'bg-success/10 text-success'
    },
    { 
      label: 'Total Trabajos', 
      value: jobs?.length || 0, 
      icon: ClipboardList, 
      href: '/jobs',
      color: 'bg-primary/10 text-primary'
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Resumen general de tu operación agrícola"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="transition-all hover:shadow-md hover:border-primary/30">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Trabajos Recientes</CardTitle>
            <CardDescription>Últimos trabajos registrados</CardDescription>
          </div>
          <Link 
            to="/jobs" 
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay trabajos registrados aún
            </p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link 
                  key={job.id} 
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {job.client?.name} • {job.farm?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.due_date && (
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        {format(new Date(job.due_date), 'dd MMM', { locale: es })}
                      </span>
                    )}
                    <StatusBadge status={job.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}