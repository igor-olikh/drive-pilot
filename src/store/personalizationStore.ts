import { create } from 'zustand';

// Define available user goals
export type UserGoal = 'learn_english' | 'listen_news' | 'mindfulness';

interface PersonalizationState {
    // Current active goals
    goals: UserGoal[];

    // Last time we intervened (greeted the user)
    lastInterventionTime: number;

    // Interaction style
    interventionMode: 'polite' | 'proactive';

    // Actions
    addGoal: (goal: UserGoal) => void;
    removeGoal: (goal: UserGoal) => void;
    setLastIntervention: (time: number) => void;
    setInterventionMode: (mode: 'polite' | 'proactive') => void;
}

export const usePersonalizationStore = create<PersonalizationState>((set) => ({
    goals: ['learn_english'], // Default goal for now
    lastInterventionTime: 0,
    interventionMode: 'polite',

    addGoal: (goal) => set((state) => ({
        goals: state.goals.includes(goal) ? state.goals : [...state.goals, goal]
    })),

    removeGoal: (goal) => set((state) => ({
        goals: state.goals.filter(g => g !== goal)
    })),

    setLastIntervention: (time) => set({ lastInterventionTime: time }),

    setInterventionMode: (mode) => set({ interventionMode: mode })
}));
