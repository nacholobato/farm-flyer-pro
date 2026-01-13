import { useState, useMemo, useEffect } from 'react';
import { useFarms } from '@/hooks/useFarms';
import { useClients } from '@/hooks/useClients';
import { Farm } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Users, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FarmWithCoords extends Farm {
  lat: number;
  lng: number;
}

function MapBounds({ farms }: { farms: FarmWithCoords[] }) {
  const map = useMap();

  useEffect(() => {
    if (farms.length > 0) {
      const bounds = L.latLngBounds(farms.map(f => [f.lat, f.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [farms, map]);

  return null;
}

export default function FarmsList() {
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: clients, isLoading: clientsLoading } = useClients();

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Parse GPS coordinates and filter farms
  const farmsWithCoords = useMemo(() => {
    if (!farms) return [];

    return farms
      .map(farm => {
        if (!farm.location) return null;

        const coords = farm.location.split(',').map(s => s.trim());
        if (coords.length !== 2) return null;

        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);

        if (isNaN(lat) || isNaN(lng)) return null;

        return { ...farm, lat, lng } as FarmWithCoords;
      })
      .filter((farm): farm is FarmWithCoords => farm !== null);
  }, [farms]);

  const filteredFarms = useMemo(() => {
    return farmsWithCoords.filter(farm => {
      const matchesSearch =
        farm.name.toLowerCase().includes(search.toLowerCase()) ||
        farm.location?.toLowerCase().includes(search.toLowerCase()) ||
        farm.localidad?.toLowerCase().includes(search.toLowerCase());
      const matchesClient = clientFilter === 'all' || farm.client_id === clientFilter;
      return matchesSearch && matchesClient;
    });
  }, [farmsWithCoords, search, clientFilter]);

  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || 'Cliente desconocido';
  };

  if (farmsLoading || clientsLoading) return <LoadingPage />;

  // Default center (Argentina)
  const defaultCenter: [number, number] = [-34.6037, -58.3816];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        title="Fincas"
        description={`${filteredFarms.length} finca${filteredFarms.length !== 1 ? 's' : ''} con ubicación GPS`}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar fincas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-lg border overflow-hidden relative">
        {filteredFarms.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-muted/30">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No hay fincas con ubicación GPS</p>
              <p className="text-sm text-muted-foreground mt-2">
                {search || clientFilter !== 'all'
                  ? 'Intenta cambiar los filtros'
                  : 'Agrega coordenadas GPS a tus fincas desde la ficha de cada cliente'}
              </p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {filteredFarms.map((farm) => (
              <Marker key={farm.id} position={[farm.lat, farm.lng]}>
                <Popup maxWidth={300}>
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-success" />
                      <h3 className="font-semibold text-base">{farm.name}</h3>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{getClientName(farm.client_id)}</span>
                      </div>

                      {farm.localidad && (
                        <p>
                          <span className="text-muted-foreground">Localidad:</span>{' '}
                          <span className="font-medium">{farm.localidad}</span>
                        </p>
                      )}

                      {farm.cultivo && (
                        <p>
                          <span className="text-muted-foreground">Cultivo:</span>{' '}
                          <span className="font-medium">{farm.cultivo}</span>
                        </p>
                      )}

                      {farm.area_hectares && (
                        <p>
                          <span className="text-muted-foreground">Superficie:</span>{' '}
                          <span className="font-medium">{farm.area_hectares} ha</span>
                        </p>
                      )}

                      <div className="text-xs text-muted-foreground pt-1">
                        {farm.lat.toFixed(6)}, {farm.lng.toFixed(6)}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps?q=${farm.lat},${farm.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Abrir en Google Maps
                      </a>
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapBounds farms={filteredFarms} />
          </MapContainer>
        )}
      </div>
    </div>
  );
}