/**
 * GPS Listener Placeholder
 * 
 * This module will handle:
 * - Background location tracking using expo-location
 * - Adaptive accuracy modes (monitoring, driving, paused)
 * - Speed and heading calculation
 * - Background task registration via expo-task-manager
 */

import type { GPSListenerState, LocationData, TrackingMode } from '../types';

// Background task name for location tracking
export const LOCATION_TASK_NAME = 'DRIVEPILOT_LOCATION_TRACKING';

export interface GPSListenerConfig {
    /** Accuracy for monitoring mode (significant changes only) */
    monitoringAccuracy: number;
    /** Accuracy for driving mode (high precision) */
    drivingAccuracy: number;
    /** Accuracy for paused mode (medium precision) */
    pausedAccuracy: number;
    /** Update interval in ms for driving mode */
    drivingInterval: number;
    /** Update interval in ms for paused mode */
    pausedInterval: number;
    /** Distance filter in meters for driving mode */
    drivingDistanceFilter: number;
}

export const DEFAULT_GPS_CONFIG: GPSListenerConfig = {
    monitoringAccuracy: 3000,    // 3km (significant changes)
    drivingAccuracy: 10,         // 10m (high precision)
    pausedAccuracy: 100,         // 100m (medium)
    drivingInterval: 5000,       // 5 seconds
    pausedInterval: 30000,       // 30 seconds
    drivingDistanceFilter: 10,   // 10 meters
};

/**
 * GPSListener - Manages GPS location tracking
 * 
 * TODO: Implement the following methods
 * - initialize(): Request permissions and set up
 * - startBackgroundTracking(): Register background task
 * - stopBackgroundTracking(): Unregister task
 * - setTrackingMode(): Change accuracy/interval
 * - getCurrentLocation(): Get current position
 * - onLocationUpdate: Event handler for new positions
 */
export class GPSListener {
    private static instance: GPSListener | null = null;
    private config: GPSListenerConfig;
    private state: GPSListenerState;
    private locationCallback: ((location: LocationData) => void) | null = null;

    private constructor(config: Partial<GPSListenerConfig> = {}) {
        this.config = { ...DEFAULT_GPS_CONFIG, ...config };
        this.state = {
            isTracking: false,
            currentMode: 'monitoring',
            lastLocation: null,
            lastError: null,
        };
    }

    static getInstance(config?: Partial<GPSListenerConfig>): GPSListener {
        if (!GPSListener.instance) {
            GPSListener.instance = new GPSListener(config);
        }
        return GPSListener.instance;
    }

    getState(): GPSListenerState {
        return { ...this.state };
    }

    setLocationCallback(callback: (location: LocationData) => void): void {
        this.locationCallback = callback;
    }

    // Placeholder methods - to be implemented
    async initialize(): Promise<void> {
        throw new Error('Not implemented');
    }

    async startBackgroundTracking(): Promise<void> {
        throw new Error('Not implemented');
    }

    async stopBackgroundTracking(): Promise<void> {
        throw new Error('Not implemented');
    }

    setTrackingMode(mode: TrackingMode): void {
        this.state.currentMode = mode;
        // TODO: Update location accuracy and interval based on mode
    }

    async getCurrentLocation(): Promise<LocationData> {
        throw new Error('Not implemented');
    }
}

export default GPSListener;
