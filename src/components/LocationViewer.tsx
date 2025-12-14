import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ExternalLink } from 'lucide-react';

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

interface LocationViewerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    location: string | null; // "lat, lng" string
    title?: string;
}

function MapUpdater({ position }: { position: L.LatLng }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(position, 14);
    }, [position, map]);
    return null;
}

export function LocationViewer({ open, onOpenChange, location, title = "Ubicación de la finca" }: LocationViewerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    useEffect(() => {
        if (location) {
            const coords = location.split(',').map(s => s.trim());
            if (coords.length === 2) {
                const lat = parseFloat(coords[0]);
                const lng = parseFloat(coords[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    setPosition(new L.LatLng(lat, lng));
                }
            }
        }
    }, [location]);

    if (!location || !position) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="w-full h-64 rounded-lg border overflow-hidden relative z-0">
                        <MapContainer
                            center={[position.lat, position.lng]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={position} />
                            <MapUpdater position={position} />
                        </MapContainer>
                    </div>

                    <div className="flex justify-between items-center rounded-lg border bg-muted/50 p-3">
                        <div className="text-sm">
                            <span className="text-muted-foreground mr-2">Coordenadas:</span>
                            <span className="font-mono">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver en Google Maps
                            </a>
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
