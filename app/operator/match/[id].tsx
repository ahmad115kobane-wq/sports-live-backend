import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { operatorApi, eventApi } from '@/services/api';
import { Match, Player, EventType, CreateEventPayload } from '@/types';
import { EVENT_TYPES, MATCH_STATUS } from '@/constants/config';
import FootballFieldOperator from '@/components/FootballFieldOperator';
import PlayerSelector from '@/components/PlayerSelector';
import { useRTL } from '@/contexts/RTLContext';

const EVENT_BUTTONS: { type: EventType; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
  { type: 'goal', icon: 'football', label: 'Goal', color: '#4CAF50' },
  { type: 'yellow_card', icon: 'square', label: 'Yellow', color: '#FFEB3B' },
  { type: 'red_card', icon: 'square', label: 'Red', color: '#F44336' },
  { type: 'substitution', icon: 'swap-horizontal', label: 'Sub', color: '#2196F3' },
  { type: 'penalty', icon: 'football', label: 'Penalty', color: '#E91E63' },
  { type: 'corner', icon: 'flag', label: 'Corner', color: '#00BCD4' },
  { type: 'foul', icon: 'warning', label: 'Foul', color: '#FF9800' },
  { type: 'offside', icon: 'close-circle', label: 'Offside', color: '#607D8B' },
  { type: 'var_review', icon: 'tv', label: 'VAR', color: '#9C27B0' },
  { type: 'injury', icon: 'medkit', label: 'Injury', color: '#FF5722' },
];

export default function OperatorMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [secondaryPlayer, setSecondaryPlayer] = useState<Player | null>(null);
  const [fieldPosition, setFieldPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectingSecondary, setSelectingSecondary] = useState(false);
  const [minute, setMinute] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadMatch();
    }
  }, [id]);

  const loadMatch = async () => {
    try {
      const response = await operatorApi.getMatch(id!);
      setMatch(response.data.data);
      if (response.data.data.currentMinute) {
        setMinute(response.data.data.currentMinute.toString());
      }
    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Error', 'Failed to load match');
    }
  };

  const handleStartMatch = async () => {
    Alert.alert('Start Match', 'Are you sure you want to start this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          try {
            await operatorApi.startMatch(id!);
            loadMatch();
          } catch (error) {
            Alert.alert('Error', 'Failed to start match');
          }
        },
      },
    ]);
  };

  const handleHalftime = async () => {
    Alert.alert('Half Time', 'Set match to half time?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await operatorApi.setHalftime(id!);
            loadMatch();
          } catch (error) {
            Alert.alert('Error', 'Failed to set halftime');
          }
        },
      },
    ]);
  };

  const handleSecondHalf = async () => {
    Alert.alert('Second Half', 'Start second half?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          try {
            await operatorApi.startSecondHalf(id!);
            loadMatch();
          } catch (error) {
            Alert.alert('Error', 'Failed to start second half');
          }
        },
      },
    ]);
  };

  const handleEndMatch = async () => {
    Alert.alert('End Match', 'Are you sure you want to end this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Match',
        style: 'destructive',
        onPress: async () => {
          try {
            await operatorApi.endMatch(id!);
            loadMatch();
          } catch (error) {
            Alert.alert('Error', 'Failed to end match');
          }
        },
      },
    ]);
  };

  const handleFieldPress = (x: number, y: number) => {
    setFieldPosition({ x, y });
    // Auto-detect team based on field position
    if (x < 50) {
      setSelectedTeamId(match?.homeTeamId || null);
    } else {
      setSelectedTeamId(match?.awayTeamId || null);
    }
  };

  const handleSelectPlayer = (player: Player) => {
    if (selectingSecondary) {
      setSecondaryPlayer(player);
      setSelectingSecondary(false);
    } else {
      setSelectedPlayer(player);
      setSelectedTeamId(player.teamId);
    }
    setShowPlayerModal(false);
  };

  const handleSubmitEvent = async () => {
    if (!selectedEventType || !minute) {
      Alert.alert('Error', 'Please select event type and enter minute');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateEventPayload = {
        matchId: id!,
        minute: parseInt(minute),
        type: selectedEventType,
        teamId: selectedTeamId || undefined,
        playerId: selectedPlayer?.id,
        secondaryPlayerId: secondaryPlayer?.id,
        posX: fieldPosition?.x,
        posY: fieldPosition?.y,
      };

      await eventApi.create(payload);
      
      // Reset form
      setSelectedEventType(null);
      setSelectedPlayer(null);
      setSecondaryPlayer(null);
      setFieldPosition(null);
      
      // Reload match to get updated events
      loadMatch();
      
      Alert.alert('Success', 'Event added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEventType(null);
    setSelectedPlayer(null);
    setSecondaryPlayer(null);
    setFieldPosition(null);
    setSelectedTeamId(null);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      padding: 16,
    },
    matchInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    teamInfo: {
      flex: 1,
      alignItems: 'center',
    },
    teamName: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    scoreContainer: {
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    score: {
      color: '#fff',
      fontSize: 36,
      fontWeight: 'bold',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
      gap: 12,
    },
    controlButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    controlButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    minuteInput: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    minuteLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 14,
    },
    minuteField: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      width: 80,
      textAlign: 'center',
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    eventButtonsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    eventButton: {
      width: '23%',
      aspectRatio: 1,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    eventButtonSelected: {
      borderColor: colors.accent,
    },
    eventIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    eventLabel: {
      fontSize: 10,
      color: colors.text,
      fontWeight: '500',
    },
    teamSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    teamButton: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    teamButtonSelected: {
      borderColor: colors.accent,
    },
    teamButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    playerSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    playerButton: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    playerButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    playerName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    submitButton: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    resetButton: {
      padding: 12,
      alignItems: 'center',
    },
    resetButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

  if (!match) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  const statusInfo = MATCH_STATUS[match.status];
  const isLive = match.status === 'live';
  const isHalftime = match.status === 'halftime';
  const isScheduled = match.status === 'scheduled';
  const isFinished = match.status === 'finished';

  return (
    <View style={styles.container}>
      {/* Match Header */}
      <View style={styles.header}>
        <View style={styles.matchInfo}>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{match.homeTeam.name}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>
              {match.homeScore} - {match.awayScore}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusText}>{statusInfo.label}</Text>
            </View>
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{match.awayTeam.name}</Text>
          </View>
        </View>

        {/* Match Controls */}
        <View style={[styles.controls, { flexDirection }]}>
          {isScheduled && (
            <TouchableOpacity style={styles.controlButton} onPress={handleStartMatch}>
              <View style={{ flexDirection, alignItems: 'center' }}>
                <Ionicons name="play" size={14} color="#fff" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                <Text style={styles.controlButtonText}>{t('operator.startMatch')}</Text>
              </View>
            </TouchableOpacity>
          )}
          {isLive && (
            <TouchableOpacity style={styles.controlButton} onPress={handleHalftime}>
              <View style={{ flexDirection, alignItems: 'center' }}>
                <Ionicons name="pause" size={14} color="#fff" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                <Text style={styles.controlButtonText}>{t('match.halfTime')}</Text>
              </View>
            </TouchableOpacity>
          )}
          {isHalftime && (
            <TouchableOpacity style={styles.controlButton} onPress={handleSecondHalf}>
              <View style={{ flexDirection, alignItems: 'center' }}>
                <Ionicons name="play" size={14} color="#fff" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                <Text style={styles.controlButtonText}>{t('operator.secondHalf')}</Text>
              </View>
            </TouchableOpacity>
          )}
          {(isLive || isHalftime) && (
            <TouchableOpacity style={styles.controlButton} onPress={handleEndMatch}>
              <View style={{ flexDirection, alignItems: 'center' }}>
                <Ionicons name="flag" size={14} color="#fff" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                <Text style={styles.controlButtonText}>{t('operator.endMatch')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Minute Input */}
        {(isLive || isHalftime) && (
          <View style={[styles.minuteInput, { flexDirection }]}>
            <Text style={[styles.minuteLabel, { marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }]}>{t('match.minute')}:</Text>
            <TextInput
              style={[styles.minuteField, { textAlign: isRTL ? 'right' : 'center' }]}
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        )}
      </View>

      <ScrollView>
        {/* Football Field */}
        <View style={styles.section}>
          <View style={{ flexDirection, alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="location-outline" size={18} color={colors.accent} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
            <Text style={styles.sectionTitle}>{t('operator.selectPosition')}</Text>
          </View>
          <FootballFieldOperator
            events={match.events || []}
            onFieldPress={handleFieldPress}
            selectedPosition={fieldPosition}
          />
        </View>

        {/* Event Type Selector */}
        <View style={styles.section}>
          <View style={{ flexDirection, alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="flash-outline" size={18} color={colors.accent} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
            <Text style={styles.sectionTitle}>{t('operator.eventType')}</Text>
          </View>
          <View style={styles.eventButtonsGrid}>
            {EVENT_BUTTONS.map((event) => (
              <TouchableOpacity
                key={event.type}
                style={[
                  styles.eventButton,
                  selectedEventType === event.type && styles.eventButtonSelected,
                  { backgroundColor: event.color + '20' },
                ]}
                onPress={() => setSelectedEventType(event.type)}
              >
                <Ionicons name={event.icon} size={24} color={event.color} style={{ marginBottom: 4 }} />
                <Text style={styles.eventLabel}>{event.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team Selector */}
        <View style={styles.section}>
          <View style={{ flexDirection, alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="shield-outline" size={18} color={colors.accent} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
            <Text style={styles.sectionTitle}>{t('match.team')}</Text>
          </View>
          <View style={[styles.teamSelector, { flexDirection }]}>
            <TouchableOpacity
              style={[
                styles.teamButton,
                selectedTeamId === match.homeTeamId && styles.teamButtonSelected,
              ]}
              onPress={() => setSelectedTeamId(match.homeTeamId)}
            >
              <Text style={styles.teamButtonText}>{match.homeTeam.shortName}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.teamButton,
                selectedTeamId === match.awayTeamId && styles.teamButtonSelected,
              ]}
              onPress={() => setSelectedTeamId(match.awayTeamId)}
            >
              <Text style={styles.teamButtonText}>{match.awayTeam.shortName}</Text>
            </TouchableOpacity>
          </View>

          {/* Player Selector */}
          <View style={{ flexDirection, alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="person-outline" size={18} color={colors.accent} style={{ marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }} />
            <Text style={styles.sectionTitle}>{t('operator.player')}</Text>
          </View>
          <View style={styles.playerSelector}>
            <TouchableOpacity
              style={styles.playerButton}
              onPress={() => {
                setSelectingSecondary(false);
                setShowPlayerModal(true);
              }}
            >
              <Text style={styles.playerButtonText}>{t('operator.primary')}</Text>
              <Text style={styles.playerName}>
                {selectedPlayer?.name || t('operator.selectPlayer')}
              </Text>
            </TouchableOpacity>
            {selectedEventType === 'substitution' && (
              <TouchableOpacity
                style={styles.playerButton}
                onPress={() => {
                  setSelectingSecondary(true);
                  setShowPlayerModal(true);
                }}
              >
                <Text style={styles.playerButtonText}>{t('operator.substituteIn')}</Text>
                <Text style={styles.playerName}>
                  {secondaryPlayer?.name || t('operator.selectPlayer')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedEventType || loading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitEvent}
            disabled={!selectedEventType || loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? t('operator.publishing') : t('operator.publishEvent')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
            <Text style={styles.resetButtonText}>{t('operator.resetForm')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Player Selection Modal */}
      <Modal visible={showPlayerModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '80%',
            }}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                {t('operator.selectPlayer')}
              </Text>
              <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <PlayerSelector
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              selectedTeamId={selectedTeamId}
              onSelect={handleSelectPlayer}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
