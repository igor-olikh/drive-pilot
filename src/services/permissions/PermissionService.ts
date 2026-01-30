/**
 * Permission Service
 * 
 * Handles all runtime permissions for DrivePilot:
 * - Location (foreground + background)
 * - Bluetooth (iOS: always, Android: SCAN + CONNECT)
 * - Notifications (for driving alerts)
 * 
 * Cross-platform implementation for iOS and Android
 */

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// ============================================================================
// Types
// ============================================================================

export type PermissionType =
    | 'location_foreground'
    | 'location_background'
    | 'bluetooth'
    | 'notifications';

export type PermissionStatus =
    | 'granted'
    | 'denied'
    | 'undetermined'
    | 'restricted'   // iOS only - parental controls
    | 'unavailable'; // Hardware not available

export interface PermissionState {
    location_foreground: PermissionStatus;
    location_background: PermissionStatus;
    bluetooth: PermissionStatus;
    notifications: PermissionStatus;
}

export interface PermissionResult {
    permission: PermissionType;
    status: PermissionStatus;
    canAskAgain: boolean;
}

// ============================================================================
// Permission Service
// ============================================================================

class PermissionServiceImpl {
    private static instance: PermissionServiceImpl | null = null;
    private bleManager: BleManager | null = null;
    private cachedState: PermissionState | null = null;

    private constructor() { }

    static getInstance(): PermissionServiceImpl {
        if (!PermissionServiceImpl.instance) {
            PermissionServiceImpl.instance = new PermissionServiceImpl();
        }
        return PermissionServiceImpl.instance;
    }

    /**
     * Initialize the permission service
     */
    async initialize(): Promise<void> {
        // Initialize BLE manager for Bluetooth permission checks
        this.bleManager = new BleManager();

        // Get initial state
        await this.checkAllPermissions();
    }

    /**
     * Destroy the service and clean up resources
     */
    destroy(): void {
        if (this.bleManager) {
            this.bleManager.destroy();
            this.bleManager = null;
        }
        this.cachedState = null;
    }

    // ==========================================================================
    // Check Permissions
    // ==========================================================================

    /**
     * Check all permissions and return current state
     */
    async checkAllPermissions(): Promise<PermissionState> {
        const [
            locationForeground,
            locationBackground,
            bluetooth,
            notifications,
        ] = await Promise.all([
            this.checkLocationForeground(),
            this.checkLocationBackground(),
            this.checkBluetooth(),
            this.checkNotifications(),
        ]);

        this.cachedState = {
            location_foreground: locationForeground.status,
            location_background: locationBackground.status,
            bluetooth: bluetooth.status,
            notifications: notifications.status,
        };

        return this.cachedState;
    }

    /**
     * Get cached permission state (call checkAllPermissions first)
     */
    getCachedState(): PermissionState | null {
        return this.cachedState;
    }

    /**
     * Check foreground location permission
     */
    async checkLocationForeground(): Promise<PermissionResult> {
        try {
            const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
            return {
                permission: 'location_foreground',
                status: this.mapExpoStatus(status),
                canAskAgain,
            };
        } catch (error) {
            console.error('Error checking foreground location:', error);
            return {
                permission: 'location_foreground',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    /**
     * Check background location permission
     */
    async checkLocationBackground(): Promise<PermissionResult> {
        try {
            const { status, canAskAgain } = await Location.getBackgroundPermissionsAsync();
            return {
                permission: 'location_background',
                status: this.mapExpoStatus(status),
                canAskAgain,
            };
        } catch (error) {
            console.error('Error checking background location:', error);
            return {
                permission: 'location_background',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    /**
     * Check Bluetooth permission
     * iOS: Uses Bluetooth Always permission
     * Android: Combines BLUETOOTH_SCAN and BLUETOOTH_CONNECT (API 31+)
     */
    async checkBluetooth(): Promise<PermissionResult> {
        try {
            if (!this.bleManager) {
                return {
                    permission: 'bluetooth',
                    status: 'unavailable',
                    canAskAgain: false,
                };
            }

            // Check BLE state
            const state = await this.bleManager.state();

            if (state === 'PoweredOn') {
                return {
                    permission: 'bluetooth',
                    status: 'granted',
                    canAskAgain: false,
                };
            } else if (state === 'PoweredOff') {
                // Bluetooth is off but permission might be granted
                return {
                    permission: 'bluetooth',
                    status: 'granted', // We have permission, just need to turn on BT
                    canAskAgain: false,
                };
            } else if (state === 'Unauthorized') {
                return {
                    permission: 'bluetooth',
                    status: 'denied',
                    canAskAgain: true,
                };
            } else if (state === 'Unsupported') {
                return {
                    permission: 'bluetooth',
                    status: 'unavailable',
                    canAskAgain: false,
                };
            } else {
                // Unknown or Resetting
                return {
                    permission: 'bluetooth',
                    status: 'undetermined',
                    canAskAgain: true,
                };
            }
        } catch (error) {
            console.error('Error checking Bluetooth permission:', error);
            return {
                permission: 'bluetooth',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    /**
     * Check notification permission
     */
    async checkNotifications(): Promise<PermissionResult> {
        try {
            const { status, canAskAgain } = await Notifications.getPermissionsAsync();
            return {
                permission: 'notifications',
                status: this.mapExpoStatus(status),
                canAskAgain,
            };
        } catch (error) {
            console.error('Error checking notifications:', error);
            return {
                permission: 'notifications',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    // ==========================================================================
    // Request Permissions
    // ==========================================================================

    /**
     * Request all required permissions in sequence
     * Returns final state after all requests
     */
    async requestAllPermissions(): Promise<PermissionState> {
        // Request in order of importance and dependency
        // 1. Foreground location (required before background)
        await this.requestLocationForeground();

        // 2. Background location (requires foreground first)
        await this.requestLocationBackground();

        // 3. Bluetooth
        await this.requestBluetooth();

        // 4. Notifications
        await this.requestNotifications();

        // Return final state
        return this.checkAllPermissions();
    }

    /**
     * Request foreground location permission
     */
    async requestLocationForeground(): Promise<PermissionResult> {
        try {
            const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
            const result: PermissionResult = {
                permission: 'location_foreground',
                status: this.mapExpoStatus(status),
                canAskAgain,
            };

            if (this.cachedState) {
                this.cachedState.location_foreground = result.status;
            }

            return result;
        } catch (error) {
            console.error('Error requesting foreground location:', error);
            return {
                permission: 'location_foreground',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    /**
     * Request background location permission
     * Must be called after foreground location is granted
     */
    async requestLocationBackground(): Promise<PermissionResult> {
        try {
            // Check if foreground is granted first
            const foreground = await this.checkLocationForeground();
            if (foreground.status !== 'granted') {
                console.warn('Cannot request background location without foreground permission');
                return {
                    permission: 'location_background',
                    status: 'denied',
                    canAskAgain: true,
                };
            }

            const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
            const result: PermissionResult = {
                permission: 'location_background',
                status: this.mapExpoStatus(status),
                canAskAgain,
            };

            if (this.cachedState) {
                this.cachedState.location_background = result.status;
            }

            return result;
        } catch (error) {
            console.error('Error requesting background location:', error);
            return {
                permission: 'location_background',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    /**
     * Request Bluetooth permission
     * On Android 12+, this also requests nearby devices permission
     */
    async requestBluetooth(): Promise<PermissionResult> {
        try {
            if (!this.bleManager) {
                this.bleManager = new BleManager();
            }

            // On iOS, BLE permission is requested automatically on first scan
            // On Android 12+, we need explicit permission
            if (Platform.OS === 'android' && Platform.Version >= 31) {
                // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
                // react-native-ble-plx handles this through the scan operation
                // We'll trigger a short scan to prompt for permission
                try {
                    await new Promise<void>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            this.bleManager?.stopDeviceScan();
                            resolve();
                        }, 100);

                        this.bleManager?.startDeviceScan(null, null, (error) => {
                            if (error) {
                                clearTimeout(timeout);
                                reject(error);
                            }
                        });
                    });
                } catch (scanError) {
                    // Permission denied during scan attempt
                    console.log('Bluetooth scan permission denied:', scanError);
                }
            }

            // Check final state
            return this.checkBluetooth();
        } catch (error) {
            console.error('Error requesting Bluetooth permission:', error);
            return {
                permission: 'bluetooth',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    /**
     * Request notification permission
     */
    async requestNotifications(): Promise<PermissionResult> {
        try {
            const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
            const result: PermissionResult = {
                permission: 'notifications',
                status: this.mapExpoStatus(status),
                canAskAgain,
            };

            if (this.cachedState) {
                this.cachedState.notifications = result.status;
            }

            return result;
        } catch (error) {
            console.error('Error requesting notifications:', error);
            return {
                permission: 'notifications',
                status: 'unavailable',
                canAskAgain: false,
            };
        }
    }

    // ==========================================================================
    // Settings Navigation
    // ==========================================================================

    /**
     * Open app settings (for when user needs to manually enable permissions)
     */
    async openAppSettings(): Promise<void> {
        try {
            await Linking.openSettings();
        } catch (error) {
            console.error('Error opening settings:', error);
        }
    }

    /**
     * Show alert prompting user to enable permission in settings
     */
    showSettingsAlert(
        permissionName: string,
        reason: string,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            Alert.alert(
                `${permissionName} Permission Required`,
                `${reason}\n\nPlease enable ${permissionName} in Settings to continue.`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(false),
                    },
                    {
                        text: 'Open Settings',
                        onPress: async () => {
                            await this.openAppSettings();
                            resolve(true);
                        },
                    },
                ],
            );
        });
    }

    // ==========================================================================
    // Convenience Methods
    // ==========================================================================

    /**
     * Check if all required permissions for driving detection are granted
     */
    async hasRequiredPermissions(): Promise<boolean> {
        const state = await this.checkAllPermissions();
        return (
            state.location_foreground === 'granted' &&
            state.location_background === 'granted' &&
            state.bluetooth === 'granted'
        );
    }

    /**
     * Check if location services are enabled on the device
     */
    async isLocationServicesEnabled(): Promise<boolean> {
        try {
            return await Location.hasServicesEnabledAsync();
        } catch (error) {
            console.error('Error checking location services:', error);
            return false;
        }
    }

    /**
     * Check if Bluetooth is powered on
     */
    async isBluetoothEnabled(): Promise<boolean> {
        try {
            if (!this.bleManager) {
                return false;
            }
            const state = await this.bleManager.state();
            return state === 'PoweredOn';
        } catch (error) {
            console.error('Error checking Bluetooth state:', error);
            return false;
        }
    }

    /**
     * Get human-readable description for a permission
     */
    getPermissionDescription(permission: PermissionType): string {
        switch (permission) {
            case 'location_foreground':
                return 'Location access while using the app';
            case 'location_background':
                return 'Location access in the background to track drives automatically';
            case 'bluetooth':
                return 'Bluetooth access to detect your car connection';
            case 'notifications':
                return 'Notifications to alert you during drives';
        }
    }

    /**
     * Get the reason why a permission is needed
     */
    getPermissionReason(permission: PermissionType): string {
        switch (permission) {
            case 'location_foreground':
                return 'DrivePilot needs location access to detect when you start driving.';
            case 'location_background':
                return 'DrivePilot needs background location to track your drives even when the app is closed.';
            case 'bluetooth':
                return 'DrivePilot uses Bluetooth to detect when you connect to your car.';
            case 'notifications':
                return 'DrivePilot sends notifications to keep you informed during drives.';
        }
    }

    // ==========================================================================
    // Private Helpers
    // ==========================================================================

    /**
     * Map Expo permission status to our PermissionStatus type
     */
    private mapExpoStatus(status: Location.PermissionStatus | Notifications.PermissionStatus): PermissionStatus {
        switch (status) {
            case 'granted':
                return 'granted';
            case 'denied':
                return 'denied';
            case 'undetermined':
                return 'undetermined';
            default:
                return 'undetermined';
        }
    }
}

// Export singleton instance
export const PermissionService = PermissionServiceImpl.getInstance();

// Export class for testing
export { PermissionServiceImpl };

export default PermissionService;
