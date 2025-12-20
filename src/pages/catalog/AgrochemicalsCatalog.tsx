import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Plus, Search, ExternalLink, Edit, Trash2, FlaskConical } from 'lucide-react';
import { useAgrochemicalCatalog, useDeleteAgrochemicalProduct } from '@/hooks/useAgrochemicalCatalog';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Agrochemical } from '@/types/database';
import { AgrochemicalForm } from './AgrochemicalForm';

export default function AgrochemicalsCatalog() {
    const { data: agrochemicals, isLoading } = useAgrochemicalCatalog();
    const deleteProduct = useDeleteAgrochemicalProduct();

    const [searchQuery, setSearchQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Agrochemical | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleEdit = (product: Agrochemical) => {
        setEditingProduct(product);
        setFormOpen(true);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setFormOpen(true);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteProduct.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const handleViewLabel = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Filter agrochemicals based on search query
    const filteredAgrochemicals = agrochemicals?.filter(agro => {
        const query = searchQuery.toLowerCase();
        return (
            (agro.name || '').toLowerCase().includes(query) ||
            (agro.active_ingredient || '').toLowerCase().includes(query)
        );
    });

    if (isLoading) return <LoadingPage />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Catálogo de Agroquímicos"
                description="Gestiona el catálogo de productos agroquímicos con información técnica y de seguridad"
                actions={
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Producto
                    </Button>
                }
            />

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o principio activo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredAgrochemicals?.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <FlaskConical className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'No se encontraron productos' : 'No hay productos en el catálogo'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery
                                    ? 'Intenta con otros términos de búsqueda'
                                    : 'Comienza agregando tu primer producto agroquímico'
                                }
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Primer Producto
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre Comercial</TableHead>
                                        <TableHead>Principio Activo</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Fabricante</TableHead>
                                        <TableHead>Clase Toxicológica</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAgrochemicals?.map((agro) => (
                                        <TableRow key={agro.id}>
                                            <TableCell className="font-medium">{agro.name}</TableCell>
                                            <TableCell>{agro.active_ingredient || '-'}</TableCell>
                                            <TableCell>{agro.category || '-'}</TableCell>
                                            <TableCell>{agro.manufacturer || '-'}</TableCell>
                                            <TableCell>
                                                {agro.toxicological_class ? (
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${agro.toxicological_class === 'Ia' || agro.toxicological_class === 'Ib'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : agro.toxicological_class === 'II'
                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                            : agro.toxicological_class === 'III'
                                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        }`}>
                                                        Clase {agro.toxicological_class}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    {agro.label_url && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewLabel(agro.label_url!)}
                                                            title="Ver marbete"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(agro)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteId(agro.id)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <AgrochemicalForm
                open={formOpen}
                onOpenChange={handleFormClose}
                agrochemical={editingProduct}
                onSuccess={handleFormClose}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto del catálogo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El producto será eliminado permanentemente del catálogo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
