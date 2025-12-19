import { MixCalculator } from '@/components/tools/MixCalculator';
import { PageHeader } from '@/components/ui/page-header';

export default function CalculatorPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Calculadora de Mezcla"
                description="Calcula las cantidades necesarias para tu área objetivo"
            />
            <MixCalculator />
        </div>
    );
}
