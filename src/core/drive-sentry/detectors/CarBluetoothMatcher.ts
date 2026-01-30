/**
 * Car Bluetooth Matcher Placeholder
 * 
 * This module will handle:
 * - Matching Bluetooth device names to car patterns
 * - Managing user-tagged car devices
 * - Heuristic detection of car Bluetooth devices
 */

import type { BluetoothDevice, CarDevice } from '../types';

// Re-export patterns for convenience
export { CAR_BLUETOOTH_PATTERNS } from '../types';

/**
 * CarBluetoothMatcher - Identifies car Bluetooth devices
 */
export class CarBluetoothMatcher {
    private static instance: CarBluetoothMatcher | null = null;
    private manuallyTaggedDevices: Map<string, CarDevice> = new Map();

    private constructor() { }

    static getInstance(): CarBluetoothMatcher {
        if (!CarBluetoothMatcher.instance) {
            CarBluetoothMatcher.instance = new CarBluetoothMatcher();
        }
        return CarBluetoothMatcher.instance;
    }

    /**
     * Check if a device is a car based on:
     * 1. Manually tagged by user
     * 2. Name matches common car patterns
     */
    isCarDevice(device: BluetoothDevice): boolean {
        // Check manual tags first
        if (this.manuallyTaggedDevices.has(device.id)) {
            return true;
        }

        // Check name patterns
        return this.matchesCarPattern(device.name);
    }

    /**
     * Check if device name matches any car pattern
     */
    matchesCarPattern(deviceName: string): boolean {
        const patterns: RegExp[] = [
            /car/i,
            /auto/i,
            /sync/i,
            /carplay/i,
            /android auto/i,
            /handsfree/i,
            /vehicle/i,
            // Common car manufacturers
            /honda/i,
            /toyota/i,
            /ford/i,
            /bmw/i,
            /mercedes/i,
            /audi/i,
            /volkswagen/i,
            /chevrolet/i,
            /nissan/i,
            /hyundai/i,
            /kia/i,
            /mazda/i,
            /subaru/i,
            /lexus/i,
            /jeep/i,
            /tesla/i,
        ];

        return patterns.some(pattern => pattern.test(deviceName));
    }

    /**
     * Manually tag a device as a car
     */
    tagAsCarDevice(device: BluetoothDevice): CarDevice {
        const carDevice: CarDevice = {
            id: device.id,
            name: device.name,
            type: 'manual',
            lastConnected: new Date(),
            createdAt: new Date(),
        };

        this.manuallyTaggedDevices.set(device.id, carDevice);

        // TODO: Persist to database

        return carDevice;
    }

    /**
     * Remove car tag from device
     */
    untagCarDevice(deviceId: string): boolean {
        return this.manuallyTaggedDevices.delete(deviceId);
    }

    /**
     * Get all tagged car devices
     */
    getTaggedDevices(): CarDevice[] {
        return Array.from(this.manuallyTaggedDevices.values());
    }

    /**
     * Load tagged devices from storage
     */
    async loadTaggedDevices(): Promise<void> {
        // TODO: Load from database
    }
}

export default CarBluetoothMatcher;
