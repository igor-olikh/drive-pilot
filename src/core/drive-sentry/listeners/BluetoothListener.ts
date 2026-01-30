/**
 * Bluetooth Listener Placeholder
 * 
 * This module will handle:
 * - BLE scanning for car devices using react-native-ble-plx
 * - Monitoring Bluetooth state changes
 * - Detecting car device connections/disconnections
 * - Running as a background task via expo-task-manager
 */

import { BleManager } from 'react-native-ble-plx';
import type { BluetoothDevice, BluetoothListenerState } from '../types';

// Background task name for Bluetooth monitoring
export const BLUETOOTH_TASK_NAME = 'DRIVEPILOT_BLUETOOTH_MONITORING';

export interface BluetoothListenerConfig {
    /** Known car device IDs to monitor */
    knownCarDevices: string[];
    /** Scan interval in ms when in monitoring mode */
    scanInterval: number;
    /** How long to scan each cycle in ms */
    scanDuration: number;
}

export const DEFAULT_BLUETOOTH_CONFIG: BluetoothListenerConfig = {
    knownCarDevices: [],
    scanInterval: 30000,  // 30 seconds
    scanDuration: 5000,   // 5 seconds
};

/**
 * BluetoothListener - Manages Bluetooth device detection
 * 
 * TODO: Implement the following methods
 * - initialize(): Set up BLE manager
 * - startListening(): Begin background scanning
 * - stopListening(): Stop scanning
 * - getConnectedDevices(): Query connected devices
 * - isCarConnected(): Check if any car is connected
 * - onDeviceConnected/Disconnected: Event handlers
 */
export class BluetoothListener {
    private static instance: BluetoothListener | null = null;
    private config: BluetoothListenerConfig;
    private state: BluetoothListenerState;
    private bleManager: BleManager | null = null;

    private constructor(config: Partial<BluetoothListenerConfig> = {}) {
        this.config = { ...DEFAULT_BLUETOOTH_CONFIG, ...config };
        this.state = {
            isScanning: false,
            connectedDevices: [],
            lastError: null,
        };
    }

    static getInstance(config?: Partial<BluetoothListenerConfig>): BluetoothListener {
        if (!BluetoothListener.instance) {
            BluetoothListener.instance = new BluetoothListener(config);
        }
        return BluetoothListener.instance;
    }

    getState(): BluetoothListenerState {
        return { ...this.state };
    }

    async initialize(): Promise<void> {
        if (!this.bleManager) {
            this.bleManager = new BleManager();
        }
    }

    async startListening(): Promise<void> {
        this.state.isScanning = true;
        console.log('Starting Bluetooth scanning...');

        // Scan for devices
        this.bleManager?.startDeviceScan(
            null, // UUIDs to scan for (null = all)
            { allowDuplicates: false },
            (error, device) => {
                if (error) {
                    console.warn('BLE Scan Error:', error);
                    // Don't throw, just log. BLE can be flaky.
                    return;
                }

                if (device && device.name) {
                    // Check if it's a car
                    // For now, simple check. Later: use CarBluetoothMatcher
                    const isCar = /car|auto|sync|handsfree/i.test(device.name);

                    if (isCar) {
                        console.log('Car Bluetooth detected:', device.name);
                        // In a real app, we'd connect. For "Ignition" logic, 
                        // detection can be enough to trigger 'likely driving' 
                        // if signal is strong, but connection is better.
                        // Simulating connection event for this phase:
                        this.onDeviceConnected({
                            id: device.id,
                            name: device.name,
                            isCarDevice: true,
                            lastSeen: new Date()
                        });
                    }
                }
            }
        );
    }

    async stopListening(): Promise<void> {
        this.bleManager?.stopDeviceScan();
        this.state.isScanning = false;
        console.log('Stopped Bluetooth scanning');
    }

    async getConnectedDevices(): Promise<BluetoothDevice[]> {
        throw new Error('Not implemented');
    }

    isCarConnected(): boolean {
        return this.state.connectedDevices.some(d => d.isCarDevice);
    }

    // Helper to trigger state update
    private onDeviceConnected(device: BluetoothDevice) {
        // Logic to update DriveStore would go here (via orchestrator or direct)
        // For this phase, we update local state
        this.state.connectedDevices.push(device);
    }
}

export default BluetoothListener;
