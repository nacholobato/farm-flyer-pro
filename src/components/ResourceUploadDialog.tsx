import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateResource } from '@/hooks/useResources';
import { ResourceCategory } from '@/types/database';
import { Upload, FileText } from 'lucide-react';

interface ResourceUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<ResourceCategory, string> = {
    weather_climate: 'Clima y Meteorología',
    crop_information: 'Información de Cultivos',
    market_prices: 'Mercados y Precios',
    pest_management: 'Manejo de Plagas',
    education_research: 'Educación e Investigación',
    data_statistics: 'Datos y Estadísticas',
    equipment: 'Equipamiento',
    regulations: 'Regulaciones',
    other: 'Otros',
};

export function ResourceUploadDialog({ open, onOpenChange }: ResourceUploadDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ResourceCategory>('other');
    const [file, setFile] = useState<File | null>(null);

    const createResource = useCreateResource();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            return;
        }

        try {
            await createResource.mutateAsync({
                title,
                description,
                category,
                file,
            });

            // Reset form
            setTitle('');
            setDescription('');
            setCategory('other');
            setFile(null);
            onOpenChange(false);
        } catch (error) {
            console.error('Error uploading resource:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Auto-fill title with filename if empty
            if (!title) {
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Subir Recurso</DialogTitle>
                    <DialogDescription>
                        Sube un PDF u otro documento para compartir con tu equipo
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file">Archivo *</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                                onChange={handleFileChange}
                                required
                                className="cursor-pointer"
                            />
                            {file && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Formatos aceptados: PDF, Word, Excel, TXT
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Manual de aplicación de herbicidas"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría *</Label>
                        <Select value={category} onValueChange={(value) => setCategory(value as ResourceCategory)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(categoryLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descripción del recurso..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createResource.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={createResource.isPending || !file}
                        >
                            {createResource.isPending ? (
                                <>Subiendo...</>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Subir Recurso
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
