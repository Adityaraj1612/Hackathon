// Audio utility for playing alert sounds with proper browser compatibility

class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentSources: Set<AudioBufferSourceNode> = new Set();
  private fallbackAudio: HTMLAudioElement | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      // Create AudioContext (preferred method)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Handle browser autoplay policy
      if (this.audioContext.state === 'suspended') {
        // Wait for user interaction to resume
        document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
        document.addEventListener('touchstart', this.resumeAudioContext.bind(this), { once: true });
      }
    } catch (error) {
      console.warn('AudioContext not supported, falling back to HTML5 Audio:', error);
      this.setupFallbackAudio();
    }
  }

  private async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('AudioContext resumed');
    }
  }

  private setupFallbackAudio() {
    this.fallbackAudio = new Audio();
    this.fallbackAudio.preload = 'auto';
    this.fallbackAudio.loop = true;
    this.fallbackAudio.volume = 1.0;
  }

  async loadAudio(url: string, name: string): Promise<boolean> {
    try {
      if (this.audioContext) {
        // Load with AudioContext (better performance)
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(name, audioBuffer);
        console.log(`Audio loaded successfully: ${name}`);
        return true;
      } else if (this.fallbackAudio) {
        // Load with HTML5 Audio
        this.fallbackAudio.src = url;
        await new Promise((resolve, reject) => {
          this.fallbackAudio!.addEventListener('canplaythrough', resolve, { once: true });
          this.fallbackAudio!.addEventListener('error', reject, { once: true });
          this.fallbackAudio!.load();
        });
        console.log(`Fallback audio loaded: ${name}`);
        return true;
      }
    } catch (error) {
      console.error(`Failed to load audio ${name}:`, error);
      return false;
    }
    return false;
  }

  async playAlarm(audioName: string = 'alarm'): Promise<boolean> {
    try {
      // Ensure audio context is running
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.audioContext && this.audioBuffers.has(audioName)) {
        // Play with AudioContext
        const buffer = this.audioBuffers.get(audioName)!;
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.loop = true;
        gainNode.gain.value = 1.0;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(0);
        this.currentSources.add(source);
        
        console.log('Alarm started with AudioContext');
        return true;
      } else if (this.fallbackAudio) {
        // Play with HTML5 Audio
        this.fallbackAudio.currentTime = 0;
        const playPromise = this.fallbackAudio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Alarm started with HTML5 Audio');
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to play alarm:', error);
      
      // Last resort: try to play any available audio
      try {
        const emergencyAudio = new Audio('/alarm.mp3');
        emergencyAudio.volume = 1.0;
        emergencyAudio.loop = true;
        await emergencyAudio.play();
        this.fallbackAudio = emergencyAudio;
        console.log('Emergency audio fallback successful');
        return true;
      } catch (fallbackError) {
        console.error('All audio playback methods failed:', fallbackError);
        return false;
      }
    }
    return false;
  }

  stopAlarm(): void {
    try {
      // Stop AudioContext sources
      this.currentSources.forEach(source => {
        try {
          source.stop();
          source.disconnect();
        } catch (error) {
          console.warn('Error stopping audio source:', error);
        }
      });
      this.currentSources.clear();

      // Stop HTML5 Audio
      if (this.fallbackAudio) {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
      }

      console.log('Alarm stopped');
    } catch (error) {
      console.error('Error stopping alarm:', error);
    }
  }

  // Initialize audio on user interaction
  async initializeOnUserInteraction(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Preload audio files
      const audioFiles = [
        { url: '/alarm.mp3', name: 'alarm' },
        { url: '/Police.mp3', name: 'police' }
      ];

      for (const { url, name } of audioFiles) {
        await this.loadAudio(url, name);
      }

      this.isInitialized = true;
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  // Test audio playback
  async testAudio(): Promise<boolean> {
    console.log('Testing audio playback...');
    const success = await this.playAlarm();
    
    if (success) {
      // Stop after 2 seconds
      setTimeout(() => this.stopAlarm(), 2000);
    }
    
    return success;
  }
}

// Create singleton instance
export const audioManager = new AudioManager();

// Convenience functions
export const playAlarmSound = () => audioManager.playAlarm('alarm');
export const playPoliceSound = () => audioManager.playAlarm('police');
export const stopAlarmSound = () => audioManager.stopAlarm();
export const initializeAudio = () => audioManager.initializeOnUserInteraction();
export const testAudio = () => audioManager.testAudio();