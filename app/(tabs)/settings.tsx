import { GoalSettings } from '@/src/components/features/drive-monitor';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <GoalSettings />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
});
