import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { usePersonalizationStore } from '../../../store/personalizationStore';

export const GoalSettings = () => {
    const goals = usePersonalizationStore((state) => state.goals);
    const addGoal = usePersonalizationStore((state) => state.addGoal);
    const removeGoal = usePersonalizationStore((state) => state.removeGoal);
    const interventionMode = usePersonalizationStore((state) => state.interventionMode);
    const setInterventionMode = usePersonalizationStore((state) => state.setInterventionMode);

    const isEnglishGoalActive = goals.includes('learn_english');
    const toggleEnglishGoal = () => {
        if (isEnglishGoalActive) {
            removeGoal('learn_english');
        } else {
            addGoal('learn_english');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>SETTINGS</Text>

            {/* Goals Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>GOALS</Text>

                <View style={styles.row}>
                    <View>
                        <Text style={styles.rowLabel}>English Lesson</Text>
                        <Text style={styles.rowDesc}>Propose lessons during drives</Text>
                    </View>
                    <Switch
                        value={isEnglishGoalActive}
                        onValueChange={toggleEnglishGoal}
                        trackColor={{ false: '#333', true: '#00FF9D' }}
                        thumbColor={'#FFF'}
                        ios_backgroundColor="#333"
                    />
                </View>
            </View>

            {/* Personality Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>INTERVENTION MODE</Text>

                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        style={[
                            styles.segmentButton,
                            interventionMode === 'polite' && styles.segmentActive
                        ]}
                        onPress={() => setInterventionMode('polite')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                interventionMode === 'polite' && styles.segmentTextActive
                            ]}
                        >
                            Polite
                        </Text>
                        <Text style={styles.segmentSubtext}>Asks first</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.segmentButton,
                            interventionMode === 'proactive' && styles.segmentActive
                        ]}
                        onPress={() => setInterventionMode('proactive')}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                interventionMode === 'proactive' && styles.segmentTextActive
                            ]}
                        >
                            Proactive
                        </Text>
                        <Text style={styles.segmentSubtext}>Auto-resume</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* System Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>SYSTEM</Text>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.rowLabel}>Audio Prompts</Text>
                        <Text style={styles.rowDesc}>Voice feedback</Text>
                    </View>
                    <Switch
                        value={true}
                        disabled
                        trackColor={{ false: '#333', true: '#333' }}
                        thumbColor={'#666'}
                    />
                </View>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        padding: 24,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 40,
        letterSpacing: 1,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 15,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
    },
    rowLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    rowDesc: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 4,
        height: 80,
    },
    segmentButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentActive: {
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#00FF9D',
        shadowColor: '#00FF9D',
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    segmentText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    segmentTextActive: {
        color: '#00FF9D',
    },
    segmentSubtext: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    }
});
