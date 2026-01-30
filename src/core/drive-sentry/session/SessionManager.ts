/**
 * Session Manager Placeholder
 * 
 * This module will handle:
 * - Driving session lifecycle management
 * - Session state machine (idle → detecting → driving → paused → ended)
 * - Coordination with BluetoothListener and GPSListener
 * - Session persistence via repositories
 */

import type {
    DriveSession,
    LocationData,
    SessionTrigger,
    Waypoint
} from '../types';

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * SessionManager - Orchestrates driving session lifecycle
 * 
 * TODO: Implement the following:
 * - startSession(): Initialize new session with trigger
 * - pauseSession(): Pause recording (stationary)
 * - resumeSession(): Resume after pause
 * - endSession(): Finalize and save session
 * - addWaypoint(): Record location during session
 * - calculateStats(): Compute distance, speed, duration
 */
export class SessionManager {
    private static instance: SessionManager | null = null;
    private currentSession: DriveSession | null = null;
    private waypoints: Waypoint[] = [];

    private constructor() { }

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    getCurrentSession(): DriveSession | null {
        return this.currentSession ? { ...this.currentSession } : null;
    }

    isSessionActive(): boolean {
        return this.currentSession !== null &&
            this.currentSession.status !== 'completed';
    }

    async startSession(trigger: SessionTrigger): Promise<DriveSession> {
        if (this.currentSession && this.currentSession.status !== 'completed') {
            throw new Error('Cannot start new session while one is active');
        }

        const session: DriveSession = {
            id: generateSessionId(),
            startTime: new Date(),
            endTime: null,
            status: 'active',
            startTrigger: trigger,
            endTrigger: null,
            totalDistance: 0,
            totalDuration: 0,
            averageSpeed: 0,
            maxSpeed: 0,
            waypointCount: 0,
        };

        this.currentSession = session;
        this.waypoints = [];

        // TODO: Persist to database

        return session;
    }

    pauseSession(): void {
        if (!this.currentSession || this.currentSession.status !== 'active') {
            throw new Error('No active session to pause');
        }
        this.currentSession.status = 'paused';
    }

    resumeSession(): void {
        if (!this.currentSession || this.currentSession.status !== 'paused') {
            throw new Error('No paused session to resume');
        }
        this.currentSession.status = 'active';
    }

    async endSession(endTrigger: SessionTrigger): Promise<DriveSession> {
        if (!this.currentSession) {
            throw new Error('No session to end');
        }

        this.currentSession.endTime = new Date();
        this.currentSession.endTrigger = endTrigger;
        this.currentSession.status = 'completed';
        this.currentSession.waypointCount = this.waypoints.length;

        // Calculate final stats
        this.calculateStats();

        // TODO: Persist to database

        const completedSession = { ...this.currentSession };
        this.currentSession = null;
        this.waypoints = [];

        return completedSession;
    }

    addWaypoint(location: LocationData): void {
        if (!this.currentSession || this.currentSession.status !== 'active') {
            return;
        }

        const waypoint: Waypoint = {
            ...location,
            id: this.waypoints.length + 1,
            sessionId: this.currentSession.id,
        };

        this.waypoints.push(waypoint);

        // Update max speed
        if (location.speed && location.speed > this.currentSession.maxSpeed) {
            this.currentSession.maxSpeed = location.speed;
        }
    }

    private calculateStats(): void {
        if (!this.currentSession || this.waypoints.length < 2) return;

        // Duration
        const duration = this.currentSession.endTime && this.currentSession.startTime
            ? (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 1000
            : 0;
        this.currentSession.totalDuration = duration;

        // Distance (sum of haversine distances between consecutive waypoints)
        let totalDistance = 0;
        for (let i = 1; i < this.waypoints.length; i++) {
            totalDistance += this.haversineDistance(
                this.waypoints[i - 1],
                this.waypoints[i]
            );
        }
        this.currentSession.totalDistance = totalDistance;

        // Average speed
        if (duration > 0) {
            this.currentSession.averageSpeed = totalDistance / duration;
        }
    }

    /**
     * Calculate distance between two coordinates in meters
     */
    private haversineDistance(coord1: LocationData, coord2: LocationData): number {
        const R = 6371000; // Earth's radius in meters
        const lat1 = (coord1.latitude * Math.PI) / 180;
        const lat2 = (coord2.latitude * Math.PI) / 180;
        const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
        const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}

export default SessionManager;
