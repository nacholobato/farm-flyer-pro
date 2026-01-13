import { useState } from 'react';
import { useGenerators, useCreateGenerator, useDeleteGenerator } from '@/hooks/useGenerators';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Zap, Clock, Trash2 } from 'lucide-react';

export default function GeneratorsList() {
    const { data: generators, isLoading } = useGenerators();
    const createGenerator = useCreateGenerator();
    const deleteGenerator = useDeleteGenerator();

    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ brand: '', internal_code: '' });

    const filteredGenerators = generators?.filter(gen =>
        gen.brand.toLowerCase().includes(search.toLowerCase()) ||
        gen.internal_code?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createGenerator.mutateAsync({
            brand: formData.brand,
            internal_code: formData.internal_code || null,
        });
        setDialogOpen(false);
        setFormData({ brand: '', internal_code: '' });
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteGenerator.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <LoadingPage />;

    const totalHours = generators?.reduce((sum, gen) => sum + gen.total_hours, 0) || 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Generadores"
                description="Gestiona tus generadores"
                actions={
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Agregar Generador</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Nuevo Generador</DialogTitle>
                                    <DialogDescription>Agrega un generador</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Marca *</Label>
                                        <Input
                                            id="brand"
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            placeholder="Honda"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="internal_code">Código Interno</Label>
                                        <Input
                                            id="internal_code"
                                            value={formData.internal_code}
                                            onChange={(e) => setFormData({ ...formData, internal_code: e.target.value })}
                                            placeholder="GEN-001"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={createGenerator.isPending}>Crear Generador</Button>
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
                                <p className="text-sm text-muted-foreground">Total Generadores</p>
                                <p className="text-3xl font-bold">{generators?.length || 0}</p>
                            </div>
                            <Zap className="h-8 w-8 text-muted-foreground" />
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
                <Input placeholder="Buscar generadores..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            {/* Generators List */}
            {filteredGenerators?.length === 0 ? (
                <EmptyState
                    icon={<Zap className="h-12 w-12" />}
                    title="No hay generadores"
                    description={search ? 'No se encontraron generadores' : 'Comienza agregando tu primer generador'}
                    action={!search ? { label: 'Agregar Generador', onClick: () => setDialogOpen(true) } : undefined}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredGenerators?.map((generator) => (
                        <Card key={generator.id} className="transition-all hover:shadow-md hover:border-primary/30">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <Zap className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{generator.brand}</h3>
                                            <p className="text-sm text-muted-foreground">{generator.internal_code || 'Sin código'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleteId(generator.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{generator.total_hours.toFixed(2)} horas</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar generador?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el generador. Los registros de asistencia previos se mantendrán.
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
