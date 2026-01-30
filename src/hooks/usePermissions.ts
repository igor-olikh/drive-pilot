/**
 * usePermissions Hook
 * 
 * React hook for managing DrivePilot permissions in UI components
 */

import { useCallback, useEffect, useState } from 'react';
import {
    PermissionResult,
    PermissionService,
    PermissionState,
    PermissionType,
} from '../services/permissions';

export interface UsePermissionsReturn {
    /** Current permission state */
    state: PermissionState | null;
    /** Whether permissions are being checked/requested */
    loading: boolean;
    /** Whether all required permissions are granted */
    allGranted: boolean;
    /** Check all permissions */
    refresh: () => Promise<void>;
    /** Request all permissions */
    requestAll: () => Promise<PermissionState>;
    /** Request a specific permission */
    request: (permission: PermissionType) => Promise<PermissionResult>;
    /** Open app settings */
    openSettings: () => Promise<void>;
    /** Show settings alert for a denied permission */
    showSettingsAlert: (permission: PermissionType) => Promise<boolean>;
    /** Check if location services are enabled */
    isLocationEnabled: () => Promise<boolean>;
    /** Check if Bluetooth is enabled */
    isBluetoothEnabled: () => Promise<boolean>;
}

/**
 * Hook for managing permissions
 */
export function usePermissions(): UsePermissionsReturn {
    const [state, setState] = useState<PermissionState | null>(null);
    const [loading, setLoading] = useState(true);

    // Calculate if all required permissions are granted
    const allGranted = state
        ? state.location_foreground === 'granted' &&
        state.location_background === 'granted' &&
        state.bluetooth === 'granted'
        : false;

    // Initialize and check permissions on mount
    useEffect(() => {
        const init = async () => {
            try {
                await PermissionService.initialize();
                const permissionState = await PermissionService.checkAllPermissions();
                setState(permissionState);
            } catch (error) {
                console.error('Error initializing permissions:', error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // Refresh permission state
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const permissionState = await PermissionService.checkAllPermissions();
            setState(permissionState);
        } catch (error) {
            console.error('Error refreshing permissions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Request all permissions
    const requestAll = useCallback(async (): Promise<PermissionState> => {
        setLoading(true);
        try {
            const permissionState = await PermissionService.requestAllPermissions();
            setState(permissionState);
            return permissionState;
        } catch (error) {
            console.error('Error requesting permissions:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Request specific permission
    const request = useCallback(async (permission: PermissionType): Promise<PermissionResult> => {
        setLoading(true);
        try {
            let result: PermissionResult;

            switch (permission) {
                case 'location_foreground':
                    result = await PermissionService.requestLocationForeground();
                    break;
                case 'location_background':
                    result = await PermissionService.requestLocationBackground();
                    break;
                case 'bluetooth':
                    result = await PermissionService.requestBluetooth();
                    break;
                case 'notifications':
                    result = await PermissionService.requestNotifications();
                    break;
            }

            // Update state
            await refresh();

            return result;
        } catch (error) {
            console.error('Error requesting permission:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [refresh]);

    // Open settings
    const openSettings = useCallback(async () => {
        await PermissionService.openAppSettings();
    }, []);

    // Show settings alert
    const showSettingsAlert = useCallback(async (permission: PermissionType): Promise<boolean> => {
        const description = PermissionService.getPermissionDescription(permission);
        const reason = PermissionService.getPermissionReason(permission);
        return PermissionService.showSettingsAlert(description, reason);
    }, []);

    // Check location services
    const isLocationEnabled = useCallback(async (): Promise<boolean> => {
        return PermissionService.isLocationServicesEnabled();
    }, []);

    // Check Bluetooth
    const isBluetoothEnabled = useCallback(async (): Promise<boolean> => {
        return PermissionService.isBluetoothEnabled();
    }, []);

    return {
        state,
        loading,
        allGranted,
        refresh,
        requestAll,
        request,
        openSettings,
        showSettingsAlert,
        isLocationEnabled,
        isBluetoothEnabled,
    };
}

export default usePermissions;
