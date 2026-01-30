/**
 * DriveSentry - Background Services Module
 * Core type definitions for driving detection and session management
 */

// ============================================================================
// Bluetooth Types
// ============================================================================

export interface BluetoothDevice {
  id: string;
  name: string;
  isCarDevice: boolean;
  signalStrength?: number;
  lastSeen: Date;
}

export interface BluetoothListenerState {
  isScanning: boolean;
  connectedDevices: BluetoothDevice[];
  lastError: Error | null;
}

// ============================================================================
// Location Types
// ============================================================================

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;       // m/s
  heading: number | null;     // degrees (0-360)
  timestamp: number;          // Unix ms
}

export type TrackingMode = 'monitoring' | 'driving' | 'paused';

export interface GPSListenerState {
  isTracking: boolean;
  currentMode: TrackingMode;
  lastLocation: LocationData | null;
  lastError: Error | null;
}

// ============================================================================
// Session Types
// ============================================================================

export type SessionTrigger =
  | { type: 'bluetooth'; deviceId: string; deviceName: string }
  | { type: 'gps'; location: LocationData }
  | { type: 'manual' };

export type SessionStatus = 'active' | 'paused' | 'completed';

export interface DriveSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  status: SessionStatus;

  // Triggers
  startTrigger: SessionTrigger;
  endTrigger: SessionTrigger | null;

  // Stats (computed on session end)
  totalDistance: number;       // meters
  totalDuration: number;       // seconds
  averageSpeed: number;        // m/s
  maxSpeed: number;            // m/s

  // Raw data reference
  waypointCount: number;
}

export interface Waypoint extends LocationData {
  id: number;
  sessionId: string;
}

// ============================================================================
// Detection Thresholds
// ============================================================================

export interface DrivingConditions {
  minSpeed: number;            // m/s (default: 5 = ~18 km/h)
  minDuration: number;         // seconds (default: 60)
  minDistance: number;         // meters (default: 200)
  maxStationaryTime: number;   // seconds before "paused" (default: 120)
  sessionEndTimeout: number;   // seconds before "ended" (default: 300)
}

export const DEFAULT_DRIVING_CONDITIONS: DrivingConditions = {
  minSpeed: 5,                 // ~18 km/h
  minDuration: 60,             // 1 minute
  minDistance: 200,            // 200 meters
  maxStationaryTime: 120,      // 2 minutes
  sessionEndTimeout: 300,      // 5 minutes
};

// ============================================================================
// Car Detection
// ============================================================================

export interface CarDevice {
  id: string;
  name: string;
  type: 'auto' | 'manual';     // How it was tagged
  lastConnected: Date | null;
  createdAt: Date;
}

// Common car Bluetooth name patterns
export const CAR_BLUETOOTH_PATTERNS: RegExp[] = [
  /car/i,
  /auto/i,
  /sync/i,
  /carplay/i,
  /android auto/i,
  /handsfree/i,
  /bluetooth/i,
  /vehicle/i,
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
];

// ============================================================================
// DriveSentry State
// ============================================================================

export type DriveSentryStatus =
  | 'idle'          // Not monitoring
  | 'monitoring'    // Listening for triggers
  | 'detecting'     // Possible drive detected, gathering data
  | 'driving'       // Confirmed driving, recording session
  | 'paused'        // Temporarily stopped (traffic, etc.)
  | 'error';        // Error state

export interface DriveSentryState {
  status: DriveSentryStatus;
  bluetooth: BluetoothListenerState;
  gps: GPSListenerState;
  currentSession: DriveSession | null;
  lastError: Error | null;
}

// ============================================================================
// Events
// ============================================================================

export type DriveSentryEvent =
  | { type: 'BLUETOOTH_CONNECTED'; device: BluetoothDevice }
  | { type: 'BLUETOOTH_DISCONNECTED'; device: BluetoothDevice }
  | { type: 'LOCATION_UPDATE'; location: LocationData }
  | { type: 'DRIVING_DETECTED' }
  | { type: 'DRIVING_PAUSED' }
  | { type: 'DRIVING_RESUMED' }
  | { type: 'SESSION_STARTED'; session: DriveSession }
  | { type: 'SESSION_ENDED'; session: DriveSession }
  | { type: 'ERROR'; error: Error };

export type DriveSentryEventHandler = (event: DriveSentryEvent) => void;
