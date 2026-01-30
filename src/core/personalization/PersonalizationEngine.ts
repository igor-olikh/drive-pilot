import { useEffect } from 'react';
import { VoiceInteractionModule } from '../../services/voice/VoiceInteractionModule';
import { useDriveStore } from '../../store/driveStore';
import { usePersonalizationStore } from '../../store/personalizationStore';

/**
 * PersonalizationEngine
 * 
 * "The Brain" that connects driving context to personalization.
 * It is implemented as a React Hook so it can live in the root of the app
 * and react to state changes.
 */
export function usePersonalizationEngine() {
    const isDriving = useDriveStore((state) => state.isDriving);
    const goals = usePersonalizationStore((state) => state.goals);
    const lastInterventionTime = usePersonalizationStore((state) => state.lastInterventionTime);
    const setLastIntervention = usePersonalizationStore((state) => state.setLastIntervention);

    useEffect(() => {
        // Logic: When driving starts
        if (isDriving) {
            handleDriveStart();
        }
    }, [isDriving]);

    const handleDriveStart = async () => {
        const now = Date.now();
        // Don't greet too often (e.g., if drive dropped and reconnected in 5 mins)
        const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

        if (now - lastInterventionTime < COOLDOWN_MS) {
            console.log('Skipping greeting: Cooldown active');
            return;
        }

        // Check goals to formulate greeting
        if (goals.includes('learn_english')) {
            console.log('Triggering Personalization: English Lesson');
            try {
                // Update timestamp first to prevent double-trigger
                setLastIntervention(now);

                // Trigger Voice
                // "Audio Ducking" happens automatically inside speak()
                await VoiceInteractionModule.speak(
                    "Drive detected. Would you like to switch to your English lesson?"
                );
            } catch (error) {
                console.error('Voice Interaction failed:', error);
            }
        }
    };
}
