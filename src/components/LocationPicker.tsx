import { useState, useEffect, useRef } from 'react';
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
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function LocationMarker({ position, setPosition, setLatitude, setLongitude }: any) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export function LocationPicker({ value, onChange, placeholder = "Coordenadas GPS" }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Parse existing value when dialog opens
  useEffect(() => {
    if (open && value) {
      const coords = value.split(',').map(s => s.trim());
      if (coords.length === 2) {
        setLatitude(coords[0]);
        setLongitude(coords[1]);
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition(new L.LatLng(lat, lng));
        }
      }
    }
  }, [open, value]);

  // Handle manual input changes
  useEffect(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setPosition(new L.LatLng(lat, lng));
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
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
    setPosition(null);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ubicación GPS</DialogTitle>
          <DialogDescription>
            Haz clic en el mapa para seleccionar un punto, usa tu ubicación actual, o ingresa las coordenadas manualmente
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

          {/* Map */}
          <div className="w-full h-64 rounded-lg border overflow-hidden relative z-0">
            <MapContainer
              center={[-31.4167, -64.1833]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                position={position}
                setPosition={setPosition}
                setLatitude={setLatitude}
                setLongitude={setLongitude}
              />
            </MapContainer>
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
