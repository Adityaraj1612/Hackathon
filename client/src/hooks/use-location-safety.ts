import { useState, useEffect, useCallback, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface DangerZone {
  state: string;
  location: Location;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalCrimes: number;
}

interface SafetyStatus {
  isInDangerZone: boolean;
  currentZone: DangerZone | null;
  userLocation: Location | null;
  distance: number | null;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function useLocationSafety(crimeZones: DangerZone[], enabled: boolean = false) {
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus>({
    isInDangerZone: false,
    currentZone: null,
    userLocation: null,
    distance: null,
  });

  const [trackingActive, setTrackingActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const checkSafety = useCallback((position: GeolocationPosition) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    // Check each crime zone
    let closestZone: DangerZone | null = null;
    let minDistance = Infinity;
    let isInDanger = false;

    for (const zone of crimeZones) {
      const distance = calculateDistance(
        userLat,
        userLng,
        zone.location.lat,
        zone.location.lng
      );

      // Define danger radius based on risk level (in km)
      const dangerRadius = 
        zone.riskLevel === 'critical' ? 60 :
        zone.riskLevel === 'high' ? 40 :
        zone.riskLevel === 'medium' ? 25 : 15;

      if (distance < dangerRadius && distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
        // Only trigger alert for high and critical zones
        if (zone.riskLevel === 'high' || zone.riskLevel === 'critical') {
          isInDanger = true;
        }
      }
    }

    setSafetyStatus({
      isInDangerZone: isInDanger,
      currentZone: closestZone,
      userLocation: { lat: userLat, lng: userLng },
      distance: closestZone ? minDistance : null,
    });
  }, [crimeZones]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    setTrackingActive(true);

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      checkSafety,
      (error) => {
        console.error('Location tracking error:', error);
        setTrackingActive(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Update every 5 seconds
      }
    );
  }, [checkSafety]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setTrackingActive(false);
    }
  }, []);

  // Only cleanup on unmount - no auto-start
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    safetyStatus,
    trackingActive,
    startTracking,
    stopTracking,
  };
}
