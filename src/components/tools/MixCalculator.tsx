import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';
import { useAgrochemicalCatalog } from '@/hooks/useAgrochemicalCatalog';

interface Ingredient {
    id: string;
    productId: string | null;
    productName: string;
    standardDose: number;
    unit: string;
}

const AVAILABLE_UNITS = ['L', 'kg', 'mL', 'g'] as const;

export function MixCalculator() {
    const [referenceHectares, setReferenceHectares] = useState<number>(120);
    const [targetHectares, setTargetHectares] = useState<number>(100);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    // Form state for new ingredient
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [customProductName, setCustomProductName] = useState<string>('');
    const [standardDose, setStandardDose] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<string>('L');

    const { data: agrochemicals, isLoading: loadingAgrochemicals } = useAgrochemicalCatalog();

    const calculateRequiredAmount = (dose: number): number => {
        if (referenceHectares === 0) return 0;
        return (dose / referenceHectares) * targetHectares;
    };

    const handleAddIngredient = () => {
        const dose = parseFloat(standardDose);

        if (isNaN(dose) || dose <= 0) {
            return;
        }

        const productName = selectedProductId
            ? agrochemicals?.find(p => p.id === selectedProductId)?.name || ''
            : customProductName;

        if (!productName.trim()) {
            return;
        }

        const newIngredient: Ingredient = {
            id: crypto.randomUUID(),
            productId: selectedProductId || null,
            productName,
            standardDose: dose,
            unit: selectedUnit,
        };

        setIngredients([...ingredients, newIngredient]);

        // Reset form
        setSelectedProductId('');
        setCustomProductName('');
        setStandardDose('');
        setSelectedUnit('L');
    };

    const handleDeleteIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const handleClearAll = () => {
        setIngredients([]);
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="glass border-primary/20">
                <CardHeader>
                    <CardTitle className="text-2xl">Calculadora de Mezcla</CardTitle>
                    <CardDescription>
                        Calcula las cantidades de productos necesarias para tu área objetivo basándote en una receta de referencia
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Configuration Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Áreas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="reference-ha">Hectáreas de Referencia</Label>
                        <Input
                            id="reference-ha"
                            type="number"
                            min="0"
                            step="0.1"
                            value={referenceHectares}
                            onChange={(e) => setReferenceHectares(parseFloat(e.target.value) || 0)}
                            placeholder="120"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="target-ha">Hectáreas a Aplicar</Label>
                        <Input
                            id="target-ha"
                            type="number"
                            min="0"
                            step="0.1"
                            value={targetHectares}
                            onChange={(e) => setTargetHectares(parseFloat(e.target.value) || 0)}
                            placeholder="100"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Agregar Ingrediente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="product-select">Producto de la Base de Datos</Label>
                                <Select
                                    value={selectedProductId}
                                    onValueChange={(value) => {
                                        setSelectedProductId(value);
                                        setCustomProductName('');
                                        // Auto-fill unit if product exists
                                        const product = products?.find(p => p.id === value);
                                        if (product) {
                                            setSelectedUnit(product.unit);
                                            if (product.standard_dose) {
                                                setStandardDose(product.standard_dose.toString());
                                            }
                                        }
                                    }}
                                    disabled={loadingAgrochemicals || !!customProductName}
                                >
                                    <SelectTrigger id="product-select">
                                        <SelectValue placeholder={loadingAgrochemicals ? "Cargando..." : "Seleccionar producto"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agrochemicals?.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name} ({product.unit})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-product">O Nombre Manual</Label>
                                <Input
                                    id="custom-product"
                                    type="text"
                                    value={customProductName}
                                    onChange={(e) => {
                                        setCustomProductName(e.target.value);
                                        setSelectedProductId('');
                                    }}
                                    placeholder="Ej: Glifosato 48%"
                                    disabled={!!selectedProductId}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="dose">Dosis Estándar</Label>
                                <Input
                                    id="dose"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={standardDose}
                                    onChange={(e) => setStandardDose(e.target.value)}
                                    placeholder="Ej: 3.5"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit">Unidad</Label>
                                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                    <SelectTrigger id="unit">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVAILABLE_UNITS.map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                                {unit}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button className="w-full" onClick={handleAddIngredient}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Ingrediente
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            {ingredients.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Receta Calculada</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleClearAll}>
                                Limpiar Todo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Dosis Estándar</TableHead>
                                        <TableHead className="font-bold text-primary">Cantidad Requerida</TableHead>
                                        <TableHead className="w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ingredients.map((ingredient) => (
                                        <TableRow key={ingredient.id}>
                                            <TableCell className="font-medium">{ingredient.productName}</TableCell>
                                            <TableCell>
                                                {ingredient.standardDose.toFixed(2)} {ingredient.unit}
                                            </TableCell>
                                            <TableCell className="font-bold text-primary text-lg">
                                                {calculateRequiredAmount(ingredient.standardDose).toFixed(2)} {ingredient.unit}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteIngredient(ingredient.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Fórmula:</strong> Cantidad Requerida = (Dosis Estándar ÷ {referenceHectares} ha) × {targetHectares} ha
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {ingredients.length === 0 && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <p>Agrega ingredientes para ver la receta calculada</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
