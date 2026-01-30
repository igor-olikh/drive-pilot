import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDriveStore } from '../../../store/driveStore';
// import { usePersonalizationEngine } from '../../../core/personalization/PersonalizationEngine'; 
// Engine should be mounted at root, not here.

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.7;

export const MainDashboard = () => {
    const isDriving = useDriveStore((state) => state.isDriving);
    const voiceStatus = useDriveStore((state) => state.voiceStatus);
    const isBluetoothConnected = useDriveStore((state) => state.isBluetoothConnected);
    const startDrive = useDriveStore((state) => state.startDrive);
    const stopDrive = useDriveStore((state) => state.stopDrive);

    const statusColor = voiceStatus === 'listening' ? '#00FFFF' : (isDriving ? '#00FF9D' : '#FFBF00');
    const statusText = voiceStatus === 'listening' ? 'LISTENING...' : (isDriving ? 'SENTINEL ACTIVE' : 'SENTRY STANDBY');
    const subText = voiceStatus === 'listening' ? 'Speak Now' : (isDriving ? 'DRIVE MODE: ON' : 'LISTENING...');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>SENTINEL DASHBOARD</Text>
            </View>

            <View style={styles.ringContainer}>
                {/* Outer pulsating ring (simulated with border for now) */}
                <View style={[styles.ring, { borderColor: statusColor, shadowColor: statusColor }]}>
                    <View style={[styles.innerRing, { backgroundColor: isDriving ? statusColor : 'transparent' }]} />
                </View>

                <View style={styles.statusContainer}>
                    <Text style={[styles.statusTitle, { color: statusColor }]}>
                        {statusText}
                    </Text>
                    <Text style={styles.statusSubtitle}>{subText}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>CONNECTION</Text>
                    <Text style={styles.infoValue}>
                        {isBluetoothConnected ? 'CAR AUDIO' : 'SEARCHING'}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>SYSTEM</Text>
                    <Text style={styles.infoValue}>OPTIMAL</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.actionButton, { borderColor: isDriving ? '#FF3B30' : '#00FF9D' }]}
                onPress={isDriving ? stopDrive : startDrive}
            >
                <Text style={[styles.actionButtonText, { color: isDriving ? '#FF3B30' : '#00FF9D' }]}>
                    {isDriving ? 'EMERGENCY STOP' : 'MANUAL ACTIVE'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    header: {
        paddingTop: 20,
    },
    headerText: {
        color: '#666',
        fontSize: 12,
        letterSpacing: 2,
        fontWeight: 'bold',
    },
    ringContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10, // Android shadow
    },
    innerRing: {
        width: RING_SIZE * 0.8,
        height: RING_SIZE * 0.8,
        borderRadius: (RING_SIZE * 0.8) / 2,
        opacity: 0.1,
    },
    statusContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    statusTitle: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 255, 157, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    statusSubtitle: {
        color: '#FFF',
        fontSize: 16,
        marginTop: 10,
        fontWeight: '600',
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-evenly',
        paddingHorizontal: 20,
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: {
        color: '#444',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    infoValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    actionButton: {
        borderWidth: 2,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginBottom: 20,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
