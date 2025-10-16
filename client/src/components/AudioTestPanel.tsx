import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';
import { audioManager } from '@/lib/audio-utils';

export function AudioTestPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');
  const [audioInitialized, setAudioInitialized] = useState(false);

  const initializeAudio = async () => {
    try {
      await audioManager.initializeOnUserInteraction();
      setAudioInitialized(true);
      setTestResult('success');
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setTestResult('failed');
    }
  };

  const testAlarmSound = async () => {
    if (isPlaying) {
      audioManager.stopAlarm();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const success = await audioManager.playAlarm('alarm');
      
      if (success) {
        setTestResult('success');
        // Auto-stop after 3 seconds
        setTimeout(() => {
          audioManager.stopAlarm();
          setIsPlaying(false);
        }, 3000);
      } else {
        setTestResult('failed');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Audio test failed:', error);
      setTestResult('failed');
      setIsPlaying(false);
    }
  };

  const testPoliceSound = async () => {
    if (isPlaying) {
      audioManager.stopAlarm();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const success = await audioManager.playAlarm('police');
      
      if (success) {
        setTestResult('success');
        // Auto-stop after 3 seconds
        setTimeout(() => {
          audioManager.stopAlarm();
          setIsPlaying(false);
        }, 3000);
      } else {
        setTestResult('failed');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Police sound test failed:', error);
      setTestResult('failed');
      setIsPlaying(false);
    }
  };

  const stopAllAudio = () => {
    audioManager.stopAlarm();
    setIsPlaying(false);
  };

  const getStatusBadge = () => {
    switch (testResult) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">✓ Working</Badge>;
      case 'failed':
        return <Badge variant="destructive">✗ Failed</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Audio System Test
            </CardTitle>
            <CardDescription>
              Test the emergency alert sound system
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={initializeAudio}
            variant="outline"
            className="h-12"
            disabled={audioInitialized}
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {audioInitialized ? 'Audio Ready' : 'Initialize Audio'}
          </Button>

          <Button
            onClick={testAlarmSound}
            variant={isPlaying ? "destructive" : "default"}
            className="h-12"
            disabled={!audioInitialized}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Alarm
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Alarm Sound
              </>
            )}
          </Button>

          <Button
            onClick={testPoliceSound}
            variant={isPlaying ? "destructive" : "secondary"}
            className="h-12"
            disabled={!audioInitialized}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Police
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Police Sound
              </>
            )}
          </Button>

          <Button
            onClick={stopAllAudio}
            variant="outline"
            className="h-12"
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Stop All Audio
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click "Initialize Audio" first to enable sound playback</p>
          <p>• Test sounds will play for 3 seconds automatically</p>
          <p>• Use "Stop All Audio" to immediately stop any playing sounds</p>
          {testResult === 'failed' && (
            <p className="text-destructive">• Check browser console for error details</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}