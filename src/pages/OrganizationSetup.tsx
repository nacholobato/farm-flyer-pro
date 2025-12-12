import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';

export default function OrganizationSetup() {
  const navigate = useNavigate();
  const createOrganization = useCreateOrganization();
  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre de la organización es requerido');
      return;
    }

    try {
      await createOrganization.mutateAsync({
        name: formData.name.trim(),
        ruc: formData.ruc.trim() || undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al crear la organización');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configura tu Organización</CardTitle>
          <CardDescription>
            Crea tu organización para comenzar a gestionar tus operaciones agrícolas
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Organización *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Mi Empresa Agrícola"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC / CUIT (opcional)</Label>
              <Input
                id="ruc"
                type="text"
                placeholder="20-12345678-9"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={createOrganization.isPending}>
              {createOrganization.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Organización
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
