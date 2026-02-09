import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  StatusBar,
  ActivityIndicator,
  Vibration,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { operatorApi, eventApi, statsApi } from '@/services/api';
import { Match, Player, EventType, CreateEventPayload } from '@/types';
import { EVENT_TYPES, MATCH_STATUS } from '@/constants/config';
import FootballFieldOperator from '@/components/FootballFieldOperator';
import PlayerSelector from '@/components/PlayerSelector';
import { useRTL } from '@/contexts/RTLContext';
import EventIcon from '@/components/ui/EventIcon';

// Quick-access events (most used, top row)
const QUICK_EVENTS: { type: EventType; labelKey: string; color: string }[] = [
  { type: 'goal', labelKey: 'events.goal', color: '#4CAF50' },
  { type: 'yellow_card', labelKey: 'events.yellow_card', color: '#FFEB3B' },
  { type: 'red_card', labelKey: 'events.red_card', color: '#F44336' },
  { type: 'substitution', labelKey: 'events.substitution', color: '#2196F3' },
  { type: 'penalty', labelKey: 'events.penalty', color: '#E91E63' },
];

// Secondary events (less frequent)
const MORE_EVENTS: { type: EventType; labelKey: string; color: string }[] = [
  { type: 'corner', labelKey: 'events.corner', color: '#00BCD4' },
  { type: 'foul', labelKey: 'events.foul', color: '#FF9800' },
  { type: 'offside', labelKey: 'events.offside', color: '#607D8B' },
  { type: 'var_review', labelKey: 'events.var_review', color: '#9C27B0' },
  { type: 'injury', labelKey: 'events.injury', color: '#FF5722' },
];

export default function OperatorMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [match, setMatch] = useState<Match | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [secondaryPlayer, setSecondaryPlayer] = useState<Player | null>(null);
  const [fieldPosition, setFieldPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectingSecondary, setSelectingSecondary] = useState(false);
  const [showMoreEvents, setShowMoreEvents] = useState(false);
  const [autoMinute, setAutoMinute] = useState(0);
  const [stoppageTime, setStoppageTime] = useState<number | null>(null);
  const [showStoppageModal, setShowStoppageModal] = useState(false);
  const [stoppageInput, setStoppageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showField, setShowField] = useState(false);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [possessionTeam, setPossessionTeam] = useState<'home' | 'away' | null>(null);
  const [homePossession, setHomePossession] = useState(50);
  const [awayPossession, setAwayPossession] = useState(50);

  useEffect(() => {
    if (id) loadMatch();
  }, [id]);

  const [autoSeconds, setAutoSeconds] = useState(0);

  // Precise timer: compute from server timestamps (liveStartedAt / secondHalfStartedAt)
  useEffect(() => {
    if (!match) return;
    const isActive = match.status === 'live' || match.status === 'extra_time';
    const isPaused = match.status === 'halftime' || match.status === 'extra_time_halftime' || match.status === 'penalties';

    if (!isActive && !isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Compute time from timestamps
    const computeTime = () => {
      const now = Date.now();

      if (match.status === 'live' && match.liveStartedAt) {
        if (match.secondHalfStartedAt) {
          // Second half
          const elapsedMs = now - new Date(match.secondHalfStartedAt).getTime();
          const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
          setAutoMinute(46 + Math.floor(totalSec / 60));
          setAutoSeconds(totalSec % 60);
          return;
        }
        // First half
        const elapsedMs = now - new Date(match.liveStartedAt).getTime();
        const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
        setAutoMinute(1 + Math.floor(totalSec / 60));
        setAutoSeconds(totalSec % 60);
        return;
      }

      if (match.status === 'extra_time' && match.updatedAt) {
        const base = match.currentMinute || 91;
        const elapsedMs = now - new Date(match.updatedAt).getTime();
        const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
        setAutoMinute(base + Math.floor(totalSec / 60));
        setAutoSeconds(totalSec % 60);
        return;
      }

      // Paused states — fixed values
      if (match.status === 'halftime') { setAutoMinute(45); setAutoSeconds(0); }
      else if (match.status === 'extra_time_halftime') { setAutoMinute(105); setAutoSeconds(0); }
      else if (match.status === 'penalties') { setAutoMinute(120); setAutoSeconds(0); }
      else if (match.currentMinute) { setAutoMinute(match.currentMinute); setAutoSeconds(0); }
    };

    // Compute immediately
    computeTime();

    // Tick every second if actively playing
    if (isActive) {
      timerRef.current = setInterval(computeTime, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [match]);

  const loadMatch = async () => {
    try {
      const response = await operatorApi.getMatch(id!);
      setMatch(response.data.data);
      if (response.data.data.currentMinute) {
        setAutoMinute(response.data.data.currentMinute);
      }
      // Load possession data
      try {
        const statsRes = await statsApi.getMatchStats(id!);
        if (statsRes.data?.data) {
          setHomePossession(statsRes.data.data.homePossession ?? 50);
          setAwayPossession(statsRes.data.data.awayPossession ?? 50);
          setPossessionTeam(statsRes.data.data.possessionTeam ?? null);
        }
      } catch (e) { /* ignore stats load error */ }
    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert(t('common.error'), t('operator.failedLoadMatch'));
    }
  };

  const handlePossessionToggle = async (team: 'home' | 'away') => {
    try {
      const res = await statsApi.togglePossession(id!, team);
      if (res.data?.data) {
        setPossessionTeam(res.data.data.currentTeam);
        setHomePossession(res.data.data.homePossession);
        setAwayPossession(res.data.data.awayPossession);
      }
      Vibration.vibrate(15);
    } catch (error) {
      console.error('Possession toggle error:', error);
    }
  };

  const handleStartMatch = async () => {
    Alert.alert(
      t('operator.startMatch'),
      t('operator.startMatchConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.startShort'),
          onPress: async () => {
            try {
              await operatorApi.startMatch(id!);
              setAutoMinute(1);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedStartMatch'));
            }
          },
        },
      ]
    );
  };

  const handleHalftime = async () => {
    Alert.alert(
      t('operator.half'),
      t('operator.halfTimeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.confirm'),
          onPress: async () => {
            try {
              await operatorApi.setHalftime(id!);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedHalftime'));
            }
          },
        },
      ]
    );
  };

  const handleSecondHalf = async () => {
    Alert.alert(
      t('operator.secondHalf'),
      t('operator.secondHalfConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.startShort'),
          onPress: async () => {
            try {
              await operatorApi.startSecondHalf(id!);
              setAutoMinute(46);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedSecondHalf'));
            }
          },
        },
      ]
    );
  };

  const handleEndMatch = async () => {
    Alert.alert(
      t('operator.endMatch'),
      t('operator.endMatchConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.end'),
          style: 'destructive',
          onPress: async () => {
            try {
              await operatorApi.endMatch(id!);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedEndMatch'));
            }
          },
        },
      ]
    );
  };

  const handleStoppageTime = () => {
    setStoppageInput('');
    setShowStoppageModal(true);
  };

  const handleSubmitStoppage = async () => {
    const min = parseInt(stoppageInput, 10);
    if (!min || min < 1 || min > 30) {
      Alert.alert(t('common.error'), t('operator.invalidStoppage'));
      return;
    }
    try {
      await operatorApi.setStoppageTime(id!, min);
      setStoppageTime(min);
      setShowStoppageModal(false);
      Vibration.vibrate(30);
    } catch (error) {
      Alert.alert(t('common.error'), t('operator.failedStoppage'));
    }
  };

  const handleStartExtraTime = async () => {
    Alert.alert(
      t('operator.extraTime'),
      t('operator.confirmExtraTime'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.startShort'),
          onPress: async () => {
            try {
              await operatorApi.startExtraTime(id!);
              setAutoMinute(91);
              setStoppageTime(null);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedExtraTime'));
            }
          },
        },
      ]
    );
  };

  const handleExtraTimeHalftime = async () => {
    Alert.alert(
      t('operator.extraTimeHalf'),
      t('operator.confirmExtraTimeHalf'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.confirm'),
          onPress: async () => {
            try {
              await operatorApi.setExtraTimeHalftime(id!);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedETHalftime'));
            }
          },
        },
      ]
    );
  };

  const handleStartET2 = async () => {
    Alert.alert(
      t('operator.startET2'),
      t('operator.confirmET2'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.startShort'),
          onPress: async () => {
            try {
              await operatorApi.startExtraTimeSecond(id!);
              setAutoMinute(106);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedET2'));
            }
          },
        },
      ]
    );
  };

  const handleStartPenalties = async () => {
    Alert.alert(
      t('operator.penalties'),
      t('operator.confirmPenalties'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('operator.startShort'),
          onPress: async () => {
            try {
              await operatorApi.startPenalties(id!);
              setAutoMinute(120);
              setStoppageTime(null);
              loadMatch();
            } catch (error) {
              Alert.alert(t('common.error'), t('operator.failedPenalties'));
            }
          },
        },
      ]
    );
  };

  const handleFieldPress = (x: number, y: number) => {
    setFieldPosition({ x, y });
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
    if (!selectedEventType) {
      Alert.alert(
        t('common.error'),
        t('operator.selectEventType')
      );
      return;
    }

    // Substitution requires both players and a team
    if (selectedEventType === 'substitution') {
      if (!selectedPlayer || !secondaryPlayer) {
        Alert.alert(
          t('common.error'),
          t('operator.selectBothPlayers')
        );
        return;
      }
      if (!selectedTeamId) {
        Alert.alert(
          t('common.error'),
          t('operator.selectTeamFirst')
        );
        return;
      }
    }

    setLoading(true);
    try {
      if (selectedEventType === 'substitution') {
        // Use dedicated substitution endpoint that updates lineup
        await operatorApi.makeSubstitution(id!, {
          playerOutId: selectedPlayer!.id,
          playerInId: secondaryPlayer!.id,
          minute: autoMinute,
          teamId: selectedTeamId!,
        });
      } else {
        const payload: CreateEventPayload = {
          matchId: id!,
          minute: autoMinute,
          type: selectedEventType,
          teamId: selectedTeamId || undefined,
          playerId: selectedPlayer?.id,
          secondaryPlayerId: secondaryPlayer?.id,
          posX: fieldPosition?.x,
          posY: fieldPosition?.y,
        };
        await eventApi.create(payload);
      }

      Vibration.vibrate(50);

      // Track recent event for feedback
      setRecentEvents(prev => [selectedEventType, ...prev.slice(0, 4)]);

      // Reset form but keep team and auto-minute
      setSelectedEventType(null);
      setSelectedPlayer(null);
      setSecondaryPlayer(null);
      setFieldPosition(null);

      loadMatch();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('operator.failedAddEvent'));
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

  if (!match) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const statusInfo = MATCH_STATUS[match.status] || { label: match.status, color: '#9E9E9E' };
  const isLive = match.status === 'live';
  const isHalftime = match.status === 'halftime';
  const isScheduled = match.status === 'scheduled';
  const isFinished = match.status === 'finished';
  const isExtraTime = match.status === 'extra_time';
  const isExtraTimeHalftime = match.status === 'extra_time_halftime';
  const isPenalties = match.status === 'penalties';
  const canAddEvents = isLive || isHalftime || isExtraTime || isExtraTimeHalftime || isPenalties;

  const currentTeam = selectedTeamId === match.homeTeamId ? match.homeTeam :
                     selectedTeamId === match.awayTeamId ? match.awayTeam : null;
  const teamPlayers = currentTeam?.players || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Sticky Scoreboard Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        {/* Top bar: back + minute + controls */}
        <View style={[styles.headerTopBar, { flexDirection }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Auto Minute Display */}
          {canAddEvents && (
            <View style={styles.minuteChip}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.minuteDisplay, { color: colors.text }]}>{autoMinute}:{autoSeconds < 10 ? '0' : ''}{autoSeconds}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.headerBtn} onPress={loadMatch}>
            <Ionicons name="refresh" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Score Row */}
        <View style={[styles.scoreRow, { flexDirection }]}>
          <TouchableOpacity
            style={[
              styles.teamChip,
              selectedTeamId === match.homeTeamId && { backgroundColor: colors.surfacePressed },
            ]}
            onPress={() => setSelectedTeamId(match.homeTeamId)}
            activeOpacity={0.7}
          >
            <Text style={[styles.teamChipName, { color: colors.text }]} numberOfLines={1}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </Text>
          </TouchableOpacity>

          <View style={styles.scoreCenterBox}>
            <Text style={[styles.scoreText, { color: colors.text }]}>
              {match.homeScore} - {match.awayScore}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusPillText}>{statusInfo.label}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.teamChip,
              selectedTeamId === match.awayTeamId && { backgroundColor: colors.surfacePressed },
            ]}
            onPress={() => setSelectedTeamId(match.awayTeamId)}
            activeOpacity={0.7}
          >
            <Text style={[styles.teamChipName, { color: colors.text }]} numberOfLines={1}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Match Control Buttons */}
        <View style={[styles.controlRow, { flexDirection }]}>
          {/* Scheduled: Setup Lineup + Start */}
          {isScheduled && (
            <>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: '#2196F3' }]}
                onPress={() => router.push({ pathname: '/operator/match/setup', params: { matchId: id } })}
              >
                <Ionicons name="people" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.setupLineup')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#4CAF50' }]} onPress={handleStartMatch}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.startShort')}</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Live: Halftime + Stoppage */}
          {isLive && (
            <>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#FF9800' }]} onPress={handleHalftime}>
                <Ionicons name="pause" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.half')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#795548' }]} onPress={handleStoppageTime}>
                <Ionicons name="time" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{stoppageTime ? `+${stoppageTime}` : t('operator.stoppageTime')}</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Halftime: Second Half + Extra Time + Penalties */}
          {isHalftime && (
            <>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#4CAF50' }]} onPress={handleSecondHalf}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.secondHalfShort')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#E91E63' }]} onPress={handleStartExtraTime}>
                <Ionicons name="timer" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.extraTime')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#9C27B0' }]} onPress={handleStartPenalties}>
                <Ionicons name="football" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.penalties')}</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Extra Time: ET Halftime + Penalties + Stoppage */}
          {isExtraTime && (
            <>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#FF9800' }]} onPress={handleExtraTimeHalftime}>
                <Ionicons name="pause" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.extraTimeHalf')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#9C27B0' }]} onPress={handleStartPenalties}>
                <Ionicons name="football" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.penalties')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#795548' }]} onPress={handleStoppageTime}>
                <Ionicons name="time" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{stoppageTime ? `+${stoppageTime}` : t('operator.stoppageTime')}</Text>
              </TouchableOpacity>
            </>
          )}
          {/* ET Halftime: Start ET2 + Penalties */}
          {isExtraTimeHalftime && (
            <>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#4CAF50' }]} onPress={handleStartET2}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.startET2')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#9C27B0' }]} onPress={handleStartPenalties}>
                <Ionicons name="football" size={14} color="#fff" />
                <Text style={styles.controlBtnText}>{t('operator.penalties')}</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Penalties mode: just end */}
          {isPenalties && (
            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#795548' }]} onPress={handleStoppageTime}>
              <Ionicons name="time" size={14} color="#fff" />
              <Text style={styles.controlBtnText}>{stoppageTime ? `+${stoppageTime}` : t('operator.stoppageTime')}</Text>
            </TouchableOpacity>
          )}
          {/* End match - available in all active states */}
          {canAddEvents && (
            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#E63946' }]} onPress={handleEndMatch}>
              <Ionicons name="flag" size={14} color="#fff" />
              <Text style={styles.controlBtnText}>{t('operator.end')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Possession Toggle */}
        {canAddEvents && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('operator.possession')}
            </Text>
            <View style={[styles.possessionRow, { flexDirection }]}>
              {/* Home Team Button */}
              <TouchableOpacity
                activeOpacity={0.6}
                style={[
                  styles.possessionBtn,
                  { backgroundColor: possessionTeam === 'home' ? '#3B82F6' : colors.surface },
                  possessionTeam === 'home' && styles.possessionBtnActive,
                ]}
                onPress={() => handlePossessionToggle('home')}
              >
                <Text style={[
                  styles.possessionBtnText,
                  { color: possessionTeam === 'home' ? '#fff' : colors.text },
                ]} numberOfLines={1}>
                  {match.homeTeam.shortName || match.homeTeam.name}
                </Text>
                <Text style={[
                  styles.possessionPct,
                  { color: possessionTeam === 'home' ? '#fff' : colors.textSecondary },
                ]}>
                  {homePossession}%
                </Text>
              </TouchableOpacity>

              {/* Possession Bar */}
              <View style={styles.possessionBarContainer}>
                <View style={styles.possessionBarBg}>
                  <View style={[styles.possessionBarHome, { width: `${homePossession}%` }]} />
                </View>
              </View>

              {/* Away Team Button */}
              <TouchableOpacity
                activeOpacity={0.6}
                style={[
                  styles.possessionBtn,
                  { backgroundColor: possessionTeam === 'away' ? '#EF4444' : colors.surface },
                  possessionTeam === 'away' && styles.possessionBtnActive,
                ]}
                onPress={() => handlePossessionToggle('away')}
              >
                <Text style={[
                  styles.possessionBtnText,
                  { color: possessionTeam === 'away' ? '#fff' : colors.text },
                ]} numberOfLines={1}>
                  {match.awayTeam.shortName || match.awayTeam.name}
                </Text>
                <Text style={[
                  styles.possessionPct,
                  { color: possessionTeam === 'away' ? '#fff' : colors.textSecondary },
                ]}>
                  {awayPossession}%
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Event Buttons - Primary */}
        {canAddEvents && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('operator.quickEvent')}
            </Text>
            <View style={styles.quickEventsRow}>
              {QUICK_EVENTS.map((event) => {
                const isSelected = selectedEventType === event.type;
                return (
                  <TouchableOpacity
                    key={event.type}
                    activeOpacity={0.6}
                    style={[
                      styles.quickEventBtn,
                      { backgroundColor: isSelected ? event.color + '30' : colors.surface },
                      isSelected && { borderColor: event.color, borderWidth: 2 },
                    ]}
                    onPress={() => {
                      setSelectedEventType(isSelected ? null : event.type);
                      Vibration.vibrate(10);
                    }}
                  >
                    <EventIcon type={event.type} size={22} color={event.color} />
                    <Text style={[styles.quickEventLabel, { color: isSelected ? event.color : colors.text }]}>
                      {t(event.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* More Events Toggle */}
            <TouchableOpacity
              style={[styles.moreEventsToggle, { backgroundColor: colors.surface }]}
              onPress={() => setShowMoreEvents(!showMoreEvents)}
              activeOpacity={0.7}
            >
              <Text style={[styles.moreEventsText, { color: colors.textSecondary }]}>
                {showMoreEvents ? t('operator.less') : t('operator.more')}
              </Text>
              <Ionicons name={showMoreEvents ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            {showMoreEvents && (
              <View style={styles.quickEventsRow}>
                {MORE_EVENTS.map((event) => {
                  const isSelected = selectedEventType === event.type;
                  return (
                    <TouchableOpacity
                      key={event.type}
                      activeOpacity={0.6}
                      style={[
                        styles.quickEventBtn,
                        { backgroundColor: isSelected ? event.color + '30' : colors.surface },
                        isSelected && { borderColor: event.color, borderWidth: 2 },
                      ]}
                      onPress={() => {
                        setSelectedEventType(isSelected ? null : event.type);
                        Vibration.vibrate(10);
                      }}
                    >
                      <EventIcon type={event.type} size={22} color={event.color} />
                      <Text style={[styles.quickEventLabel, { color: isSelected ? event.color : colors.text }]}>
                        {t(event.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Player Selection - Inline Horizontal */}
        {canAddEvents && selectedTeamId && (
          <View style={styles.section}>
            <View style={[styles.sectionHeaderRow, { flexDirection }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('operator.player')}
              </Text>
              {selectedPlayer && (
                <TouchableOpacity onPress={() => setSelectedPlayer(null)}>
                  <Text style={[styles.clearText, { color: colors.accent }]}>
                    {t('operator.clear')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Selected Player Banner */}
            {selectedPlayer && (
              <View style={[styles.selectedBanner, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
                <View style={[styles.playerBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.playerBadgeNum}>{selectedPlayer.shirtNumber || '-'}</Text>
                </View>
                <Text style={[styles.selectedName, { color: colors.text }]}>{selectedPlayer.name}</Text>
                <TouchableOpacity onPress={() => setSelectedPlayer(null)}>
                  <Ionicons name="close-circle" size={20} color={colors.accent} />
                </TouchableOpacity>
              </View>
            )}

            {/* Substitution: Secondary Player */}
            {selectedEventType === 'substitution' && (
              <>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                  {t('operator.substituteIn')}
                </Text>
                {secondaryPlayer ? (
                  <View style={[styles.selectedBanner, { backgroundColor: '#2196F3' + '15', borderColor: '#2196F3' }]}>
                    <View style={[styles.playerBadge, { backgroundColor: '#2196F3' }]}>
                      <Text style={styles.playerBadgeNum}>{secondaryPlayer.shirtNumber || '-'}</Text>
                    </View>
                    <Text style={[styles.selectedName, { color: colors.text }]}>{secondaryPlayer.name}</Text>
                    <TouchableOpacity onPress={() => setSecondaryPlayer(null)}>
                      <Ionicons name="close-circle" size={20} color="#2196F3" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.selectSubBtn, { backgroundColor: colors.surface, borderColor: '#2196F3' }]}
                    onPress={() => { setSelectingSecondary(true); setShowPlayerModal(true); }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#2196F3" />
                    <Text style={{ color: '#2196F3', fontSize: 12, fontWeight: '600' }}>
                      {t('operator.selectSub')}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Horizontal Players List */}
            {teamPlayers.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersScroll}>
                {teamPlayers.map((player: Player) => {
                  const isActive = selectedPlayer?.id === player.id;
                  return (
                    <TouchableOpacity
                      key={player.id}
                      activeOpacity={0.6}
                      style={[
                        styles.playerCard,
                        { backgroundColor: isActive ? colors.accent + '20' : colors.surface },
                        isActive && { borderColor: colors.accent, borderWidth: 1.5 },
                      ]}
                      onPress={() => {
                        if (selectingSecondary) {
                          setSecondaryPlayer(player);
                          setSelectingSecondary(false);
                        } else {
                          setSelectedPlayer(player);
                          setSelectedTeamId(player.teamId);
                        }
                        Vibration.vibrate(10);
                      }}
                    >
                      <View style={[styles.playerNum, { backgroundColor: isActive ? colors.accent : colors.accent + '20' }]}>
                        <Text style={[styles.playerNumText, { color: isActive ? '#fff' : colors.accent }]}>
                          {player.shirtNumber || '-'}
                        </Text>
                      </View>
                      <Text style={[styles.playerCardName, { color: colors.text }]} numberOfLines={1}>
                        {player.name?.split(' ').pop() || player.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={[styles.noPlayersBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="people-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.noPlayersText, { color: colors.textTertiary }]}>
                  {t('operator.noPlayers')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Field Position (Collapsible) */}
        {canAddEvents && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.fieldToggle, { backgroundColor: colors.surface }]}
              onPress={() => setShowField(!showField)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.fieldToggleText, { color: colors.textSecondary }]}>
                  {t('operator.eventPosition')}
                </Text>
                {fieldPosition && (
                  <View style={[styles.positionDot, { backgroundColor: colors.accent }]} />
                )}
              </View>
              <Ionicons name={showField ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            {showField && (
              <View style={{ marginTop: SPACING.xs }}>
                <FootballFieldOperator
                  events={match.events || []}
                  onFieldPress={handleFieldPress}
                  selectedPosition={fieldPosition}
                />
              </View>
            )}
          </View>
        )}

        {/* Recent Events Feed */}
        {match.events && match.events.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {t('operator.recentEvents')}
            </Text>
            {match.events.slice(0, 5).map((event, idx) => {
              const evtConfig = EVENT_TYPES[event.type];
              return (
                <View key={event.id || idx} style={[styles.recentEventRow, { backgroundColor: colors.surface, flexDirection }]}>
                  <EventIcon type={event.type} size={16} color={evtConfig?.color || '#607D8B'} />
                  <Text style={[styles.recentEventMinute, { color: colors.textSecondary }]}>{event.minute}'</Text>
                  <Text style={[styles.recentEventText, { color: colors.text }]} numberOfLines={1}>
                    {t(`events.${event.type}`) || evtConfig?.label || event.type}
                    {event.player ? ` - ${event.player.name}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Submit Button */}
      {canAddEvents && selectedEventType && (
        <View style={[styles.floatingBar, { backgroundColor: colors.background }]}>
          <View style={[styles.floatingBarContent, { flexDirection }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <EventIcon type={selectedEventType} size={20} color={QUICK_EVENTS.find(e => e.type === selectedEventType)?.color || MORE_EVENTS.find(e => e.type === selectedEventType)?.color || '#607D8B'} />
              <View>
                <Text style={[styles.floatingEventName, { color: colors.text }]}>
                  {t(`events.${selectedEventType}`) || selectedEventType}
                </Text>
                <Text style={[styles.floatingEventMeta, { color: colors.textTertiary }]}>
                  {autoMinute}' {selectedPlayer ? `· ${selectedPlayer.name}` : ''} {currentTeam ? `· ${currentTeam.shortName}` : ''}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.floatingResetBtn, { borderColor: colors.border }]} onPress={resetForm}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.floatingSubmitBtn, loading && { opacity: 0.5 }]}
                onPress={handleSubmitEvent}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.floatingSubmitText}>{t('operator.send')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Player Selection Modal */}
      <Modal visible={showPlayerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { flexDirection, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('operator.selectPlayer')}
              </Text>
              <TouchableOpacity onPress={() => { setShowPlayerModal(false); setSelectingSecondary(false); }}>
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

      {/* Stoppage Time Input Modal */}
      <Modal visible={showStoppageModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.stoppageModalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.stoppageModalTitle, { color: colors.text }]}>
              {t('operator.addStoppage')}
            </Text>
            <Text style={[styles.stoppageModalDesc, { color: colors.textSecondary }]}>
              {t('operator.stoppageMinutes')}
            </Text>
            <TextInput
              style={[styles.stoppageInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={stoppageInput}
              onChangeText={setStoppageInput}
              keyboardType="number-pad"
              placeholder="1-30"
              placeholderTextColor={colors.textTertiary}
              maxLength={2}
              autoFocus
            />
            <View style={[styles.stoppageActions, { flexDirection }]}>
              <TouchableOpacity
                style={[styles.stoppageCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowStoppageModal(false)}
              >
                <Text style={[styles.stoppageCancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stoppageSubmitBtn}
                onPress={handleSubmitStoppage}
              >
                <Text style={styles.stoppageSubmitText}>{t('operator.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + SPACING.xs,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minuteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  minuteDisplay: {
    fontSize: 24,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  teamChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(128,128,128,0.1)',
    alignItems: 'center',
  },
  teamChipName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreCenterBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 3,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: 3,
  },
  statusPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg + 2,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickEventsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  quickEventBtn: {
    width: '18.5%',
    aspectRatio: 0.85,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quickEventLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  moreEventsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
    gap: 4,
  },
  moreEventsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  playerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBadgeNum: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  selectedName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  selectSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  playersScroll: {
    marginBottom: SPACING.xs,
  },
  playerCard: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    width: 78,
    marginRight: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  playerNum: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerNumText: {
    fontSize: 15,
    fontWeight: '800',
  },
  playerCardName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  noPlayersBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  noPlayersText: {
    fontSize: 11,
    fontWeight: '500',
  },
  fieldToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  fieldToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: 3,
    gap: SPACING.sm,
  },
  recentEventMinute: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 32,
  },
  recentEventText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.md,
    ...SHADOWS.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  floatingBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingEventName: {
    fontSize: 15,
    fontWeight: '700',
  },
  floatingEventMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  floatingResetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: SPACING.xl,
    height: 40,
    borderRadius: 20,
    gap: 6,
  },
  floatingSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  possessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  possessionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: 4,
  },
  possessionBtnActive: {
    ...SHADOWS.xs,
  },
  possessionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  possessionPct: {
    fontSize: 22,
    fontWeight: '800',
  },
  possessionBarContainer: {
    width: 6,
    height: 50,
    justifyContent: 'center',
  },
  possessionBarBg: {
    width: 6,
    height: 50,
    borderRadius: 3,
    backgroundColor: 'rgba(239,68,68,0.3)',
    overflow: 'hidden',
  },
  possessionBarHome: {
    backgroundColor: '#3B82F6',
    borderRadius: 3,
    height: '100%',
  },
  stoppageModalContent: {
    margin: SPACING.xl,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  stoppageModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  stoppageModalDesc: {
    fontSize: 13,
    marginBottom: SPACING.lg,
  },
  stoppageInput: {
    width: 100,
    height: 50,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  stoppageActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  stoppageCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  stoppageCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stoppageSubmitBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#795548',
    alignItems: 'center',
  },
  stoppageSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
