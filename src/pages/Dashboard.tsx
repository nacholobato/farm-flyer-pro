import { useJobs } from '@/hooks/useJobs';
import { useClients } from '@/hooks/useClients';
import { useFarms } from '@/hooks/useFarms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle, AlertCircle, ArrowRight, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

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

  // Prepare data for line chart (last 30 days)
  const today = new Date();
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const jobsOnDate = jobs?.filter(job => {
      const createdAt = job.created_at ? startOfDay(parseISO(job.created_at)) : null;
      return createdAt && isSameDay(createdAt, date);
    }).length || 0;

    return {
      date: format(date, 'dd MMM', { locale: es }),
      fullDate: dateStr,
      trabajos: jobsOnDate,
    };
  });

  // Get dates with jobs for calendar highlighting
  const datesWithJobs = jobs?.reduce((acc, job) => {
    if (job.due_date) {
      const dueDate = parseISO(job.due_date);
      acc.push(dueDate);
    }
    if (job.start_date) {
      const startDate = parseISO(job.start_date);
      acc.push(startDate);
    }
    return acc;
  }, [] as Date[]) || [];

  const stats = [
    {
      label: 'Clientes',
      value: clients?.length || 0,
      icon: Users,
      href: '/clients',
      color: 'bg-info/10 text-info'
    },
    {
      label: 'Trabajos Completados',
      value: doneJobs.length,
      icon: CheckCircle,
      href: '/jobs?status=done',
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
      label: 'Trabajos en Progreso',
      value: inProgressJobs.length,
      icon: AlertCircle,
      href: '/jobs?status=in_progress',
      color: 'bg-info/10 text-info'
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen general de tu operación agrícola"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs Timeline Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Trabajos Creados</CardTitle>
            </div>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="trabajos"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Jobs Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle>Calendario de Trabajos</CardTitle>
            </div>
            <CardDescription>Fechas con trabajos programados</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DayPicker
              mode="multiple"
              selected={datesWithJobs}
              locale={es}
              className="border-0"
              modifiersStyles={{
                selected: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold',
                }
              }}
            />
          </CardContent>
        </Card>
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