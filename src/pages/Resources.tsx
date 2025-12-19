import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    Download,
    Trash2,
    FileText,
    CloudRain,
    Sprout,
    TrendingUp,
    Bug,
    GraduationCap,
    Database,
    Wrench,
    Scale,
    FolderOpen
} from 'lucide-react';
import { useResources, useDeleteResource, useResourceDownloadUrl } from '@/hooks/useResources';
import { ResourceUploadDialog } from '@/components/ResourceUploadDialog';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Resource, ResourceCategory } from '@/types/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

const categoryConfig: Record<ResourceCategory, { label: string; icon: React.ElementType; color: string }> = {
    weather_climate: { label: 'Clima y Meteorología', icon: CloudRain, color: 'bg-blue-500/10 text-blue-600' },
    crop_information: { label: 'Información de Cultivos', icon: Sprout, color: 'bg-green-500/10 text-green-600' },
    market_prices: { label: 'Mercados y Precios', icon: TrendingUp, color: 'bg-amber-500/10 text-amber-600' },
    pest_management: { label: 'Manejo de Plagas', icon: Bug, color: 'bg-red-500/10 text-red-600' },
    education_research: { label: 'Educación e Investigación', icon: GraduationCap, color: 'bg-purple-500/10 text-purple-600' },
    data_statistics: { label: 'Datos y Estadísticas', icon: Database, color: 'bg-indigo-500/10 text-indigo-600' },
    equipment: { label: 'Equipamiento', icon: Wrench, color: 'bg-gray-500/10 text-gray-600' },
    regulations: { label: 'Regulaciones', icon: Scale, color: 'bg-slate-500/10 text-slate-600' },
    other: { label: 'Otros', icon: FolderOpen, color: 'bg-neutral-500/10 text-neutral-600' },
};

function ResourceCard({ resource }: { resource: Resource }) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const deleteResource = useDeleteResource();
    const { data: downloadUrl, isLoading: isLoadingUrl } = useResourceDownloadUrl(resource.file_path);

    const config = categoryConfig[resource.category];
    const Icon = config.icon;

    const handleDelete = async () => {
        await deleteResource.mutateAsync(resource);
        setDeleteDialogOpen(false);
    };

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <>
            <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color} flex-shrink-0`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg mb-1 truncate">{resource.title}</CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="secondary" className="text-xs">
                                        {config.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {formatFileSize(resource.file_size)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {resource.description && (
                        <CardDescription className="mb-4 line-clamp-2">
                            {resource.description}
                        </CardDescription>
                    )}

                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                            {format(new Date(resource.created_at), "dd MMM yyyy", { locale: es })}
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={isLoadingUrl || !downloadUrl}
                            >
                                <Download className="h-4 w-4 mr-1" />
                                {isLoadingUrl ? 'Cargando...' : 'Descargar'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={deleteResource.isPending}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El archivo "{resource.title}" será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function Resources() {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const { data: resources, isLoading } = useResources();

    if (isLoading) {
        return <LoadingPage />;
    }

    // Group resources by category
    const resourcesByCategory: Record<ResourceCategory, Resource[]> = {
        weather_climate: [],
        crop_information: [],
        market_prices: [],
        pest_management: [],
        education_research: [],
        data_statistics: [],
        equipment: [],
        regulations: [],
        other: [],
    };

    resources?.forEach(resource => {
        resourcesByCategory[resource.category].push(resource);
    });

    // Filter out empty categories
    const categoriesWithResources = Object.entries(resourcesByCategory)
        .filter(([_, resources]) => resources.length > 0) as [ResourceCategory, Resource[]][];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Recursos Agrícolas"
                description="Documentos y materiales de referencia para tu operación"
            >
                <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Recurso
                </Button>
            </PageHeader>

            {/* Overview Card */}
            <Card className="glass border-primary/20">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                                Biblioteca de Recursos ({resources?.length || 0})
                            </h3>
                            <p className="text-muted-foreground">
                                Organiza y accede a tus documentos técnicos, manuales, guías y otros materiales importantes
                                para tu operación agrícola. Los archivos se almacenan de forma segura y están disponibles
                                para todo tu equipo.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resources by Category */}
            {categoriesWithResources.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">No hay recursos aún</h3>
                                <p className="text-muted-foreground mb-4">
                                    Comienza subiendo tu primer documento compartido
                                </p>
                                <Button onClick={() => setUploadDialogOpen(true)}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Subir Primer Recurso
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                categoriesWithResources.map(([category, categoryResources]) => {
                    const config = categoryConfig[category];
                    const CategoryIcon = config.icon;

                    return (
                        <div key={category} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <CategoryIcon className="h-5 w-5 text-primary" />
                                <h2 className="text-2xl font-bold text-foreground">{config.label}</h2>
                                <Badge variant="secondary">{categoryResources.length}</Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                                {categoryResources.map((resource) => (
                                    <ResourceCard key={resource.id} resource={resource} />
                                ))}
                            </div>
                        </div>
                    );
                })
            )}

            <ResourceUploadDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
            />
        </div>
    );
}
