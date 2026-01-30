/**
 * Driving Detector Placeholder
 * 
 * This module will handle:
 * - Analyzing GPS data to detect driving patterns
 * - Speed threshold monitoring
 * - Duration and distance accumulation
 * - Stationary detection for pausing
 */

import type {
    DrivingConditions,
    LocationData
} from '../types';

export type DrivingDetectorState =
    | 'idle'
    | 'detecting'
    | 'driving'
    | 'stationary';

export interface DrivingDetectorResult {
    state: DrivingDetectorState;
    confidence: number;        // 0-1
    currentSpeed: number;      // m/s
    averageSpeed: number;      // m/s over detection window
    distanceTraveled: number;  // meters in detection window
    drivingDuration: number;   // seconds
    stationaryDuration: number;// seconds
}

/**
 * DrivingDetector - Determines if user is driving based on GPS data
 * 
 * Detection algorithm:
 * 1. Collect location updates in a sliding window
 * 2. If speed > minSpeed for > minDuration → DRIVING
 * 3. If speed ≈ 0 for > maxStationaryTime → STATIONARY
 * 4. If stationary for > sessionEndTimeout → END
 */
export class DrivingDetector {
    private static instance: DrivingDetector | null = null;
    private conditions: DrivingConditions;
    private state: DrivingDetectorState = 'idle';
    private locationHistory: LocationData[] = [];
    private drivingStartTime: number | null = null;
    private stationaryStartTime: number | null = null;

    private constructor(conditions: Partial<DrivingConditions> = {}) {
        this.conditions = {
            minSpeed: 5,
            minDuration: 60,
            minDistance: 200,
            maxStationaryTime: 120,
            sessionEndTimeout: 300,
            ...conditions
        };
    }

    static getInstance(conditions?: Partial<DrivingConditions>): DrivingDetector {
        if (!DrivingDetector.instance) {
            DrivingDetector.instance = new DrivingDetector(conditions);
        }
        return DrivingDetector.instance;
    }

    reset(): void {
        this.state = 'idle';
        this.locationHistory = [];
        this.drivingStartTime = null;
        this.stationaryStartTime = null;
    }

    processLocation(location: LocationData): DrivingDetectorResult {
        this.locationHistory.push(location);

        // Keep only last 5 minutes of data
        const fiveMinutesAgo = Date.now() - 300000;
        this.locationHistory = this.locationHistory.filter(l => l.timestamp > fiveMinutesAgo);

        const currentSpeed = location.speed ?? 0;
        const isMoving = currentSpeed >= this.conditions.minSpeed;

        // State machine
        if (isMoving) {
            this.stationaryStartTime = null;

            if (!this.drivingStartTime) {
                this.drivingStartTime = location.timestamp;
                this.state = 'detecting';
            }

            const drivingDuration = (location.timestamp - this.drivingStartTime) / 1000;

            if (drivingDuration >= this.conditions.minDuration) {
                this.state = 'driving';
            }
        } else {
            // Stationary
            if (!this.stationaryStartTime) {
                this.stationaryStartTime = location.timestamp;
            }

            const stationaryDuration = (location.timestamp - this.stationaryStartTime) / 1000;

            if (stationaryDuration >= this.conditions.maxStationaryTime) {
                this.state = 'stationary';
            }
        }

        return this.getResult(location);
    }

    private getResult(latestLocation: LocationData): DrivingDetectorResult {
        const drivingDuration = this.drivingStartTime
            ? (latestLocation.timestamp - this.drivingStartTime) / 1000
            : 0;
        const stationaryDuration = this.stationaryStartTime
            ? (latestLocation.timestamp - this.stationaryStartTime) / 1000
            : 0;

        // Calculate average speed and distance from history
        const speeds = this.locationHistory
            .map(l => l.speed ?? 0)
            .filter(s => s > 0);
        const averageSpeed = speeds.length > 0
            ? speeds.reduce((a, b) => a + b, 0) / speeds.length
            : 0;

        // Calculate confidence based on how well data matches driving pattern
        let confidence = 0;
        if (this.state === 'driving') {
            confidence = Math.min(1, drivingDuration / (this.conditions.minDuration * 2));
        } else if (this.state === 'detecting') {
            confidence = drivingDuration / this.conditions.minDuration;
        }

        return {
            state: this.state,
            confidence,
            currentSpeed: latestLocation.speed ?? 0,
            averageSpeed,
            distanceTraveled: 0, // TODO: Calculate from history
            drivingDuration,
            stationaryDuration,
        };
    }
}

export default DrivingDetector;
