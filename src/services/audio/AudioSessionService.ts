import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

class AudioSessionServiceImpl {
    private static instance: AudioSessionServiceImpl;
    private isInitialized = false;

    private constructor() { }

    static getInstance(): AudioSessionServiceImpl {
        if (!AudioSessionServiceImpl.instance) {
            AudioSessionServiceImpl.instance = new AudioSessionServiceImpl();
        }
        return AudioSessionServiceImpl.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Configuration for expo-audio
            await setAudioModeAsync({
                playsInSilentMode: true,
                allowsRecording: false,
                shouldPlayInBackground: true,
                interruptionMode: 'duckOthers',
                shouldRouteThroughEarpiece: false
            });

            this.isInitialized = true;
            console.log('AudioSessionService initialized (expo-audio)');
        } catch (error) {
            console.error('Failed to initialize AudioSessionService:', error);
        }
    }

    async duckAudio(): Promise<void> {
        try {
            // Ensure our session is active so ducking kicks in
            await setIsAudioActiveAsync(true);

            // Re-assert mode just in case
            await setAudioModeAsync({
                interruptionMode: 'duckOthers',
            });
        } catch (error) {
            console.error('Failed to duck audio:', error);
        }
    }

    async restoreAudio(): Promise<void> {
        try {
            // Deactivate session to let background audio return to full volume
            await setIsAudioActiveAsync(false);
        } catch (error) {
            console.error('Failed to restore audio:', error);
        }
    }
}

export const AudioSessionService = AudioSessionServiceImpl.getInstance();
