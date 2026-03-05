import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { AgrochemicalUsed } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JobCalculatorProps {
    agrochemicals: AgrochemicalUsed[];
    hectares?: number | null;
    totalJobHectares?: number | null;
    onHectaresChange?: (hectares: number) => void;
    catalogProducts?: any[];
}

export function JobCalculator({
    agrochemicals,
    hectares: initialHectares,
    totalJobHectares,
    onHectaresChange,
    catalogProducts = []
}: JobCalculatorProps) {
    const [hectares, setHectares] = useState(initialHectares || 0);

    useEffect(() => {
        if (initialHectares !== null && initialHectares !== undefined) {
            setHectares(initialHectares);
        }
    }, [initialHectares]);

    const handleHectaresChange = (value: number) => {
        setHectares(value);
        onHectaresChange?.(value);
    };

    const productCalculations = useMemo(() => {
        return agrochemicals.map(agro => {
            let amount = 0;
            let displayUnit = agro.unit;
            const isPerHectare = agro.unit.includes('/ha');

            if (isPerHectare) {
                // Per-hectare: amount = dose × hectares
                displayUnit = agro.unit.replace('/ha', '');
                amount = agro.dose * hectares;
            } else {
                // Absolute: proportional based on total job hectares
                if (totalJobHectares && totalJobHectares > 0) {
                    amount = (agro.dose * hectares) / totalJobHectares;
                } else {
                    amount = agro.dose;
                }
            }

            return {
                ...agro,
                calculatedAmount: amount,
                displayUnit,
                isPerHectare,
            };
        });
    }, [agrochemicals, hectares, totalJobHectares]);

    if (agrochemicals.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                        <Calculator className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>Agrega agroquímicos para ver el cálculo</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Calculadora de Mezcla
                </CardTitle>
                <CardDescription>
                    Cantidades de cada producto para las hectáreas a aplicar
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Input: Hectáreas */}
                <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2 max-w-sm">
                        <Label htmlFor="calc-hectares">Hectáreas a Aplicar</Label>
                        <Input
                            id="calc-hectares"
                            type="number"
                            min="0"
                            step="0.1"
                            value={hectares}
                            onChange={(e) => handleHectaresChange(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Product Breakdown */}
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Productos necesarios</h4>
                    <div className="space-y-3">
                        {productCalculations.map((product, index) => {
                            const catalogInfo = catalogProducts.find(c => c.name === product.product_name);
                            return (
                                <div
                                    key={product.id}
                                    className="flex flex-col gap-3 rounded-lg border bg-card p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium">{product.product_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {product.dose} {product.unit}
                                                    {!product.isPerHectare && totalJobHectares
                                                        ? ` (total para ${totalJobHectares} ha)`
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-bold text-primary">
                                                {product.calculatedAmount.toFixed(3)} {product.displayUnit}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Row: Category & Safety */}
                                    {catalogInfo && (catalogInfo.category || catalogInfo.safety_precautions) && (
                                        <div className="rounded-md bg-muted/50 p-3 text-xs space-y-2 mt-1">
                                            {catalogInfo.category && (
                                                <p>
                                                    <span className="font-semibold">Categoría:</span> {catalogInfo.category}
                                                </p>
                                            )}
                                            {catalogInfo.safety_precautions && (
                                                <p>
                                                    <span className="font-semibold flex items-center gap-1">
                                                        Precauciones de Seguridad:
                                                    </span>
                                                    <span className="text-muted-foreground whitespace-pre-wrap block mt-1">
                                                        {catalogInfo.safety_precautions}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Formula Explanation */}
                <div className="rounded-lg bg-muted p-4 text-xs space-y-1">
                    <p className="font-medium">Fórmulas:</p>
                    <p><strong>Dosis por hectárea</strong> (L/ha, kg/ha, etc.) = Dosis × Hectáreas</p>
                    <p><strong>Dosis absoluta</strong> (L, kg, etc.) = (Dosis × Hectáreas) / Hectáreas Totales del Trabajo</p>
                </div>
            </CardContent>
        </Card>
    );
}
