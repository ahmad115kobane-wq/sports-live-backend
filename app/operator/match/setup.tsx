import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { operatorApi } from '@/services/api';
import { Player } from '@/types';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import TeamLogo from '@/components/ui/TeamLogo';
import { getCategoryRules, getFormationPositions } from '@/constants/categoryRules';

interface SelectedPlayer {
  playerId: string;
  player: Player;
  isStarter: boolean;
  isCaptain: boolean;
  position?: string;
  positionX?: number;
  positionY?: number;
}

export default function MatchSetupScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [homeFormation, setHomeFormation] = useState('4-4-2');
  const [awayFormation, setAwayFormation] = useState('4-4-2');
  const [homeStarters, setHomeStarters] = useState<SelectedPlayer[]>([]);
  const [awayStarters, setAwayStarters] = useState<SelectedPlayer[]>([]);
  const [homeSubs, setHomeSubs] = useState<SelectedPlayer[]>([]);
  const [awaySubs, setAwaySubs] = useState<SelectedPlayer[]>([]);
  const [homeCaptainId, setHomeCaptainId] = useState<string | null>(null);
  const [awayCaptainId, setAwayCaptainId] = useState<string | null>(null);
  const [homeCoach, setHomeCoach] = useState('');
  const [awayCoach, setAwayCoach] = useState('');
  const [referee, setReferee] = useState('');
  const [assistantReferee1, setAssistantReferee1] = useState('');
  const [assistantReferee2, setAssistantReferee2] = useState('');
  const [fourthReferee, setFourthReferee] = useState('');

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const response = await operatorApi.getMatch(matchId!);
      const m = response.data.data;
      setMatch(m);
      setReferee(m.referee || '');
      setAssistantReferee1(m.assistantReferee1 || '');
      setAssistantReferee2(m.assistantReferee2 || '');
      setFourthReferee(m.fourthReferee || '');

      // Set default formation based on category
      const cat = m.homeTeam?.category || 'FOOTBALL';
      const rules = getCategoryRules(cat);
      const defaultFormation = rules.formations[0] || '4-4-2';
      setHomeFormation(defaultFormation);
      setAwayFormation(defaultFormation);

      // Load existing lineups if any
      if (m.lineups) {
        for (const lineup of m.lineups) {
          const isHome = lineup.teamId === m.homeTeamId;
          if (lineup.formation) {
            if (isHome) setHomeFormation(lineup.formation);
            else setAwayFormation(lineup.formation);
          }
          if (lineup.coach) {
            if (isHome) setHomeCoach(lineup.coach);
            else setAwayCoach(lineup.coach);
          }
          if (lineup.players) {
            const starters: SelectedPlayer[] = [];
            const subs: SelectedPlayer[] = [];
            for (const lp of lineup.players) {
              const sp: SelectedPlayer = {
                playerId: lp.playerId,
                player: lp.player,
                isStarter: lp.isStarter,
                isCaptain: lp.isCaptain,
                position: lp.position,
                positionX: lp.positionX,
                positionY: lp.positionY,
              };
              if (lp.isStarter) starters.push(sp);
              else subs.push(sp);
            }
            if (isHome) {
              setHomeStarters(starters);
              setHomeSubs(subs);
              const cap = starters.find(s => s.isCaptain);
              if (cap) setHomeCaptainId(cap.playerId);
            } else {
              setAwayStarters(starters);
              setAwaySubs(subs);
              const cap = starters.find(s => s.isCaptain);
              if (cap) setAwayCaptainId(cap.playerId);
            }
          }
        }
      }
    } catch (error) {
      alert(t('common.error'), t('operator.failedLoadMatch'));
    } finally {
      setLoading(false);
    }
  };

  const currentFormation = selectedTeam === 'home' ? homeFormation : awayFormation;
  const setCurrentFormation = selectedTeam === 'home' ? setHomeFormation : setAwayFormation;
  const currentStarters = selectedTeam === 'home' ? homeStarters : awayStarters;
  const setCurrentStarters = selectedTeam === 'home' ? setHomeStarters : setAwayStarters;
  const currentSubs = selectedTeam === 'home' ? homeSubs : awaySubs;
  const setCurrentSubs = selectedTeam === 'home' ? setHomeSubs : setAwaySubs;
  const currentCaptainId = selectedTeam === 'home' ? homeCaptainId : awayCaptainId;
  const setCurrentCaptainId = selectedTeam === 'home' ? setHomeCaptainId : setAwayCaptainId;
  const currentCoach = selectedTeam === 'home' ? homeCoach : awayCoach;
  const setCurrentCoach = selectedTeam === 'home' ? setHomeCoach : setAwayCoach;
  const currentTeam = selectedTeam === 'home' ? match?.homeTeam : match?.awayTeam;
  const teamColor = selectedTeam === 'home' ? '#3B82F6' : '#EF4444';
  const category = match?.homeTeam?.category || 'FOOTBALL';
  const categoryRules = getCategoryRules(category);
  const FORMATIONS = categoryRules.formations;
  const maxStarters = categoryRules.maxStarters;

  const allPlayers: Player[] = currentTeam?.players || [];
  const selectedIds = new Set([
    ...currentStarters.map(s => s.playerId),
    ...currentSubs.map(s => s.playerId),
  ]);
  const availablePlayers = allPlayers.filter(p => !selectedIds.has(p.id));

  const toggleStarter = (player: Player) => {
    const isAlreadyStarter = currentStarters.find(s => s.playerId === player.id);
    if (isAlreadyStarter) {
      setCurrentStarters(currentStarters.filter(s => s.playerId !== player.id));
      if (currentCaptainId === player.id) setCurrentCaptainId(null);
      return;
    }

    const isAlreadySub = currentSubs.find(s => s.playerId === player.id);
    if (isAlreadySub) {
      setCurrentSubs(currentSubs.filter(s => s.playerId !== player.id));
      return;
    }

    // Add as starter if slots available, else as sub
    const positions = getFormationPositions(category, currentFormation);
    if (currentStarters.length < maxStarters && currentStarters.length < positions.length) {
      const posIdx = currentStarters.length;
      const pos = positions[posIdx];
      setCurrentStarters([...currentStarters, {
        playerId: player.id,
        player,
        isStarter: true,
        isCaptain: false,
        position: pos?.pos,
        positionX: pos?.x,
        positionY: pos?.y,
      }]);
    } else {
      setCurrentSubs([...currentSubs, {
        playerId: player.id,
        player,
        isStarter: false,
        isCaptain: false,
      }]);
    }
    Vibration.vibrate(10);
  };

  const toggleSub = (player: Player) => {
    const isAlreadySub = currentSubs.find(s => s.playerId === player.id);
    if (isAlreadySub) {
      setCurrentSubs(currentSubs.filter(s => s.playerId !== player.id));
      return;
    }
    const isAlreadyStarter = currentStarters.find(s => s.playerId === player.id);
    if (isAlreadyStarter) {
      setCurrentStarters(currentStarters.filter(s => s.playerId !== player.id));
      if (currentCaptainId === player.id) setCurrentCaptainId(null);
    }
    setCurrentSubs([...currentSubs, {
      playerId: player.id,
      player,
      isStarter: false,
      isCaptain: false,
    }]);
    Vibration.vibrate(10);
  };

  const toggleCaptain = (playerId: string) => {
    setCurrentCaptainId(currentCaptainId === playerId ? null : playerId);
    Vibration.vibrate(10);
  };

  const handleFormationChange = (formation: string) => {
    setCurrentFormation(formation);
    // Re-assign positions to existing starters
    const positions = getFormationPositions(category, formation);
    const updated = currentStarters.map((s, i) => ({
      ...s,
      position: positions[i]?.pos || s.position,
      positionX: positions[i]?.x || s.positionX,
      positionY: positions[i]?.y || s.positionY,
    }));
    setCurrentStarters(updated);
  };

  const handleSave = async () => {
    if (!match) return;

    setSaving(true);
    try {
      // Save home lineup
      const homePositions = getFormationPositions(category, homeFormation);
      const homePlayers = [
        ...homeStarters.map((s, i) => ({
          playerId: s.playerId,
          position: homePositions[i]?.pos || s.position || 'SUB',
          positionX: homePositions[i]?.x || s.positionX || 50,
          positionY: homePositions[i]?.y || s.positionY || 50,
          isStarter: true,
          isCaptain: s.playerId === homeCaptainId,
        })),
        ...homeSubs.map(s => ({
          playerId: s.playerId,
          position: s.player?.position || 'SUB',
          positionX: 0,
          positionY: 0,
          isStarter: false,
          isCaptain: false,
        })),
      ];

      await operatorApi.saveLineup(match.id, match.homeTeamId, {
        formation: homeFormation,
        coach: homeCoach || undefined,
        players: homePlayers,
      });

      // Save away lineup
      const awayPositions = getFormationPositions(category, awayFormation);
      const awayPlayers = [
        ...awayStarters.map((s, i) => ({
          playerId: s.playerId,
          position: awayPositions[i]?.pos || s.position || 'SUB',
          positionX: awayPositions[i]?.x || s.positionX || 50,
          positionY: awayPositions[i]?.y || s.positionY || 50,
          isStarter: true,
          isCaptain: s.playerId === awayCaptainId,
        })),
        ...awaySubs.map(s => ({
          playerId: s.playerId,
          position: s.player?.position || 'SUB',
          positionX: 0,
          positionY: 0,
          isStarter: false,
          isCaptain: false,
        })),
      ];

      await operatorApi.saveLineup(match.id, match.awayTeamId, {
        formation: awayFormation,
        coach: awayCoach || undefined,
        players: awayPlayers,
      });

      // Update referees if changed
      const refereesChanged = referee !== (match.referee || '') ||
        assistantReferee1 !== (match.assistantReferee1 || '') ||
        assistantReferee2 !== (match.assistantReferee2 || '') ||
        fourthReferee !== (match.fourthReferee || '');
      if (refereesChanged) {
        try {
          await operatorApi.updateReferees(match.id, {
            referee: referee || undefined,
            assistantReferee1: assistantReferee1 || undefined,
            assistantReferee2: assistantReferee2 || undefined,
            fourthReferee: fourthReferee || undefined,
          });
        } catch (e) {
          // Referee update is optional
        }
      }

      Vibration.vibrate(50);
      alert(t('common.success'), t('operator.lineupSaved'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error: any) {
      alert(t('common.error'), error.response?.data?.message || t('operator.failedSaveLineup'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !match) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('operator.matchSetup')}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t('operator.save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Match Info */}
        <View style={[styles.matchInfo, { flexDirection }]}>
          <View style={styles.matchTeamCol}>
            <TeamLogo team={match.homeTeam} size="small" />
            <Text style={[styles.matchTeamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
              {match.homeTeam.shortName}
            </Text>
          </View>
          <Text style={[styles.matchVs, { color: colors.textTertiary }]}>{t('match.vs')}</Text>
          <View style={styles.matchTeamCol}>
            <TeamLogo team={match.awayTeam} size="small" />
            <Text style={[styles.matchTeamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
              {match.awayTeam.shortName}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Referees Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            {'  '}الحكام
          </Text>
          <View style={{ gap: SPACING.sm }}>
            <View>
              <Text style={[styles.refereeLabel, { color: colors.textSecondary }]}>حكم الساحة</Text>
              <TextInput
                style={[styles.refereeInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={referee}
                onChangeText={setReferee}
                placeholder="اسم حكم الساحة"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View>
              <Text style={[styles.refereeLabel, { color: colors.textSecondary }]}>الحكم المساعد الأول</Text>
              <TextInput
                style={[styles.refereeInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={assistantReferee1}
                onChangeText={setAssistantReferee1}
                placeholder="اسم الحكم المساعد الأول"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View>
              <Text style={[styles.refereeLabel, { color: colors.textSecondary }]}>الحكم المساعد الثاني</Text>
              <TextInput
                style={[styles.refereeInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={assistantReferee2}
                onChangeText={setAssistantReferee2}
                placeholder="اسم الحكم المساعد الثاني"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View>
              <Text style={[styles.refereeLabel, { color: colors.textSecondary }]}>الحكم الاحتياطي</Text>
              <TextInput
                style={[styles.refereeInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={fourthReferee}
                onChangeText={setFourthReferee}
                placeholder="اسم الحكم الاحتياطي"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Team Selector */}
        <View style={styles.section}>
          <View style={[styles.teamSelector, { backgroundColor: colors.surface, flexDirection }]}>
            <TouchableOpacity
              style={[styles.teamTab, selectedTeam === 'home' && { backgroundColor: '#3B82F6' + '25' }]}
              onPress={() => setSelectedTeam('home')}
            >
              <TeamLogo team={match.homeTeam} size="small" />
              <Text style={[styles.teamTabText, { color: selectedTeam === 'home' ? '#3B82F6' : colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                {match.homeTeam.shortName}
              </Text>
              <View style={[styles.countBadge, { backgroundColor: selectedTeam === 'home' ? '#3B82F6' : colors.backgroundSecondary }]}>
                <Text style={[styles.countBadgeText, { color: selectedTeam === 'home' ? '#fff' : colors.textSecondary }]}>
                  {homeStarters.length}/{maxStarters}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.tabDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={[styles.teamTab, selectedTeam === 'away' && { backgroundColor: '#EF4444' + '25' }]}
              onPress={() => setSelectedTeam('away')}
            >
              <TeamLogo team={match.awayTeam} size="small" />
              <Text style={[styles.teamTabText, { color: selectedTeam === 'away' ? '#EF4444' : colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                {match.awayTeam.shortName}
              </Text>
              <View style={[styles.countBadge, { backgroundColor: selectedTeam === 'away' ? '#EF4444' : colors.backgroundSecondary }]}>
                <Text style={[styles.countBadgeText, { color: selectedTeam === 'away' ? '#fff' : colors.textSecondary }]}>
                  {awayStarters.length}/{maxStarters}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coach Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="person" size={16} color={colors.textSecondary} />
            {'  '}{t('match.coach')}
          </Text>
          <TextInput
            style={[styles.refereeInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            value={currentCoach}
            onChangeText={setCurrentCoach}
            placeholder={t('operator.coachPlaceholder')}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Formation Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="grid-outline" size={16} color={colors.textSecondary} />
            {'  '}{t('operator.formation')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.formationRow}>
              {FORMATIONS.map((f) => {
                const isActive = currentFormation === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.formationChip,
                      { backgroundColor: isActive ? teamColor : colors.surface, borderColor: isActive ? teamColor : colors.border },
                    ]}
                    onPress={() => handleFormationChange(f)}
                  >
                    <Text style={[styles.formationChipText, { color: isActive ? '#fff' : colors.text }]}>{f}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Starters Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, { flexDirection }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="people" size={16} color={teamColor} />
              {'  '}{t('operator.starters')} ({currentStarters.length}/{maxStarters})
            </Text>
            {currentStarters.length > 0 && (
              <TouchableOpacity onPress={() => { setCurrentStarters([]); setCurrentCaptainId(null); }}>
                <Text style={[styles.clearAllText, { color: colors.accent }]}>{t('operator.clearAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {currentStarters.length > 0 ? (
            <View style={styles.playersList}>
              {currentStarters.map((sp, idx) => {
                const positions = getFormationPositions(category, currentFormation);
                const pos = positions[idx];
                return (
                  <View key={sp.playerId} style={[styles.playerRow, { backgroundColor: colors.surface, flexDirection }]}>
                    <View style={[styles.posLabel, { backgroundColor: teamColor + '20' }]}>
                      <Text style={[styles.posLabelText, { color: teamColor }]}>{pos?.pos || '-'}</Text>
                    </View>
                    <View style={[styles.shirtNum, { backgroundColor: teamColor }]}>
                      <Text style={styles.shirtNumText}>{sp.player?.shirtNumber || '-'}</Text>
                    </View>
                    <Text style={[styles.playerRowName, { color: colors.text }]} numberOfLines={2}>{sp.player?.name}</Text>
                    <TouchableOpacity
                      style={[styles.captainBtn, currentCaptainId === sp.playerId && { backgroundColor: '#FFD700' }]}
                      onPress={() => toggleCaptain(sp.playerId)}
                    >
                      <Text style={[styles.captainBtnText, { color: currentCaptainId === sp.playerId ? '#000' : colors.textTertiary }]}>C</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleStarter(sp.player)}>
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="people-outline" size={24} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('operator.selectStarters')}</Text>
            </View>
          )}
        </View>

        {/* Substitutes Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, { flexDirection }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="swap-horizontal" size={16} color="#F59E0B" />
              {'  '}{t('operator.substitutes')} ({currentSubs.length})
            </Text>
            {currentSubs.length > 0 && (
              <TouchableOpacity onPress={() => setCurrentSubs([])}>
                <Text style={[styles.clearAllText, { color: colors.accent }]}>{t('operator.clearAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {currentSubs.length > 0 ? (
            <View style={styles.playersList}>
              {currentSubs.map((sp) => (
                <View key={sp.playerId} style={[styles.playerRow, { backgroundColor: colors.surface, flexDirection }]}>
                  <View style={[styles.posLabel, { backgroundColor: '#F59E0B' + '20' }]}>
                    <Text style={[styles.posLabelText, { color: '#F59E0B' }]}>SUB</Text>
                  </View>
                  <View style={[styles.shirtNum, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.shirtNumText}>{sp.player?.shirtNumber || '-'}</Text>
                  </View>
                  <Text style={[styles.playerRowName, { color: colors.text }]} numberOfLines={2}>{sp.player?.name}</Text>
                  <TouchableOpacity onPress={() => toggleSub(sp.player)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('operator.noSubsYet')}</Text>
            </View>
          )}
        </View>

        {/* Available Players */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="list" size={16} color={colors.textSecondary} />
            {'  '}{t('operator.availablePlayers')} ({availablePlayers.length})
          </Text>
          <View style={styles.playersList}>
            {availablePlayers.map((player) => (
              <View key={player.id} style={[styles.availableRow, { backgroundColor: colors.surface, flexDirection }]}>
                <View style={[styles.shirtNum, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.shirtNumText, { color: colors.text }]}>{player.shirtNumber || '-'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerRowName, { color: colors.text }]} numberOfLines={2}>{player.name}</Text>
                  <Text style={[styles.playerRowPos, { color: colors.textTertiary }]}>
                    {player.position ? t(`positions.${player.position}`) : '-'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addStarterBtn, { backgroundColor: teamColor + '15', borderColor: teamColor }]}
                  onPress={() => toggleStarter(player)}
                  disabled={currentStarters.length >= 11}
                >
                  <Ionicons name="add" size={16} color={teamColor} />
                  <Text style={[styles.addBtnLabel, { color: teamColor }]}>{t('operator.starter')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addSubBtn, { backgroundColor: '#F59E0B' + '15', borderColor: '#F59E0B' }]}
                  onPress={() => toggleSub(player)}
                >
                  <Ionicons name="add" size={16} color="#F59E0B" />
                  <Text style={[styles.addBtnLabel, { color: '#F59E0B' }]}>{t('operator.sub')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + SPACING.xs,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(128,128,128,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  matchTeamCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  matchTeamName: {
    fontSize: 13,
    fontWeight: '600',
  },
  matchVs: {
    fontSize: 14,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.bold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  refereeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
    fontFamily: FONTS.semiBold,
  },
  refereeInput: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
    fontFamily: FONTS.medium,
  },
  teamSelector: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
  },
  teamTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  teamTabText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    fontFamily: FONTS.bold,
  },
  tabDivider: {
    width: 1,
    marginVertical: SPACING.sm,
  },
  countBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  formationRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  formationChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  formationChipText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  playersList: {
    gap: SPACING.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  posLabel: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  posLabelText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  shirtNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shirtNumText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  playerRowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  playerRowPos: {
    fontSize: 11,
    marginTop: 1,
    fontFamily: FONTS.regular,
  },
  captainBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captainBtnText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: FONTS.extraBold,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  addStarterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 2,
  },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 2,
  },
  addBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
