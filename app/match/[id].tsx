import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
  Platform,
  Share,
  ScrollView,
  InteractionManager,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, FONTS } from '@/constants/Theme';
import { useMatchStore } from '@/store/matchStore';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/services/socket';
import { userApi } from '@/services/api';
import EventTimeline from '@/components/EventTimeline';
import MatchStatsView from '@/components/MatchStatsView';
import LineupView from '@/components/LineupView';
import TeamLogo from '@/components/ui/TeamLogo';
import StandingsView from '@/components/StandingsView';
import { EventItemSkeleton } from '@/components/ui/Skeleton';
import { useRTL } from '@/contexts/RTLContext';
import { useLiveMatchTime } from '@/hooks/useLiveMinute';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24);

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection, direction } = useRTL();
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'stats' | 'field' | 'standings'>('events');
  const [eventsFilter, setEventsFilter] = useState<'key' | 'all'>('key');
  const [refModalVisible, setRefModalVisible] = useState(false);
  const [selectedRefIdx, setSelectedRefIdx] = useState<number | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentMatch = useMatchStore(s => s.currentMatch);
  const fetchMatchById = useMatchStore(s => s.fetchMatchById);
  const isLoading = useMatchStore(s => s.isLoadingMatch);
  const { isAuthenticated } = useAuthStore();
  const { joinMatch, leaveMatch } = useSocket();

  const isLive = currentMatch?.status === 'live' || currentMatch?.status === 'halftime';
  const isFinished = currentMatch?.status === 'finished';
  const liveTime = useLiveMatchTime(currentMatch);

  useEffect(() => {
    if (!id) return;
    const task = InteractionManager.runAfterInteractions(() => {
      fetchMatchById(id);
      joinMatch(id);
    });
    return () => {
      task.cancel();
      if (id) leaveMatch(id);
    };
  }, [id]);

  useEffect(() => {
    if (isLive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [isLive]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) await fetchMatchById(id);
    setRefreshing(false);
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated || !id) return;
    try {
      if (isFavorite) await userApi.removeFavorite(id);
      else await userApi.addFavorite(id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      // silent
    }
  };

  const handleShare = async () => {
    if (!currentMatch) return;
    try {
      await Share.share({
        message: `${currentMatch.homeTeam.name} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${currentMatch.awayTeam.name}`,
      });
    } catch (error) {
      // silent
    }
  };

  const getStatusText = () => {
    if (!currentMatch) return '';
    const key = `match.${currentMatch.status}`;
    const val = t(key);
    return val !== key ? val : currentMatch.status;
  };

  const tabs = [
    { key: 'events' as const, label: t('match.events'), icon: 'list' as keyof typeof Ionicons.glyphMap },
    { key: 'stats' as const, label: t('match.stats'), icon: 'stats-chart' as keyof typeof Ionicons.glyphMap },
    { key: 'field' as const, label: t('match.lineup'), icon: 'football' as keyof typeof Ionicons.glyphMap },
    { key: 'standings' as const, label: t('match.standings'), icon: 'podium' as keyof typeof Ionicons.glyphMap },
  ];

  if (!currentMatch) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={isDark ? ['#0F172A', '#1E293B'] : ['#1E293B', '#334155']} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingWrap}>
          <Ionicons name="football-outline" size={44} color="rgba(255,255,255,0.5)" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  const homeWinning = currentMatch.homeScore > currentMatch.awayScore;
  const awayWinning = currentMatch.awayScore > currentMatch.homeScore;
  const matchReferees = [
    { ref: currentMatch.refereeRef, label: t('match.mainReferee') },
    { ref: currentMatch.assistantReferee1Ref, label: t('match.assistantReferee1') },
    { ref: currentMatch.assistantReferee2Ref, label: t('match.assistantReferee2') },
    { ref: currentMatch.fourthRefereeRef, label: t('match.fourthReferee') },
    { ref: currentMatch.supervisorRef, label: t('match.supervisor') },
  ];
  const compactReferees = matchReferees.filter((item) => item.ref);
  const selectedReferee = selectedRefIdx !== null ? matchReferees[selectedRefIdx] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={isLive
          ? ['#B91C1C', '#991B1B', '#1E293B']
          : [colors.pitch, '#065F46', '#1E293B']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        {/* Top Bar */}
        <View style={[styles.topBar, { flexDirection }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.iconBtn}>
            <Ionicons name={direction === 'rtl' ? 'chevron-forward' : 'chevron-back'} size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.competitionName} numberOfLines={1}>
            {currentMatch.competition?.name || t('match.match')}
          </Text>

          <View style={[styles.topBarActions, { flexDirection }]}>
            {compactReferees.length > 0 && (
              <TouchableOpacity
                style={[styles.refMiniWrap, { flexDirection }]}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedRefIdx(null);
                  setRefModalVisible(true);
                }}
              >
                <Ionicons name="shield-checkmark" size={11} color="rgba(255,255,255,0.65)" />
                <View style={styles.refMiniAvatars}>
                  {compactReferees.slice(0, 3).map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.refMiniAvatarWrap,
                        idx > 0 && styles.refMiniAvatarOverlap,
                        { zIndex: 10 - idx },
                      ]}
                    >
                      {item.ref?.imageUrl ? (
                        <Image source={{ uri: item.ref.imageUrl }} style={styles.refMiniAvatar} />
                      ) : (
                        <View style={styles.refMiniAvatarFallback}>
                          <Ionicons name="person" size={8} color="rgba(255,255,255,0.8)" />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleShare} activeOpacity={0.7} style={styles.iconBtn}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} activeOpacity={0.7} style={styles.iconBtn}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#F87171' : '#fff'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          {/* Home */}
          <View style={styles.teamCol}>
            <TeamLogo
              team={{ name: currentMatch.homeTeam.name, shortName: currentMatch.homeTeam.shortName, logoUrl: currentMatch.homeTeam.logoUrl }}
              size="large"
            />
            <Text style={[styles.teamName, homeWinning && styles.teamNameWin]} numberOfLines={2}>
              {currentMatch.homeTeam.shortName || currentMatch.homeTeam.name}
            </Text>
          </View>

          {/* Center Score */}
          <View style={styles.centerCol}>
            {isFinished || isLive || currentMatch.status === 'halftime' ? (
              <View style={styles.scoreRow}>
                <Text style={[styles.score, homeWinning && styles.scoreWin]}>
                  {currentMatch.homeScore}
                </Text>
                <Text style={styles.scoreDivider}>-</Text>
                <Text style={[styles.score, awayWinning && styles.scoreWin]}>
                  {currentMatch.awayScore}
                </Text>
              </View>
            ) : (
              <Text style={styles.vsText}>{t('match.vs')}</Text>
            )}

            {/* Status */}
            {isLive ? (
              <View style={styles.liveRow}>
                <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                <Text style={styles.liveText}>
                  {liveTime?.displayMinute || t('match.live')}
                </Text>
              </View>
            ) : (
              <Text style={styles.statusLabel}>{getStatusText()}</Text>
            )}

            {currentMatch.status === 'scheduled' && (
              <Text style={styles.timeLabel}>
                {new Date(currentMatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>

          {/* Away */}
          <View style={styles.teamCol}>
            <TeamLogo
              team={{ name: currentMatch.awayTeam.name, shortName: currentMatch.awayTeam.shortName, logoUrl: currentMatch.awayTeam.logoUrl }}
              size="large"
            />
            <Text style={[styles.teamName, awayWinning && styles.teamNameWin]} numberOfLines={2}>
              {currentMatch.awayTeam.shortName || currentMatch.awayTeam.name}
            </Text>
          </View>
        </View>

        {/* Meta: venue */}
        {currentMatch.venue && (
          <View style={[styles.metaRow, { flexDirection }]}> 
            <View style={[styles.metaItem, { flexDirection }]}> 
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.metaText} numberOfLines={1}>{currentMatch.venue}</Text>
            </View>
          </View>
        )}

      </LinearGradient>

      
      {/* ── TAB BAR ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(active ? tab.icon : `${tab.icon}-outline`) as any}
                size={18}
                color={active ? colors.accent : colors.textTertiary}
              />
              <Text style={[
                styles.tabText,
                { color: active ? colors.accent : colors.textTertiary, fontFamily: active ? FONTS.bold : FONTS.medium }
              ]}>
                {tab.label}
              </Text>
              {active && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'events' && (
          <View>
            {(currentMatch.events && currentMatch.events.length > 0) && (
              <View style={[styles.filterRow, { flexDirection }]}>
                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    { borderColor: colors.border },
                    eventsFilter === 'key' && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => setEventsFilter('key')}
                >
                  <Text style={[
                    styles.filterBtnText,
                    { color: eventsFilter === 'key' ? '#fff' : colors.textSecondary },
                  ]}>
                    {t('match.keyEvents')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    { borderColor: colors.border },
                    eventsFilter === 'all' && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => setEventsFilter('all')}
                >
                  <Text style={[
                    styles.filterBtnText,
                    { color: eventsFilter === 'all' ? '#fff' : colors.textSecondary },
                  ]}>
                    {t('match.allEvents')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isLoading ? (
              <EventItemSkeleton />
            ) : (currentMatch.events && currentMatch.events.length > 0) ? (
              <EventTimeline
                events={eventsFilter === 'key'
                  ? currentMatch.events.filter((e: any) => ['goal', 'red_card', 'yellow_card', 'substitution'].includes(e.type))
                  : currentMatch.events
                }
                match={currentMatch}
              />
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="time-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('match.noEvents')}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <MatchStatsView match={currentMatch} />
        )}

        {activeTab === 'field' && (
          <LineupView
            homeLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.homeTeamId)}
            awayLineup={currentMatch.lineups?.find((l: any) => l.teamId === currentMatch.awayTeamId)}
            homeTeam={currentMatch.homeTeam}
            awayTeam={currentMatch.awayTeam}
          />
        )}

        {activeTab === 'standings' && (
          <StandingsView
            competitionId={currentMatch.competitionId}
            competitionName={currentMatch.competition?.name}
            competitionFormat={currentMatch.competition?.format}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={refModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (selectedRefIdx !== null) setSelectedRefIdx(null);
          else setRefModalVisible(false);
        }}
      >
        <View style={styles.refsModalBackdrop}>
          <View style={[styles.refsModalCard, { backgroundColor: colors.surface }]}> 
            <View style={[styles.refsModalHeader, { borderBottomColor: colors.border }]}> 
              {selectedRefIdx !== null ? (
                <TouchableOpacity
                  style={styles.refsModalBackBtn}
                  onPress={() => setSelectedRefIdx(null)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={direction === 'rtl' ? 'chevron-forward' : 'chevron-back'}
                    size={18}
                    color={colors.text}
                  />
                  <Text style={[styles.refsModalBackText, { color: colors.text }]}>{t('common.back')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.refsModalBackPlaceholder} />
              )}

              <Text style={[styles.refsModalTitle, { color: colors.text }]}> 
                {selectedRefIdx !== null ? t('match.referee') : t('match.refereeTeam')}
              </Text>

              <TouchableOpacity
                style={styles.refsModalCloseBtn}
                onPress={() => {
                  setSelectedRefIdx(null);
                  setRefModalVisible(false);
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedReferee ? (
              <View style={styles.refsDetailBody}>
                {selectedReferee.ref?.imageUrl ? (
                  <Image source={{ uri: selectedReferee.ref.imageUrl }} style={styles.refsDetailAvatar} />
                ) : (
                  <View style={[styles.refsDetailAvatarFallback, { backgroundColor: colors.accent + '15' }]}>
                    <Ionicons name="person" size={42} color={colors.accent} />
                  </View>
                )}

                <Text style={[styles.refsDetailName, { color: colors.text }]}> 
                  {selectedReferee.ref?.name || 'غير محدد'}
                </Text>

                <View style={[styles.refsDetailRoleTag, { backgroundColor: colors.accent + '12' }]}> 
                  <Text style={[styles.refsDetailRoleText, { color: colors.accent }]}>
                    {selectedReferee.label}
                  </Text>
                </View>

                {selectedReferee.ref?.refereeType && (
                  <View style={[styles.refsDetailRoleTag, { backgroundColor: selectedReferee.ref.refereeType === 'INTERNATIONAL' ? '#3B82F615' : '#10B98115', marginTop: 6 }]}> 
                    <Text style={[styles.refsDetailRoleText, { color: selectedReferee.ref.refereeType === 'INTERNATIONAL' ? '#3B82F6' : '#10B981' }]}>
                      {selectedReferee.ref.refereeType === 'INTERNATIONAL' ? 'حكم دولي' : 'حكم محلي'}
                    </Text>
                  </View>
                )}

                <View style={[styles.refsDetailInfoRow, { borderColor: colors.border }]}> 
                  <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.refsDetailInfoLabel, { color: colors.textSecondary }]}>
                    {t('referee.nationality')}
                  </Text>
                  <Text style={[styles.refsDetailInfoValue, { color: colors.text }]}> 
                    {selectedReferee.ref?.nationality || 'غير متوفرة'}
                  </Text>
                </View>
              </View>
            ) : (
              <ScrollView
                style={styles.refsListScroll}
                contentContainerStyle={styles.refsListContent}
                showsVerticalScrollIndicator={false}
              >
                {matchReferees.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.refsListItem, { borderColor: colors.border, backgroundColor: colors.background }]}
                    activeOpacity={0.75}
                    onPress={() => setSelectedRefIdx(idx)}
                  >
                    {item.ref?.imageUrl ? (
                      <Image source={{ uri: item.ref.imageUrl }} style={styles.refsListAvatar} />
                    ) : (
                      <View style={[styles.refsListAvatarFallback, { backgroundColor: colors.accent + '10' }]}> 
                        <Ionicons name="person" size={16} color={colors.accent} />
                      </View>
                    )}

                    <View style={styles.refsListTextWrap}>
                      <Text style={[styles.refsListLabel, { color: colors.textSecondary }]}> 
                        {item.label}
                      </Text>
                      <Text style={[styles.refsListName, { color: colors.text }]}> 
                        {item.ref?.name || 'غير محدد'}
                      </Text>
                    </View>

                    {item.ref?.refereeType && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: item.ref.refereeType === 'INTERNATIONAL' ? '#3B82F615' : '#10B98115', marginRight: 6 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Cairo-Bold', color: item.ref.refereeType === 'INTERNATIONAL' ? '#3B82F6' : '#10B981' }}>
                          {item.ref.refereeType === 'INTERNATIONAL' ? 'دولي' : 'محلي'}
                        </Text>
                      </View>
                    )}

                    <Ionicons name={direction === 'rtl' ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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

  // ── Header ──
  header: {
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: SPACING.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  competitionName: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 6,
  },
  refMiniWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 2,
  },
  refMiniAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refMiniAvatarWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  refMiniAvatarOverlap: {
    marginLeft: -4,
  },
  refMiniAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  refMiniAvatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  refsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  refsModalCard: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
    minHeight: '56%',
    overflow: 'hidden',
  },
  refsModalHeader: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  refsModalBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  refsModalBackText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  refsModalBackPlaceholder: {
    minWidth: 72,
  },
  refsModalTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  refsModalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refsListScroll: {
    flex: 1,
  },
  refsListContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  refsListItem: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  refsListAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  refsListAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refsListTextWrap: {
    flex: 1,
  },
  refsListLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginBottom: 1,
  },
  refsListName: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  refsDetailBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  refsDetailAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: SPACING.md,
  },
  refsDetailAvatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  refsDetailName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  refsDetailRoleTag: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  refsDetailRoleText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  refsDetailInfoRow: {
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  refsDetailInfoLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  refsDetailInfoValue: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },

  // ── Score ──
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  teamName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 100,
  },
  teamNameWin: {
    color: '#4ADE80',
  },
  centerCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    minWidth: 100,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  score: {
    fontSize: 36,
    color: '#fff',
    fontFamily: FONTS.extraBold,
  },
  scoreWin: {
    color: '#4ADE80',
  },
  scoreDivider: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: FONTS.regular,
    marginTop: -2,
  },
  vsText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(239,68,68,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 6,
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },

  // ── Meta ──
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontFamily: FONTS.regular,
  },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 3,
    position: 'relative',
  },
  tabText: {
    fontSize: 12,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: 24,
    borderRadius: 2,
  },

  // ── Content ──
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  // ── Filter ──
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterBtn: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterBtnText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  // ── Empty ──
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },

  // ── Loading ──
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.medium,
  },
});
