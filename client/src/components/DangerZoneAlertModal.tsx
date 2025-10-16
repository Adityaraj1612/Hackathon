import { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { audioManager } from '@/lib/audio-utils';

interface DangerZone {
  state: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalCrimes: number;
}

interface DangerZoneAlertModalProps {
  open: boolean;
  onClose: () => void;
  dangerZone: DangerZone | null;
}

export function DangerZoneAlertModal({ open, onClose, dangerZone }: DangerZoneAlertModalProps) {
  // Play alarm when modal opens
  useEffect(() => {
    if (open && dangerZone) {
      const playDangerAlarm = async () => {
        try {
          await audioManager.initializeOnUserInteraction();
          const success = await audioManager.playAlarm('alarm');
          if (!success) {
            await audioManager.playAlarm('police');
          }
          console.log('Danger zone modal alarm started');
        } catch (error) {
          console.error('Failed to play danger zone modal alarm:', error);
        }
      };
      
      playDangerAlarm();
    } else {
      // Stop alarm when modal closes
      audioManager.stopAlarm();
    }
    
    return () => {
      audioManager.stopAlarm();
    };
  }, [open, dangerZone]);

  if (!dangerZone) return null;

  const getRiskColor = () => {
    switch (dangerZone.riskLevel) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="border-red-500 border-2">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl text-red-600">
              ⚠️ DANGER ZONE ALERT
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-lg font-semibold text-foreground mb-2">
                You are in a danger zone!
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Location:</span> {dangerZone.state}
                </p>
                <p>
                  <span className="font-semibold">Risk Level:</span>{' '}
                  <span className={`uppercase font-bold ${getRiskColor()}`}>
                    {dangerZone.riskLevel}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Crime Reports:</span>{' '}
                  {dangerZone.totalCrimes.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-foreground">
              <p className="font-semibold">⚡ Safety Recommendations:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Stay in well-lit, populated areas</li>
                <li>Keep your phone charged and accessible</li>
                <li>Share your location with trusted contacts</li>
                <li>Avoid isolated areas and shortcuts</li>
                <li>Trust your instincts - leave if you feel unsafe</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => {
              audioManager.stopAlarm();
              onClose();
            }} 
            className="bg-red-600 hover:bg-red-700"
          >
            I Understand - Stop Alarm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
