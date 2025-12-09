import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LocationPicker({ value, onChange, placeholder = "Coordenadas GPS" }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Parse existing value when dialog opens
  useEffect(() => {
    if (open && value) {
      const coords = value.split(',').map(s => s.trim());
      if (coords.length === 2) {
        setLatitude(coords[0]);
        setLongitude(coords[1]);
      }
    }
  }, [open, value]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setIsGettingLocation(false);
        toast.success('Ubicación obtenida correctamente');
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permiso de ubicación denegado');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Ubicación no disponible');
            break;
          case error.TIMEOUT:
            toast.error('Tiempo de espera agotado');
            break;
          default:
            toast.error('Error al obtener ubicación');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSave = () => {
    if (latitude && longitude) {
      onChange(`${latitude}, ${longitude}`);
      setOpen(false);
    } else if (!latitude && !longitude) {
      onChange('');
      setOpen(false);
    } else {
      toast.error('Ingresa ambas coordenadas o ninguna');
    }
  };

  const handleClear = () => {
    setLatitude('');
    setLongitude('');
    onChange('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex gap-2">
        <Input
          value={value}
          readOnly
          placeholder={placeholder}
          className="cursor-pointer"
          onClick={() => setOpen(true)}
        />
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon">
            <MapPin className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubicación GPS</DialogTitle>
          <DialogDescription>
            Ingresa las coordenadas manualmente o usa tu ubicación actual
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <Navigation className="mr-2 h-4 w-4" />
                Usar mi ubicación actual
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                o ingresa manualmente
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud</Label>
              <Input
                id="latitude"
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-31.416668"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud</Label>
              <Input
                id="longitude"
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-64.183334"
              />
            </div>
          </div>

          {latitude && longitude && (
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-sm text-muted-foreground">Vista previa:</p>
              <p className="font-mono text-sm">{latitude}, {longitude}</p>
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                Ver en Google Maps
              </a>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={handleClear}>
            Limpiar
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Guardar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
