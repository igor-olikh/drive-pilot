import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

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
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                // Vital for ducking: allow mixing with other apps
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                playThroughEarpieceAndroid: false,
            });
            this.isInitialized = true;
            console.log('AudioSessionService initialized');
        } catch (error) {
            console.error('Failed to initialize AudioSessionService:', error);
        }
    }

    /**
     * Configure audio session to "duck" other apps (lower their volume)
     * This happens automatically with the config above when we play sound,
     * but we ensure the mode is set correctly just in case.
     */
    async duckAudio(): Promise<void> {
        try {
            await Audio.setAudioModeAsync({
                interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                shouldDuckAndroid: true,
            });
        } catch (error) {
            console.error('Failed to duck audio:', error);
        }
    }

    /**
     * Restore audio session to allow other apps to resume full volume
     * We do this by effectively "releasing" our claim or resetting mode if needed.
     * Note: In many cases, just stopping playback stops ducking, but explicit control is safer.
     */
    async restoreAudio(): Promise<void> {
        // No specific API to "unduck" without stopping playback usually,
        // but confirming the mode is often enough. 
        // real restoration happens when our TTS stops playing.
    }
}

export const AudioSessionService = AudioSessionServiceImpl.getInstance();
