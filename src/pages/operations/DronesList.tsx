import { useState } from 'react';
import { useDrones, useCreateDrone, useDeleteDrone } from '@/hooks/useDrones';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Plane, Clock, Trash2 } from 'lucide-react';

export default function DronesList() {
    const { data: drones, isLoading } = useDrones();
    const createDrone = useCreateDrone();
    const deleteDrone = useDeleteDrone();

    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ model: '', serial_number: '' });

    const filteredDrones = drones?.filter(drone =>
        drone.model.toLowerCase().includes(search.toLowerCase()) ||
        drone.serial_number?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createDrone.mutateAsync({
            model: formData.model,
            serial_number: formData.serial_number || null,
        });
        setDialogOpen(false);
        setFormData({ model: '', serial_number: '' });
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteDrone.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <LoadingPage />;

    const totalHours = drones?.reduce((sum, drone) => sum + drone.total_hours, 0) || 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Drones"
                description="Gestiona tu flota de drones"
                actions={
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Agregar Dron</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Nuevo Dron</DialogTitle>
                                    <DialogDescription>Agrega un dron a la flota</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="model">Modelo *</Label>
                                        <Input
                                            id="model"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            placeholder="DJI Mavic 3"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="serial_number">Número de Serie</Label>
                                        <Input
                                            id="serial_number"
                                            value={formData.serial_number}
                                            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                            placeholder="SN-123456"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={createDrone.isPending}>Crear Dron</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Drones</p>
                                <p className="text-3xl font-bold">{drones?.length || 0}</p>
                            </div>
                            <Plane className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Horas Totales</p>
                                <p className="text-3xl font-bold">{totalHours.toFixed(2)}</p>
                            </div>
                            <Clock className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar drones..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            {/* Drones List */}
            {filteredDrones?.length === 0 ? (
                <EmptyState
                    icon={<Plane className="h-12 w-12" />}
                    title="No hay drones"
                    description={search ? 'No se encontraron drones' : 'Comienza agregando tu primer dron'}
                    action={!search ? { label: 'Agregar Dron', onClick: () => setDialogOpen(true) } : undefined}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDrones?.map((drone) => (
                        <Card key={drone.id} className="transition-all hover:shadow-md hover:border-primary/30">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <Plane className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{drone.model}</h3>
                                            <p className="text-sm text-muted-foreground">{drone.serial_number || 'Sin serie'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleteId(drone.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{drone.total_hours.toFixed(2)} horas</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar dron?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el dron. Los registros de asistencia previos se mantendrán.
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
