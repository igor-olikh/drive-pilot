// import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import Constants from 'expo-constants';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { useDriveStore } from '../../store/driveStore';
import { AudioSessionService } from '../audio/AudioSessionService';

// Safe Import for Voice (Not supported in Expo Go)
let Voice: any = {
    destroy: async () => { },
    removeAllListeners: () => { },
    onSpeechResults: null,
    onSpeechError: null,
    start: async () => { },
    stop: async () => { }
};

try {
    if (Constants.appOwnership !== 'expo') {
        const VoiceModule = require('@react-native-voice/voice');
        Voice = VoiceModule.default || VoiceModule;
    }
} catch (e) {
    console.warn("Voice module failed to load:", e);
}

class VoiceInteractionModuleImpl {
    private static instance: VoiceInteractionModuleImpl;
    private isSpeaking = false;
    private isListening = false;

    private constructor() {
        // Setup Voice Listeners safely
        // Note: Voice might be our mock here, which is fine
        if (Voice && typeof Voice.onSpeechResults !== 'undefined') {
            // We bind listeners in listenForResponse mostly, but good to have safety
        }
    }

    static getInstance(): VoiceInteractionModuleImpl {
        if (!VoiceInteractionModuleImpl.instance) {
            VoiceInteractionModuleImpl.instance = new VoiceInteractionModuleImpl();
        }
        return VoiceInteractionModuleImpl.instance;
    }

    async speak(text: string): Promise<void> {
        try {
            if (this.isSpeaking) await this.stopSpeaking();
            if (this.isListening) await this.stopListening();

            this.isSpeaking = true;
            useDriveStore.getState().setVoiceStatus('speaking');

            await AudioSessionService.initialize();
            await AudioSessionService.duckAudio();

            return new Promise((resolve, reject) => {
                const options: Speech.SpeechOptions = {
                    language: 'en-US',
                    pitch: 1.0,
                    rate: Platform.OS === 'ios' ? 0.5 : 0.9,
                    onDone: () => {
                        this.handleSpeechFinish(resolve);
                    },
                    onStopped: () => {
                        this.handleSpeechFinish(resolve);
                    },
                    onError: (e) => {
                        this.isSpeaking = false;
                        useDriveStore.getState().setVoiceStatus('idle');
                        AudioSessionService.restoreAudio();
                        reject(e);
                    }
                };
                Speech.speak(text, options);
            });
        } catch (e) {
            console.error('TTS Failed:', e);
            useDriveStore.getState().setVoiceStatus('idle');
        }
    }

    private handleSpeechFinish(resolve: Function) {
        this.isSpeaking = false;
        useDriveStore.getState().setVoiceStatus('idle');
        // Note: We do NOT restore AudioSession here if we plan to listen immediately.
        // But for safety/simplicity in this iteration, we restore.
        // The Engine will just re-duck if it calls listen().
        AudioSessionService.restoreAudio();
        resolve();
    }

    async listenForResponse(timeoutMs = 5000): Promise<string | null> {
        try {
            if (this.isSpeaking) await this.stopSpeaking();
            if (this.isListening) await this.stopListening();

            this.isListening = true;
            useDriveStore.getState().setVoiceStatus('listening');

            // Ensure audio is ducked so mic can hear us (and context feels continuous)
            await AudioSessionService.duckAudio();

            return new Promise((resolve) => {
                let hasResolved = false;

                const safeResolve = (val: string | null) => {
                    if (!hasResolved) {
                        hasResolved = true;
                        this.cleanupListeners();
                        this.isListening = false;
                        useDriveStore.getState().setVoiceStatus('processing');
                        AudioSessionService.restoreAudio();
                        resolve(val);
                    }
                };

                // Handlers
                const onSpeechResults = (e: any) => {
                    const text = e.value?.[0];
                    console.log('Voice Heard:', text);
                    if (text) {
                        safeResolve(text);
                    }
                };

                const onSpeechError = (e: any) => {
                    console.log('Voice Listen Error/NoInput:', e);
                    safeResolve(null);
                };

                // Bind
                Voice.onSpeechResults = onSpeechResults;
                Voice.onSpeechError = onSpeechError;

                // Start
                Voice.start('en-US');

                // Timeout
                setTimeout(() => {
                    if (!hasResolved) {
                        console.log('Voice Timeout');
                        safeResolve(null);
                    }
                }, timeoutMs);
            });

        } catch (e) {
            console.error('Listen Failed:', e);
            this.isListening = false;
            useDriveStore.getState().setVoiceStatus('idle');
            await AudioSessionService.restoreAudio();
            return null;
        }
    }

    async stopSpeaking(): Promise<void> {
        await Speech.stop();
        this.isSpeaking = false;
    }

    async stopListening(): Promise<void> {
        await Voice.stop();
        await Voice.destroy();
        this.cleanupListeners();
        this.isListening = false;
    }

    private cleanupListeners() {
        Voice.removeAllListeners();
    }
}

export const VoiceInteractionModule = VoiceInteractionModuleImpl.getInstance();
