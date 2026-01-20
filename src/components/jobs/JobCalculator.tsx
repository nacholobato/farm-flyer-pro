import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Droplet, Beaker } from 'lucide-react';
import { AgrochemicalUsed } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JobCalculatorProps {
    agrochemicals: AgrochemicalUsed[];
    hectares?: number | null;
    doseCaldo?: number | null;
    totalJobHectares?: number | null;
    onHectaresChange?: (hectares: number) => void;
    onDoseCaldoChange?: (dose: number) => void;
}

export function JobCalculator({
    agrochemicals,
    hectares: initialHectares,
    doseCaldo: initialDoseCaldo,
    totalJobHectares,
    onHectaresChange,
    onDoseCaldoChange
}: JobCalculatorProps) {
    // Manage state internally for the calculator
    const [hectares, setHectares] = useState(initialHectares || 0);
    const [doseCaldo, setDoseCaldo] = useState(initialDoseCaldo || 10); // Default 10 L/ha

    // Update internal state when props change
    useEffect(() => {
        if (initialHectares !== null && initialHectares !== undefined) {
            setHectares(initialHectares);
        }
    }, [initialHectares]);

    useEffect(() => {
        if (initialDoseCaldo !== null && initialDoseCaldo !== undefined) {
            setDoseCaldo(initialDoseCaldo);
        }
    }, [initialDoseCaldo]);

    const handleHectaresChange = (value: number) => {
        setHectares(value);
        onHectaresChange?.(value);
    };

    const handleDoseCaldoChange = (value: number) => {
        setDoseCaldo(value);
        onDoseCaldoChange?.(value);
    };

    const calculations = useMemo(() => {
        // Calculate Caldo Total
        const caldoTotal = hectares * doseCaldo;

        // Filter liquid products (L/ha or cc/ha units)
        const liquidProducts = agrochemicals.filter(agro =>
            agro.unit === 'L/ha' || agro.unit === 'cc/ha' || agro.unit === 'mL/ha'
        );

        // Calculate total liters of liquid products
        const totalLiquidProducts = liquidProducts.reduce((sum, agro) => {
            let doseInLiters = agro.dose;

            // Convert cc/mL to liters if needed
            if (agro.unit === 'cc/ha' || agro.unit === 'mL/ha') {
                doseInLiters = agro.dose / 1000;
            }

            return sum + (doseInLiters * hectares);
        }, 0);

        // Calculate water needed
        const aguaLitros = caldoTotal - totalLiquidProducts;

        // Calculate individual product amounts
        const productCalculations = agrochemicals.map(agro => {
            let amount = 0;
            let unit = agro.unit;

            // Check if unit is per hectare
            if (unit.includes('/ha')) {
                // Remove /ha for display
                unit = unit.replace('/ha', '');
                // Calculate total amount
                amount = agro.dose * hectares;
            } else {
                // Absolute amount (not per hectare)
                // Calculate proportionally based on job's total surface
                if (totalJobHectares && totalJobHectares > 0) {
                    // Proportional: (dose * hectares_calculating) / total_job_hectares
                    amount = (agro.dose * hectares) / totalJobHectares;
                } else {
                    // No total surface available, use dose as-is
                    amount = agro.dose;
                }
            }

            return {
                ...agro,
                calculatedAmount: amount,
                displayUnit: unit,
            };
        });

        return {
            caldoTotal,
            aguaLitros,
            totalLiquidProducts,
            productCalculations,
        };
    }, [agrochemicals, hectares, doseCaldo]);

    if (agrochemicals.length === 0) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                        <Calculator className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>Agrega agroquímicos para ver el cálculo del caldo</p>
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
                    Cálculo de Caldo
                </CardTitle>
                <CardDescription>
                    Cantidades necesarias para la aplicación
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Input Configuration */}
                <div className="grid gap-4 sm:grid-cols-2 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                        <Label htmlFor="calc-dose">Dosis de Caldo (L/ha)</Label>
                        <Input
                            id="calc-dose"
                            type="number"
                            min="0"
                            step="0.1"
                            value={doseCaldo}
                            onChange={(e) => handleDoseCaldoChange(parseFloat(e.target.value) || 0)}
                            placeholder="10"
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Droplet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Caldo Total</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {calculations.caldoTotal.toFixed(2)} L
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-4 bg-cyan-50 dark:bg-cyan-950/20">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
                            <Droplet className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Agua</p>
                            <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                                {calculations.aguaLitros.toFixed(2)} L
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <Beaker className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Productos</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {calculations.totalLiquidProducts.toFixed(2)} L
                            </p>
                        </div>
                    </div>
                </div>

                {/* Product Breakdown */}
                <div>
                    <h4 className="mb-3 text-sm font-semibold">Resumen de Productos</h4>
                    <div className="space-y-2">
                        {calculations.productCalculations.map((product, index) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between rounded-lg border bg-card p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium">{product.product_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {product.dose} {product.unit}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-primary">
                                        {product.calculatedAmount.toFixed(3)} {product.displayUnit}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Formula Explanation */}
                <div className="rounded-lg bg-muted p-4 text-xs space-y-1">
                    <p className="font-medium">Fórmulas:</p>
                    <p><strong>Caldo Total</strong> = Hectáreas × Dosis de Caldo</p>
                    <p><strong>Agua</strong> = Caldo Total - Total Productos Líquidos</p>
                    <p><strong>Productos</strong> = Dosis × Hectáreas (para /ha unidades)</p>
                </div>
            </CardContent>
        </Card>
    );
}
