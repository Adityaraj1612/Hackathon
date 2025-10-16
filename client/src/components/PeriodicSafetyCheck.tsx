import { useState, useEffect } from 'react';
import { EmergencyAlertModal } from '@/components/EmergencyAlertModal';

interface PeriodicSafetyCheckProps {
  enabled: boolean;
}

export function PeriodicSafetyCheck({ enabled }: PeriodicSafetyCheckProps) {
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheckTime;
      
      // Check every 1 minute (60,000 milliseconds)
      if (timeSinceLastCheck >= 60000) {
        setShowSafetyCheck(true);
        setLastCheckTime(now);
      }
    }, 10000); // Check every 10 seconds for more responsive timing

    return () => clearInterval(interval);
  }, [enabled, lastCheckTime]);

  const handleSafetyCheckClose = (markedSafe?: boolean) => {
    setShowSafetyCheck(false);
    if (markedSafe) {
      setLastCheckTime(Date.now());
    }
  };

  return (
    <EmergencyAlertModal
      open={showSafetyCheck}
      onClose={handleSafetyCheckClose}
      location={{ lat: 0, lng: 0 }}
    />
  );
}