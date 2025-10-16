import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { audioManager } from '@/lib/audio-utils';

interface DangerZone {
  state: string;
  location: { lat: number; lng: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalCrimes: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function useDangerZoneAlert() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [inDangerZone, setInDangerZone] = useState(false);
  const [dangerZoneInfo, setDangerZoneInfo] = useState<DangerZone | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const isAlarmPlayingRef = useRef(false);

  // Fetch crime zones
  const { data: crimeZones = [] } = useQuery<DangerZone[]>({
    queryKey: ['/api/crime-zones'],
  });

  // Initialize audio system on mount
  useEffect(() => {
    // Initialize audio on first user interaction
    const initAudio = () => {
      audioManager.initializeOnUserInteraction();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      audioManager.stopAlarm();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  // Start continuous location tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          checkDangerZone(newLocation);
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [crimeZones]);

  // Check if user is in danger zone
  const checkDangerZone = (location: UserLocation) => {
    if (!crimeZones || crimeZones.length === 0) return;

    let nearestDangerZone: DangerZone | null = null;
    let minDistance = Infinity;

    for (const zone of crimeZones) {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        zone.location.lat,
        zone.location.lng
      );

      // Define danger radius based on risk level
      const dangerRadius =
        zone.riskLevel === 'critical'
          ? 60000
          : zone.riskLevel === 'high'
          ? 40000
          : zone.riskLevel === 'medium'
          ? 25000
          : 15000;

      if (distance < dangerRadius && distance < minDistance) {
        nearestDangerZone = zone;
        minDistance = distance;
      }
    }

    if (nearestDangerZone && (nearestDangerZone.riskLevel === 'high' || nearestDangerZone.riskLevel === 'critical')) {
      if (!inDangerZone) {
        setInDangerZone(true);
        setDangerZoneInfo(nearestDangerZone);
        playAlarm();
        showNotification(nearestDangerZone);
      }
    } else {
      if (inDangerZone) {
        setInDangerZone(false);
        setDangerZoneInfo(null);
        stopAlarm();
      }
    }
  };

  // Play alarm sound
  const playAlarm = async () => {
    if (isAlarmPlayingRef.current) return;
    
    try {
      isAlarmPlayingRef.current = true;
      const success = await audioManager.playAlarm('alarm');
      
      if (!success) {
        // Try police sound as fallback
        await audioManager.playAlarm('police');
      }
      
      console.log('Danger zone alarm started');
    } catch (error) {
      console.error('Failed to play danger zone alarm:', error);
      isAlarmPlayingRef.current = false;
    }
  };

  // Stop alarm sound
  const stopAlarm = () => {
    try {
      audioManager.stopAlarm();
      isAlarmPlayingRef.current = false;
      console.log('Danger zone alarm stopped');
    } catch (error) {
      console.error('Error stopping alarm:', error);
    }
  };

  // Show browser notification
  const showNotification = (zone: DangerZone) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ DANGER ZONE ALERT', {
        body: `You are entering a ${zone.riskLevel.toUpperCase()} risk area in ${zone.state}. Please stay alert!`,
        icon: '/logo.png',
        requireInteraction: true,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('⚠️ DANGER ZONE ALERT', {
            body: `You are entering a ${zone.riskLevel.toUpperCase()} risk area in ${zone.state}. Please stay alert!`,
            icon: '/logo.png',
            requireInteraction: true,
          });
        }
      });
    }
  };

  return {
    userLocation,
    inDangerZone,
    dangerZoneInfo,
    stopAlarm,
  };
}
