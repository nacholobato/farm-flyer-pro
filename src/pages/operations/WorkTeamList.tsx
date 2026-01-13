import { useState } from 'react';
import { useWorkTeams, useCreateWorkTeam, useDeleteWorkTeam } from '@/hooks/useWorkTeam';
import { StaffRole } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Users, Mail, Phone, Trash2, UserCircle2 } from 'lucide-react';

export default function WorkTeamList() {
    const { data: teamMembers, isLoading } = useWorkTeams();
    const createMember = useCreateWorkTeam();
    const deleteMember = useDeleteWorkTeam();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        role: 'pilot' as StaffRole,
        phone: '',
        email: '',
    });

    const filteredMembers = teamMembers?.filter(member => {
        const matchesSearch = member.full_name.toLowerCase().includes(search.toLowerCase()) ||
            member.email?.toLowerCase().includes(search.toLowerCase()) ||
            member.phone?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || member.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createMember.mutateAsync({
            ...formData,
            phone: formData.phone || null,
            email: formData.email || null,
        });
        setDialogOpen(false);
        setFormData({ full_name: '', role: 'pilot', phone: '', email: '' });
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMember.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <LoadingPage />;

    const pilots = teamMembers?.filter(m => m.role === 'pilot').length || 0;
    const assistants = teamMembers?.filter(m => m.role === 'assistant').length || 0;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Equipo de Trabajo"
                description="Gestiona pilotos y asistentes"
                actions={
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Miembro
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Nuevo Miembro del Equipo</DialogTitle>
                                    <DialogDescription>
                                        Agrega un piloto o asistente al equipo
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Nombre Completo *</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Ej: Juan Pérez"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Rol *</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(v: StaffRole) => setFormData({ ...formData, role: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pilot">Piloto</SelectItem>
                                                <SelectItem value="assistant">Asistente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+54 9 11 1234-5678"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="juan@example.com"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={createMember.isPending}>
                                        Crear Miembro
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-3xl font-bold">{teamMembers?.length || 0}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pilotos</p>
                                <p className="text-3xl font-bold">{pilots}</p>
                            </div>
                            <UserCircle2 className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Asistentes</p>
                                <p className="text-3xl font-bold">{assistants}</p>
                            </div>
                            <UserCircle2 className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar miembros..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="pilot">Pilotos</SelectItem>
                        <SelectItem value="assistant">Asistentes</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Team Members List */}
            {filteredMembers?.length === 0 ? (
                <EmptyState
                    icon={<Users className="h-12 w-12" />}
                    title="No hay miembros"
                    description={search || roleFilter !== 'all' ? 'No se encontraron miembros con esos filtros' : 'Comienza agregando tu primer miembro del equipo'}
                    action={!search && roleFilter === 'all' ? { label: 'Agregar Miembro', onClick: () => setDialogOpen(true) } : undefined}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMembers?.map((member) => (
                        <Card key={member.id} className="transition-all hover:shadow-md hover:border-primary/30">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${member.role === 'pilot' ? 'bg-primary/10' : 'bg-blue-500/10'
                                            }`}>
                                            <UserCircle2 className={`h-6 w-6 ${member.role === 'pilot' ? 'text-primary' : 'text-blue-500'
                                                }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{member.full_name}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {member.role === 'pilot' ? 'Piloto' : 'Asistente'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleteId(member.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                    {member.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span>{member.phone}</span>
                                        </div>
                                    )}
                                    {member.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el miembro del equipo. Los registros de asistencia previos se mantendrán pero sin referencia a este miembro.
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
