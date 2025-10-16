import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";

interface DangerZone {
  state: string;
  location: { lat: number; lng: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalCrimes: number;
  year: number;
  highestCrimeType: string;
  rape: number;
  kidnapping: number;
  domesticViolence: number;
}

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical': return '#ef4444'; // red
    case 'high': return '#f97316'; // orange
    case 'medium': return '#eab308'; // yellow
    case 'low': return '#22c55e'; // green
    default: return '#6b7280'; // gray
  }
};

export function DangerZoneMap() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch crime zones from API
  const { data: crimeZones = [], isLoading } = useQuery<DangerZone[]>({
    queryKey: ['/api/crime-zones'],
  });

  useEffect(() => {
    // Get user location with high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        // Default to India center if permission denied
        setUserLocation({ lat: 20.5937, lng: 78.9629 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !userLocation) return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [userLocation.lat, userLocation.lng], 
        5
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add user location marker with pulsing effect
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `<div style="width: 20px; height: 20px; background: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(37, 99, 235, 0.5); animation: pulse 2s infinite;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapRef.current)
      .bindPopup(`<div><strong>Your Location</strong><br/>Lat: ${userLocation.lat.toFixed(6)}<br/>Lng: ${userLocation.lng.toFixed(6)}</div>`);

    // Center map on user location
    mapRef.current.setView([userLocation.lat, userLocation.lng], 10);

    // Add danger zones from real crime data
    crimeZones.forEach((zone) => {
      if (!mapRef.current) return;

      // Calculate radius based on risk level
      const radius = zone.riskLevel === 'critical' ? 60000 : 
                    zone.riskLevel === 'high' ? 40000 : 
                    zone.riskLevel === 'medium' ? 25000 : 15000;

      // Add circle for danger zone
      L.circle([zone.location.lat, zone.location.lng], {
        color: getRiskColor(zone.riskLevel),
        fillColor: getRiskColor(zone.riskLevel),
        fillOpacity: 0.35,
        radius: radius,
        weight: 2,
      }).addTo(mapRef.current)
        .bindPopup(`
          <div class="p-3 min-w-[200px]">
            <p class="font-bold text-base mb-1">${zone.state}</p>
            <p class="text-sm font-semibold uppercase mb-2" style="color: ${getRiskColor(zone.riskLevel)}">${zone.riskLevel} RISK</p>
            <div class="space-y-1 text-xs">
              <p><strong>Total Crimes:</strong> ${zone.totalCrimes.toLocaleString()}</p>
              <p><strong>Highest:</strong> ${zone.highestCrimeType}</p>
              <p><strong>Year:</strong> ${zone.year}</p>
              <hr class="my-2" />
              <p><strong>Rape:</strong> ${zone.rape}</p>
              <p><strong>Kidnapping:</strong> ${zone.kidnapping}</p>
              <p><strong>Domestic Violence:</strong> ${zone.domesticViolence}</p>
            </div>
          </div>
        `);
    });

    // Cleanup function moved outside to prevent memory leaks
  }, [userLocation, crimeZones]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Danger Zone Map</h3>
        <Card className="overflow-hidden">
          <div className="h-96 w-full flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading crime zone map...</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Crime Risk Zone Map</h3>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            Low Risk
          </Badge>
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1" />
            Medium
          </Badge>
          <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-1" />
            High
          </Badge>
          <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1" />
            Critical
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div 
          ref={mapContainerRef} 
          className="h-96 w-full"
          data-testid="map-danger-zones"
        />
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>Red zones indicate critical crime areas based on latest state-wise data. Blue marker shows your current location.</span>
      </div>
    </div>
  );
}
