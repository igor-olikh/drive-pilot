import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { AudioSessionService } from '../audio/AudioSessionService';

class VoiceInteractionModuleImpl {
    private static instance: VoiceInteractionModuleImpl;
    private isSpeaking = false;

    private constructor() { }

    static getInstance(): VoiceInteractionModuleImpl {
        if (!VoiceInteractionModuleImpl.instance) {
            VoiceInteractionModuleImpl.instance = new VoiceInteractionModuleImpl();
        }
        return VoiceInteractionModuleImpl.instance;
    }

    async speak(text: string): Promise<void> {
        if (this.isSpeaking) {
            await this.stop();
        }

        this.isSpeaking = true;

        // Ensure audio session is ready and ducking is enabled
        await AudioSessionService.initialize();
        await AudioSessionService.duckAudio();

        return new Promise((resolve, reject) => {
            const options: Speech.SpeechOptions = {
                language: 'en-US',
                pitch: 1.0,
                rate: Platform.OS === 'ios' ? 0.5 : 0.9, // Adjust rate for natural feel
                onDone: () => {
                    this.isSpeaking = false;
                    AudioSessionService.restoreAudio();
                    resolve();
                },
                onStopped: () => {
                    this.isSpeaking = false;
                    AudioSessionService.restoreAudio();
                    resolve();
                },
                onError: (error) => {
                    this.isSpeaking = false;
                    AudioSessionService.restoreAudio();
                    console.error('TTS Error:', error);
                    reject(error);
                },
            };

            Speech.speak(text, options);
        });
    }

    async stop(): Promise<void> {
        if (this.isSpeaking) {
            await Speech.stop();
            this.isSpeaking = false;
            await AudioSessionService.restoreAudio();
        }
    }

    /**
     * Future hook for Gemini Live / Cloud TTS
     */
    async speakCloud(text: string): Promise<void> {
        // Placeholder for swapping logic later
        return this.speak(text);
    }
}

export const VoiceInteractionModule = VoiceInteractionModuleImpl.getInstance();
