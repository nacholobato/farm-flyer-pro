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
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY200aGt3NndzMDM5dTJpb21hZXFoeXFnbCJ9.a0WkNcyF1opUDL_SmOc69w';

export function LocationPicker({ value, onChange, placeholder = "Coordenadas GPS" }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

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

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open || !mapContainer.current) return;

    // Small delay to ensure dialog is rendered
    const timeout = setTimeout(() => {
      if (!mapContainer.current || map.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const initialLat = latitude ? parseFloat(latitude) : -31.4167;
      const initialLng = longitude ? parseFloat(longitude) : -64.1833;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [initialLng, initialLat],
        zoom: latitude && longitude ? 14 : 6,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker if coordinates exist
      if (latitude && longitude) {
        marker.current = new mapboxgl.Marker({ color: '#22c55e', draggable: true })
          .setLngLat([initialLng, initialLat])
          .addTo(map.current);

        marker.current.on('dragend', () => {
          const lngLat = marker.current?.getLngLat();
          if (lngLat) {
            setLatitude(lngLat.lat.toFixed(6));
            setLongitude(lngLat.lng.toFixed(6));
          }
        });
      }

      // Click to add/move marker
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));

        if (marker.current) {
          marker.current.setLngLat([lng, lat]);
        } else if (map.current) {
          marker.current = new mapboxgl.Marker({ color: '#22c55e', draggable: true })
            .setLngLat([lng, lat])
            .addTo(map.current);

          marker.current.on('dragend', () => {
            const lngLat = marker.current?.getLngLat();
            if (lngLat) {
              setLatitude(lngLat.lat.toFixed(6));
              setLongitude(lngLat.lng.toFixed(6));
            }
          });
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      marker.current = null;
    };
  }, [open]);

  // Update marker when coordinates change manually
  useEffect(() => {
    if (!map.current || !latitude || !longitude) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new mapboxgl.Marker({ color: '#22c55e', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current);

      marker.current.on('dragend', () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          setLatitude(lngLat.lat.toFixed(6));
          setLongitude(lngLat.lng.toFixed(6));
        }
      });
    }

    map.current.flyTo({ center: [lng, lat], zoom: 14 });
  }, [latitude, longitude]);

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
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  };

  const handleClose = () => {
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
          <div 
            ref={mapContainer} 
            className="w-full h-64 rounded-lg border overflow-hidden"
          />

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
          <Button type="button" variant="outline" onClick={handleClose}>
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
