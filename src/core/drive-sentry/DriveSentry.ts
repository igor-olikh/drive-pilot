/**
 * DriveSentry - Main Orchestrator
 * 
 * Central controller that coordinates:
 * - BluetoothListener for car detection
 * - GPSListener for location tracking
 * - DrivingDetector for movement analysis
 * - SessionManager for session lifecycle
 */

import type {
    BluetoothDevice,
    DriveSentryEvent,
    DriveSentryEventHandler,
    DriveSentryState,
    DriveSentryStatus,
    LocationData,
} from './types';

import { CarBluetoothMatcher } from './detectors/CarBluetoothMatcher';
import { DrivingDetector } from './detectors/DrivingDetector';
import { BluetoothListener } from './listeners/BluetoothListener';
import { GPSListener } from './listeners/GPSListener';
import { SessionManager } from './session/SessionManager';

/**
 * DriveSentry - The main background service orchestrator
 * 
 * Lifecycle:
 * 1. initialize() - Request permissions, set up listeners
 * 2. start() - Begin monitoring for driving triggers
 * 3. stop() - Stop all background services
 * 
 * Events emitted:
 * - BLUETOOTH_CONNECTED/DISCONNECTED
 * - LOCATION_UPDATE
 * - DRIVING_DETECTED/PAUSED/RESUMED
 * - SESSION_STARTED/ENDED
 * - ERROR
 */
export class DriveSentry {
    private static instance: DriveSentry | null = null;

    // Dependencies
    private bluetoothListener: BluetoothListener;
    private gpsListener: GPSListener;
    private drivingDetector: DrivingDetector;
    private carMatcher: CarBluetoothMatcher;
    private sessionManager: SessionManager;

    // State
    private status: DriveSentryStatus = 'idle';
    private eventHandlers: Set<DriveSentryEventHandler> = new Set();
    private isInitialized = false;

    private constructor() {
        this.bluetoothListener = BluetoothListener.getInstance();
        this.gpsListener = GPSListener.getInstance();
        this.drivingDetector = DrivingDetector.getInstance();
        this.carMatcher = CarBluetoothMatcher.getInstance();
        this.sessionManager = SessionManager.getInstance();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): DriveSentry {
        if (!DriveSentry.instance) {
            DriveSentry.instance = new DriveSentry();
        }
        return DriveSentry.instance;
    }

    /**
     * Get current state
     */
    getState(): DriveSentryState {
        return {
            status: this.status,
            bluetooth: this.bluetoothListener.getState(),
            gps: this.gpsListener.getState(),
            currentSession: this.sessionManager.getCurrentSession(),
            lastError: null,
        };
    }

    /**
     * Subscribe to DriveSentry events
     */
    subscribe(handler: DriveSentryEventHandler): () => void {
        this.eventHandlers.add(handler);
        return () => this.eventHandlers.delete(handler);
    }

    /**
     * Emit event to all subscribers
     */
    private emit(event: DriveSentryEvent): void {
        this.eventHandlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error('Event handler error:', error);
            }
        });
    }

    /**
     * Initialize DriveSentry
     * - Request permissions
     * - Set up listeners
     * - Load persisted data
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('DriveSentry already initialized');
            return;
        }

        try {
            // TODO: Request permissions
            // await PermissionService.requestAllPermissions();

            // Initialize listeners
            await this.bluetoothListener.initialize();
            await this.gpsListener.initialize();

            // Load saved car devices
            await this.carMatcher.loadTaggedDevices();

            // Set up GPS callback
            this.gpsListener.setLocationCallback(this.handleLocationUpdate.bind(this));

            this.isInitialized = true;
            console.log('DriveSentry initialized successfully');
        } catch (error) {
            this.emit({ type: 'ERROR', error: error as Error });
            throw error;
        }
    }

    /**
     * Start monitoring for driving triggers
     */
    async start(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('DriveSentry not initialized. Call initialize() first.');
        }

        if (this.status !== 'idle') {
            console.warn('DriveSentry already running');
            return;
        }

        try {
            await this.bluetoothListener.startListening();
            await this.gpsListener.startBackgroundTracking();

            this.status = 'monitoring';
            console.log('DriveSentry started monitoring');
        } catch (error) {
            this.status = 'error';
            this.emit({ type: 'ERROR', error: error as Error });
            throw error;
        }
    }

    /**
     * Stop all monitoring
     */
    async stop(): Promise<void> {
        try {
            // End any active session
            if (this.sessionManager.isSessionActive()) {
                await this.sessionManager.endSession({ type: 'manual' });
            }

            await this.bluetoothListener.stopListening();
            await this.gpsListener.stopBackgroundTracking();

            this.drivingDetector.reset();
            this.status = 'idle';
            console.log('DriveSentry stopped');
        } catch (error) {
            this.emit({ type: 'ERROR', error: error as Error });
            throw error;
        }
    }

    /**
     * Handle incoming location updates from GPS listener
     */
    private handleLocationUpdate(location: LocationData): void {
        this.emit({ type: 'LOCATION_UPDATE', location });

        // Process through driving detector
        const result = this.drivingDetector.processLocation(location);

        // Handle state transitions
        switch (result.state) {
            case 'driving':
                if (this.status !== 'driving') {
                    this.handleDrivingDetected(location);
                } else if (this.sessionManager.isSessionActive()) {
                    this.sessionManager.addWaypoint(location);
                }
                break;

            case 'stationary':
                if (this.status === 'driving') {
                    this.handleDrivingPaused();
                }
                break;
        }
    }

    /**
     * Handle driving detection
     */
    private async handleDrivingDetected(location: LocationData): Promise<void> {
        this.status = 'driving';
        this.emit({ type: 'DRIVING_DETECTED' });

        // Determine trigger
        const trigger = this.bluetoothListener.isCarConnected()
            ? {
                type: 'bluetooth' as const,
                deviceId: 'unknown', // TODO: Get actual device
                deviceName: 'Car',
            }
            : { type: 'gps' as const, location };

        // Start session
        const session = await this.sessionManager.startSession(trigger);
        this.emit({ type: 'SESSION_STARTED', session });

        // Upgrade GPS to high precision
        this.gpsListener.setTrackingMode('driving');
    }

    /**
     * Handle driving pause (temporary stop)
     */
    private handleDrivingPaused(): void {
        this.status = 'paused' as DriveSentryStatus;
        this.emit({ type: 'DRIVING_PAUSED' });

        this.sessionManager.pauseSession();
        this.gpsListener.setTrackingMode('paused');
    }

    /**
     * Handle Bluetooth car connected
     */
    async handleCarConnected(device: BluetoothDevice): Promise<void> {
        this.emit({ type: 'BLUETOOTH_CONNECTED', device });

        // If we're not already driving, this is a strong trigger
        if (this.status === 'monitoring' || this.status === 'idle') {
            this.status = 'detecting';
            this.gpsListener.setTrackingMode('driving');
        }
    }

    /**
     * Handle Bluetooth car disconnected
     */
    async handleCarDisconnected(device: BluetoothDevice): Promise<void> {
        this.emit({ type: 'BLUETOOTH_DISCONNECTED', device });

        // If we're driving and car disconnects, likely trip ended
        if (this.status === 'driving' && this.sessionManager.isSessionActive()) {
            const session = await this.sessionManager.endSession({
                type: 'bluetooth',
                deviceId: device.id,
                deviceName: device.name,
            });

            this.emit({ type: 'SESSION_ENDED', session });
            this.status = 'monitoring';
            this.gpsListener.setTrackingMode('monitoring');
        }
    }

    /**
     * Process location updates from background task
     * Called by expo-task-manager when app is in background
     */
    async processLocationUpdates(locations: LocationData[]): Promise<void> {
        for (const location of locations) {
            this.handleLocationUpdate(location);
        }
    }
}

export default DriveSentry;
