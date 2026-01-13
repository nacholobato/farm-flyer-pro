import { useState, useEffect } from 'react';
import { useCreateAttendance, useHectaresSummary } from '@/hooks/useOperationalAttendance';
import { useWorkTeams } from '@/hooks/useWorkTeam';
import { useDrones } from '@/hooks/useDrones';
import { useGenerators } from '@/hooks/useGenerators';
import { useJobs } from '@/hooks/useJobs';
import { ActivityType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plane, Users, Zap, AlertTriangle } from 'lucide-react';

interface AttendanceFormProps {
    prefilledJobId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function AttendanceForm({ prefilledJobId, onSuccess, onCancel }: AttendanceFormProps) {
    const createAttendance = useCreateAttendance();
    const { data: jobs } = useJobs();
    const { data: pilots } = useWorkTeams({ role: 'pilot' });
    const { data: assistants } = useWorkTeams({ role: 'assistant' });
    const { data: drones } = useDrones();
    const { data: generators } = useGenerators();

    const [formData, setFormData] = useState({
        job_id: prefilledJobId || '',
        start_date: new Date().toISOString().split('T')[0],
        check_in_time: '',
        check_out_time: '',
        activity_type: '' as ActivityType | '',
        pilot_id: '',
        assistant_id: '',
        drone_id: '',
        generator_id: '',
        gen_usage_hours: '',
        hectares_done: '',
        agronomic_obs: '',
        technical_obs: '',
        is_reviewed: false,
    });

    const { data: hectaresSummary } = useHectaresSummary(formData.job_id || undefined);

    // Calculate if hectares will exceed
    const willExceedHectares = hectaresSummary && formData.hectares_done ?
        (hectaresSummary.total_hectares_done + parseFloat(formData.hectares_done)) >
        (hectaresSummary.job_applied_hectares || hectaresSummary.job_theoretical_hectares || Infinity)
        : false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createAttendance.mutateAsync({
            job_id: formData.job_id,
            start_date: formData.start_date,
            check_in_time: formData.check_in_time || null,
            check_out_time: formData.check_out_time || null,
            activity_type: formData.activity_type || null,
            pilot_id: formData.pilot_id || null,
            assistant_id: formData.assistant_id || null,
            drone_id: formData.drone_id || null,
            generator_id: formData.generator_id || null,
            gen_usage_hours: formData.gen_usage_hours ? parseFloat(formData.gen_usage_hours) : null,
            hectares_done: formData.hectares_done ? parseFloat(formData.hectares_done) : null,
            agronomic_obs: formData.agronomic_obs || null,
            technical_obs: formData.technical_obs || null,
            is_reviewed: formData.is_reviewed,
        });
        if (onSuccess) onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Selection */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="job_id">Trabajo *</Label>
                            <Select
                                value={formData.job_id}
                                onValueChange={(v) => setFormData({ ...formData, job_id: v })}
                                disabled={!!prefilledJobId}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar trabajo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs?.map((job) => (
                                        <SelectItem key={job.id} value={job.id}>
                                            {job.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date and Time */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Fecha *</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="check_in_time">Hora Entrada</Label>
                                <Input
                                    id="check_in_time"
                                    type="time"
                                    value={formData.check_in_time}
                                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="check_out_time">Hora Salida</Label>
                                <Input
                                    id="check_out_time"
                                    type="time"
                                    value={formData.check_out_time}
                                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Type */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <Label>Tipo de Actividad</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['spraying', 'mapping', 'scouting'] as ActivityType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, activity_type: type })}
                                    className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${formData.activity_type === type
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-muted-foreground/20 hover:bg-accent'
                                        }`}
                                >
                                    <span className="font-medium capitalize">
                                        {type === 'spraying' ? 'Fumigación' : type === 'mapping' ? 'Mapeo' : 'Monitoreo'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Team and Equipment */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="pilot_id">
                                    <Users className="mr-2 inline h-4 w-4" />
                                    Piloto
                                </Label>
                                <Select
                                    value={formData.pilot_id}
                                    onValueChange={(v) => setFormData({ ...formData, pilot_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar piloto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pilots?.map((pilot) => (
                                            <SelectItem key={pilot.id} value={pilot.id}>
                                                {pilot.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assistant_id">
                                    <Users className="mr-2 inline h-4 w-4" />
                                    Asistente
                                </Label>
                                <Select
                                    value={formData.assistant_id}
                                    onValueChange={(v) => setFormData({ ...formData, assistant_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar asistente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assistants?.map((assistant) => (
                                            <SelectItem key={assistant.id} value={assistant.id}>
                                                {assistant.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="drone_id">
                                    <Plane className="mr-2 inline h-4 w-4" />
                                    Dron
                                </Label>
                                <Select
                                    value={formData.drone_id}
                                    onValueChange={(v) => setFormData({ ...formData, drone_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar dron" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drones?.map((drone) => (
                                            <SelectItem key={drone.id} value={drone.id}>
                                                {drone.model} - {drone.total_hours.toFixed(2)}h
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="generator_id">
                                    <Zap className="mr-2 inline h-4 w-4" />
                                    Generador
                                </Label>
                                <Select
                                    value={formData.generator_id}
                                    onValueChange={(v) => setFormData({ ...formData, generator_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar generador" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {generators?.map((generator) => (
                                            <SelectItem key={generator.id} value={generator.id}>
                                                {generator.brand} - {generator.total_hours.toFixed(2)}h
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Usage and Hectares */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="gen_usage_hours">Horas de Generador</Label>
                                <Input
                                    id="gen_usage_hours"
                                    type="number"
                                    step="0.01"
                                    value={formData.gen_usage_hours}
                                    onChange={(e) => setFormData({ ...formData, gen_usage_hours: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hectares_done">Hectáreas Realizadas</Label>
                                <Input
                                    id="hectares_done"
                                    type="number"
                                    step="0.01"
                                    value={formData.hectares_done}
                                    onChange={(e) => setFormData({ ...formData, hectares_done: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Hectares Warning */}
                        {willExceedHectares && hectaresSummary && (
                            <div className="rounded-lg border border-warning bg-warning/10 p-4">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-warning" />
                                    <div className="flex-1">
                                        <p className="font-medium text-warning">Advertencia de Hectáreas</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Total acumulado: {(hectaresSummary.total_hectares_done + parseFloat(formData.hectares_done)).toFixed(2)} ha
                                            excede el límite del trabajo ({hectaresSummary.job_applied_hectares?.toFixed(2) || hectaresSummary.job_theoretical_hectares?.toFixed(2)} ha)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Observations */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="agronomic_obs">Observaciones Agronómicas</Label>
                            <Textarea
                                id="agronomic_obs"
                                value={formData.agronomic_obs}
                                onChange={(e) => setFormData({ ...formData, agronomic_obs: e.target.value })}
                                placeholder="Observaciones sobre el cultivo, malezas, plagas..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="technical_obs">Observaciones Técnicas</Label>
                            <Textarea
                                id="technical_obs"
                                value={formData.technical_obs}
                                onChange={(e) => setFormData({ ...formData, technical_obs: e.target.value })}
                                placeholder="Observaciones sobre equipos, condiciones de aplicación..."
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_reviewed"
                                checked={formData.is_reviewed}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_reviewed: !!checked })}
                            />
                            <Label htmlFor="is_reviewed" className="cursor-pointer">
                                Marcar como revisado
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={createAttendance.isPending || !formData.job_id}>
                    {createAttendance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Asistencia
                </Button>
            </div>
        </form>
    );
}
