import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Agrochemical } from '@/types/database';
import {
    useCreateAgrochemicalProduct,
    useUpdateAgrochemicalProduct,
    useFormulationTypes,
} from '@/hooks/useAgrochemicalCatalog';

// Helper function to get toxicological class color
const getToxClassColor = (value: string): string => {
    switch (value) {
        case 'Ia':
        case 'Ib':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'II':
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'III':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'IV':
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'U':
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        default:
            return '';
    }
};

const formSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    active_ingredient: z.string().optional(),
    category: z.string().optional(),
    formulation_code: z.string().optional(),
    mode_of_action: z.string().optional(),
    toxicological_class: z.string().optional(),
    manufacturer: z.string().optional(),
    function: z.string().optional(),
    safety_precautions: z.string().optional(),
    label_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface AgrochemicalFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agrochemical: Agrochemical | null;
    onSuccess: () => void;
}

export function AgrochemicalForm({
    open,
    onOpenChange,
    agrochemical,
    onSuccess,
}: AgrochemicalFormProps) {
    const createProduct = useCreateAgrochemicalProduct();
    const updateProduct = useUpdateAgrochemicalProduct();
    const { data: formulationTypes, isLoading: isLoadingFormulations } = useFormulationTypes();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            active_ingredient: '',
            category: '',
            formulation_code: '',
            mode_of_action: '',
            toxicological_class: '',
            manufacturer: '',
            function: '',
            safety_precautions: '',
            label_url: '',
        },
    });

    const toxClass = watch('toxicological_class');
    const formulationCode = watch('formulation_code');

    useEffect(() => {
        if (agrochemical) {
            reset({
                name: agrochemical.name,
                active_ingredient: agrochemical.active_ingredient || '',
                category: agrochemical.category || '',
                formulation_code: agrochemical.formulation_code || '',
                mode_of_action: agrochemical.mode_of_action || '',
                toxicological_class: agrochemical.toxicological_class || '',
                manufacturer: agrochemical.manufacturer || '',
                function: agrochemical.function || '',
                safety_precautions: agrochemical.safety_precautions || '',
                label_url: agrochemical.label_url || '',
            });
        } else {
            reset({
                name: '',
                active_ingredient: '',
                category: '',
                formulation_code: '',
                mode_of_action: '',
                toxicological_class: '',
                manufacturer: '',
                function: '',
                safety_precautions: '',
                label_url: '',
            });
        }
    }, [agrochemical, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            // Build payload, conditionally including formulation_code
            const payload: any = {
                name: data.name,
                active_ingredient: data.active_ingredient || null,
                category: data.category || null,
                mode_of_action: data.mode_of_action || null,
                toxicological_class: data.toxicological_class || null,
                manufacturer: data.manufacturer || null,
                function: data.function || null,
                safety_precautions: data.safety_precautions || null,
                label_url: data.label_url || null,
            };

            // Only include formulation_code if it has a value
            // This prevents errors if the migration hasn't been run yet
            if (data.formulation_code) {
                payload.formulation_code = data.formulation_code;
            }

            if (agrochemical) {
                await updateProduct.mutateAsync({ id: agrochemical.id, ...payload });
            } else {
                await createProduct.mutateAsync(payload);
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving agrochemical:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>
                            {agrochemical ? 'Editar Producto' : 'Nuevo Producto'}
                        </DialogTitle>
                        <DialogDescription>
                            Completa la información del producto agroquímico
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Commercial Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">Información Comercial</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre Comercial *</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="Ej: Roundup Max"
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="manufacturer">Fabricante</Label>
                                    <Input
                                        id="manufacturer"
                                        {...register('manufacturer')}
                                        placeholder="Ej: Bayer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Technical Specifications */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">Especificaciones Técnicas</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="active_ingredient">Principio Activo</Label>
                                    <Input
                                        id="active_ingredient"
                                        {...register('active_ingredient')}
                                        placeholder="Ej: Glifosato"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoría</Label>
                                    <Input
                                        id="category"
                                        {...register('category')}
                                        placeholder="Ej: Herbicida"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="formulation_code">Formulación</Label>
                                    <Select
                                        value={formulationCode}
                                        onValueChange={(value) => setValue('formulation_code', value)}
                                        disabled={isLoadingFormulations}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar formulación" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formulationTypes?.map((formulation) => (
                                                <SelectItem key={formulation.code} value={formulation.code}>
                                                    {formulation.code} - {formulation.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="function">Función</Label>
                                    <Input
                                        id="function"
                                        {...register('function')}
                                        placeholder="Ej: Control de malezas"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mode_of_action">Modo de Acción</Label>
                                    <Input
                                        id="mode_of_action"
                                        {...register('mode_of_action')}
                                        placeholder="Ej: Sistémico"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Safety Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">Información de Seguridad</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="toxicological_class">Clase Toxicológica (OMS)</Label>
                                    <Select
                                        value={toxClass}
                                        onValueChange={(value) => setValue('toxicological_class', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar clase" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ia" className={getToxClassColor('Ia')}>
                                                Ia - Extremadamente peligroso
                                            </SelectItem>
                                            <SelectItem value="Ib" className={getToxClassColor('Ib')}>
                                                Ib - Altamente peligroso
                                            </SelectItem>
                                            <SelectItem value="II" className={getToxClassColor('II')}>
                                                II - Moderadamente peligroso
                                            </SelectItem>
                                            <SelectItem value="III" className={getToxClassColor('III')}>
                                                III - Ligeramente peligroso
                                            </SelectItem>
                                            <SelectItem value="IV" className={getToxClassColor('IV')}>
                                                IV - Improbable que presente riesgo
                                            </SelectItem>
                                            <SelectItem value="U" className={getToxClassColor('U')}>
                                                U - Improbable presentar riesgo agudo
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="label_url">URL del Marbete</Label>
                                    <Input
                                        id="label_url"
                                        {...register('label_url')}
                                        placeholder="https://ejemplo.com/marbete.pdf"
                                        type="url"
                                    />
                                    {errors.label_url && (
                                        <p className="text-sm text-destructive">{errors.label_url.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="safety_precautions">Cuidados y Precauciones</Label>
                                <Textarea
                                    id="safety_precautions"
                                    {...register('safety_precautions')}
                                    placeholder="Ej: Usar equipo de protección personal. No aplicar con viento fuerte..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {agrochemical ? 'Guardar Cambios' : 'Crear Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
