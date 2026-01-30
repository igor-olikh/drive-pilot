import { create } from 'zustand';

interface DriveState {
    isDriving: boolean;
    isBluetoothConnected: boolean;
    isMoving: boolean;
    currentSessionId: string | null;
    voiceStatus: 'idle' | 'speaking' | 'listening' | 'processing';

    // Actions
    setBluetoothConnected: (connected: boolean) => void;
    setMoving: (moving: boolean) => void;
    setVoiceStatus: (status: 'idle' | 'speaking' | 'listening' | 'processing') => void;
    startDrive: () => void;
    stopDrive: () => void;
}

export const useDriveStore = create<DriveState>((set, get) => ({
    isDriving: false,
    isBluetoothConnected: false,
    isMoving: false,
    currentSessionId: null,
    voiceStatus: 'idle',

    setBluetoothConnected: (connected) => {
        set({ isBluetoothConnected: connected });
        const { isMoving, isDriving } = get();
        // Ignition Rule: If car connected, we are likely driving
        if (connected && !isDriving) {
            get().startDrive();
        }
    },

    setMoving: (moving) => {
        set({ isMoving: moving });
        const { isBluetoothConnected, isDriving } = get();
        // Ignition Rule: If moving fast enough, we are driving
        if (moving && !isDriving) {
            get().startDrive();
        }
    },

    setVoiceStatus: (status) => set({ voiceStatus: status }),

    startDrive: () => set({
        isDriving: true,
        currentSessionId: Date.now().toString()
    }),

    stopDrive: () => set({
        isDriving: false,
        currentSessionId: null,
        voiceStatus: 'idle'
    }),
}));
