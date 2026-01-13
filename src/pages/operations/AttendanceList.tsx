import { useState } from 'react';
import { useOperationalAttendance } from '@/hooks/useOperationalAttendance';
import { AttendanceForm } from '@/components/operations/AttendanceForm';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ClipboardList, Calendar, Users, Plane, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AttendanceList() {
    const { data: attendanceRecords, isLoading } = useOperationalAttendance();
    const [dialogOpen, setDialogOpen] = useState(false);

    if (isLoading) return <LoadingPage />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Registros de Asistencia Operacional"
                description="Gestiona los registros diarios de operaciones"
                actions={
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Registro
                        </Button>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Nuevo Registro de Asistencia</DialogTitle>
                            </DialogHeader>
                            <AttendanceForm
                                onSuccess={() => setDialogOpen(false)}
                                onCancel={() => setDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Records List */}
            {attendanceRecords?.length === 0 ? (
                <EmptyState
                    icon={<ClipboardList className="h-12 w-12" />}
                    title="No hay registros"
                    description="Comienza agregando tu primer registro de asistencia operacional"
                    action={{ label: 'Agregar Registro', onClick: () => setDialogOpen(true) }}
                />
            ) : (
                <div className="space-y-4">
                    {attendanceRecords?.map((record) => (
                        <Card key={record.id} className="transition-all hover:shadow-md">
                            <CardContent className="p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold">{record.job?.title || 'Sin trabajo'}</h3>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(record.start_date), 'PPP', { locale: es })}
                                                    {record.check_in_time && ` • ${record.check_in_time}`}
                                                    {record.check_out_time && ` - ${record.check_out_time}`}
                                                </div>
                                            </div>
                                            {record.is_reviewed && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Revisado
                                                </span>
                                            )}
                                        </div>

                                        {/* Activity Type */}
                                        {record.activity_type && (
                                            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                                                {record.activity_type === 'spraying' ? 'Fumigación' :
                                                    record.activity_type === 'mapping' ? 'Mapeo' : 'Monitoreo'}
                                            </span>
                                        )}

                                        {/* Team and Equipment */}
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            {record.pilot && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>Piloto: {record.pilot.full_name}</span>
                                                </div>
                                            )}
                                            {record.assistant && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>Asistente: {record.assistant.full_name}</span>
                                                </div>
                                            )}
                                            {record.drone && (
                                                <div className="flex items-center gap-2">
                                                    <Plane className="h-4 w-4 text-muted-foreground" />
                                                    <span>{record.drone.model}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            {record.hectares_done && (
                                                <div>
                                                    <span className="font-medium">{record.hectares_done} ha</span>
                                                    <span className="text-muted-foreground"> realizadas</span>
                                                </div>
                                            )}
                                            {record.gen_usage_hours && (
                                                <div>
                                                    <span className="font-medium">{record.gen_usage_hours} h</span>
                                                    <span className="text-muted-foreground"> generador</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Observations */}
                                        {(record.agronomic_obs || record.technical_obs) && (
                                            <div className="space-y-1 text-sm">
                                                {record.agronomic_obs && (
                                                    <p className="text-muted-foreground">
                                                        <span className="font-medium">Agronómico:</span> {record.agronomic_obs}
                                                    </p>
                                                )}
                                                {record.technical_obs && (
                                                    <p className="text-muted-foreground">
                                                        <span className="font-medium">Técnico:</span> {record.technical_obs}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
