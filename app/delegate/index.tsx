import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import { useAuthStore } from '@/store/authStore';
import { delegateApi, refereeApi, matchApi } from '@/services/api';
import { router } from 'expo-router';
import AppModal from '@/components/ui/AppModal';
import AppDialog from '@/components/ui/AppDialog';
import TeamLogo from '@/components/ui/TeamLogo';

interface Competition {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  matchCount: number;
  teamCount: number;
  teams: { id: string; name: string; shortName: string; logoUrl?: string }[];
  assignedOperators?: { id: string; name: string; email: string }[];
  assignedReferees?: { id: string; name: string; refereeType?: string }[];
}

interface Match {
  id: string;
  homeTeam: any;
  awayTeam: any;
  competition: any;
  startTime: string;
  status: string;
  homeScore: number;
  awayScore: number;
  venue?: string;
  refereeId?: string;
  refereeRef?: any;
  assistantReferee1Id?: string;
  assistantReferee1Ref?: any;
  assistantReferee2Id?: string;
  assistantReferee2Ref?: any;
  fourthRefereeId?: string;
  fourthRefereeRef?: any;
  supervisorId?: string;
  supervisorRef?: any;
  operators?: any[];
  isFeatured?: boolean;
}

export default function DelegateScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();
  const { user } = useAuthStore();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Create match form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createHomeTeamId, setCreateHomeTeamId] = useState('');
  const [createAwayTeamId, setCreateAwayTeamId] = useState('');
  const [createVenue, setCreateVenue] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createOperatorId, setCreateOperatorId] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit match
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editVenue, setEditVenue] = useState('');
  const [editRefereeId, setEditRefereeId] = useState('');
  const [editAssistant1Id, setEditAssistant1Id] = useState('');
  const [editAssistant2Id, setEditAssistant2Id] = useState('');
  const [editFourthId, setEditFourthId] = useState('');
  const [editOperatorId, setEditOperatorId] = useState('');
  const [saving, setSaving] = useState(false);

  // Referee picker
  const [showRefereePicker, setShowRefereePicker] = useState<string | null>(null);

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<any>({});

  useEffect(() => {
    loadCompetitions();
    loadReferees();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const res = await delegateApi.getMyCompetitions();
      const comps = res.data?.data || [];
      setCompetitions(comps);
      if (comps.length === 1 && !selectedCompetition) {
        setSelectedCompetition(comps[0]);
        loadMatches(comps[0].id);
      }
    } catch (error) {
      console.error('Load competitions error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadReferees = async () => {
    // Referees are now loaded from the competition's assignedReferees
    // Fallback to all referees if none assigned
    if (selectedCompetition?.assignedReferees && selectedCompetition.assignedReferees.length > 0) {
      setReferees(selectedCompetition.assignedReferees);
    } else {
      try {
        const res = await refereeApi.getAll();
        setReferees(res.data?.data || []);
      } catch (e) {}
    }
  };

  const loadMatches = async (competitionId: string) => {
    try {
      setMatchesLoading(true);
      const res = await delegateApi.getCompetitionMatches(competitionId);
      setMatches(res.data?.data || []);
    } catch (error) {
      console.error('Load matches error:', error);
    } finally {
      setMatchesLoading(false);
    }
  };

  const selectCompetition = (comp: Competition) => {
    setSelectedCompetition(comp);
    loadMatches(comp.id);
    // Load referees based on this competition's assigned referees
    if (comp.assignedReferees && comp.assignedReferees.length > 0) {
      setReferees(comp.assignedReferees);
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedCompetition || !createHomeTeamId || !createAwayTeamId || !createDate) {
      alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    try {
      setCreating(true);
      await delegateApi.createMatch(selectedCompetition.id, {
        homeTeamId: createHomeTeamId,
        awayTeamId: createAwayTeamId,
        startTime: new Date(createDate).toISOString(),
        venue: createVenue || undefined,
      });
      // Assign operator if selected
      if (createOperatorId) {
        const matchesRes = await delegateApi.getCompetitionMatches(selectedCompetition.id);
        const newMatches = matchesRes.data?.data || [];
        if (newMatches.length > 0) {
          const latestMatch = newMatches[0];
          await delegateApi.updateMatch(latestMatch.id, { operatorId: createOperatorId });
        }
      }
      setShowCreateModal(false);
      setCreateHomeTeamId('');
      setCreateAwayTeamId('');
      setCreateVenue('');
      setCreateDate('');
      setCreateOperatorId('');
      loadMatches(selectedCompetition.id);
      alert('تم', 'تم إنشاء المباراة بنجاح');
    } catch (error) {
      alert('خطأ', 'فشل في إنشاء المباراة');
    } finally {
      setCreating(false);
    }
  };

  const openEditMatch = (match: Match) => {
    setEditingMatch(match);
    setEditVenue(match.venue || '');
    setEditRefereeId(match.refereeId || '');
    setEditAssistant1Id(match.assistantReferee1Id || '');
    setEditAssistant2Id(match.assistantReferee2Id || '');
    setEditFourthId(match.fourthRefereeId || '');
    setEditOperatorId(match.operators?.[0]?.operator?.id || match.operators?.[0]?.operatorId || '');
    setShowEditModal(true);
  };

  const handleSaveMatch = async () => {
    if (!editingMatch) return;
    try {
      setSaving(true);
      await delegateApi.updateMatch(editingMatch.id, {
        venue: editVenue || null,
        refereeId: editRefereeId || null,
        assistant1Id: editAssistant1Id || null,
        assistant2Id: editAssistant2Id || null,
        fourthId: editFourthId || null,
        operatorId: editOperatorId || null,
      });
      setShowEditModal(false);
      if (selectedCompetition) loadMatches(selectedCompetition.id);
      alert('تم', 'تم حفظ التغييرات');
    } catch (error) {
      alert('خطأ', 'فشل في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMatch = (match: Match) => {
    setDialogConfig({
      type: 'warning',
      title: 'حذف المباراة',
      message: `هل أنت متأكد من حذف ${match.homeTeam?.name || '—'} ضد ${match.awayTeam?.name || '—'}؟`,
      showCancel: true,
      onConfirm: async () => {
        setDialogVisible(false);
        try {
          await delegateApi.deleteMatch(match.id);
          if (selectedCompetition) loadMatches(selectedCompetition.id);
        } catch (error) {
          alert('خطأ', 'فشل في حذف المباراة');
        }
      },
    });
    setDialogVisible(true);
  };

  const getRefereeById = (id: string) => referees.find((r) => r.id === id);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#EF4444';
      case 'finished': return '#6B7280';
      case 'halftime': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'مباشر';
      case 'finished': return 'انتهت';
      case 'halftime': return 'استراحة';
      default: return 'قادمة';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#059669', '#047857', '#065F46']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerRow, { flexDirection }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>لوحة المكلف</Text>
            <Text style={styles.headerSubtitle}>{user?.name || ''}</Text>
          </View>
          {selectedCompetition && (
            <TouchableOpacity style={styles.addMatchBtn} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCompetitions();
              if (selectedCompetition) loadMatches(selectedCompetition.id);
            }}
          />
        }
      >
        {/* Competition Selector */}
        {competitions.length > 1 && (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>البطولات المعينة لك</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {competitions.map((comp) => (
                <TouchableOpacity
                  key={comp.id}
                  style={[
                    styles.compCard,
                    { backgroundColor: colors.card, borderColor: selectedCompetition?.id === comp.id ? '#059669' : colors.cardBorder },
                    selectedCompetition?.id === comp.id && { borderWidth: 2 },
                  ]}
                  onPress={() => selectCompetition(comp)}
                >
                  <Text style={[styles.compName, { color: colors.text }]}>{comp.name}</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{comp.matchCount} مباراة • {comp.teamCount} فريق</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {competitions.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: SPACING.xxl }}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
            <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: SPACING.md }}>لا توجد بطولات معينة لك</Text>
          </View>
        )}

        {/* Single competition info */}
        {selectedCompetition && competitions.length === 1 && (
          <View style={[styles.compInfoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.compInfoTitle, { color: colors.text }]}>{selectedCompetition.name}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
              {selectedCompetition.matchCount} مباراة • {selectedCompetition.teamCount} فريق
            </Text>
          </View>
        )}

        {/* Matches */}
        {selectedCompetition && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.md }]}>المباريات</Text>

            {matchesLoading ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: SPACING.lg }} />
            ) : matches.length === 0 ? (
              <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: SPACING.lg }}>لا توجد مباريات</Text>
            ) : (
              matches.map((match) => (
                <View key={match.id} style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  {/* Status badge */}
                  <View style={[styles.matchHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.matchDate, { color: colors.textTertiary }]}>{formatDate(match.startTime)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(match.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(match.status) }]}>{getStatusText(match.status)}</Text>
                    </View>
                  </View>

                  {/* Teams */}
                  <View style={styles.teamsRow}>
                    <View style={styles.teamCol}>
                      <TeamLogo team={match.homeTeam || { name: '—', shortName: '—' }} size="medium" />
                      <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>{match.homeTeam?.name || '—'}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[styles.score, { color: colors.text }]}>{match.homeScore} - {match.awayScore}</Text>
                    </View>
                    <View style={styles.teamCol}>
                      <TeamLogo team={match.awayTeam || { name: '—', shortName: '—' }} size="medium" />
                      <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>{match.awayTeam?.name || '—'}</Text>
                    </View>
                  </View>

                  {/* Info row */}
                  {(match.venue || match.refereeRef) && (
                    <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                      {match.venue && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{match.venue}</Text>
                        </View>
                      )}
                      {match.refereeRef && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="flag-outline" size={13} color={colors.textTertiary} />
                          <Text style={{ fontSize: 12, color: colors.textTertiary }}>{match.refereeRef.name}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                      onPress={() => openEditMatch(match)}
                    >
                      <Ionicons name="pencil" size={16} color={colors.accent} />
                      <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>تعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
                      onPress={() => handleDeleteMatch(match)}
                    >
                      <Ionicons name="trash" size={16} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Create Match Modal */}
      <AppModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء مباراة" icon="add-circle">
        {selectedCompetition && (
          <ScrollView style={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الفريق المضيف *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {(selectedCompetition.teams || []).map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamPickerItem,
                    { backgroundColor: createHomeTeamId === team.id ? '#05966920' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), borderColor: createHomeTeamId === team.id ? '#059669' : colors.border },
                  ]}
                  onPress={() => setCreateHomeTeamId(team.id)}
                >
                  <TeamLogo team={team} size="small" />
                  <Text style={{ color: colors.text, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>{team.shortName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الفريق الضيف *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              {(selectedCompetition.teams || []).filter((t) => t.id !== createHomeTeamId).map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamPickerItem,
                    { backgroundColor: createAwayTeamId === team.id ? '#05966920' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), borderColor: createAwayTeamId === team.id ? '#059669' : colors.border },
                  ]}
                  onPress={() => setCreateAwayTeamId(team.id)}
                >
                  <TeamLogo team={team} size="small" />
                  <Text style={{ color: colors.text, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>{team.shortName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الملعب</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              value={createVenue}
              onChangeText={setCreateVenue}
              placeholder="اسم الملعب"
              placeholderTextColor={colors.textTertiary}
              textAlign={isRTL ? 'right' : 'left'}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>التاريخ والوقت * (YYYY-MM-DD HH:mm)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              value={createDate}
              onChangeText={setCreateDate}
              placeholder="2026-03-01 18:00"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Operator picker */}
            {(selectedCompetition?.assignedOperators || []).length > 0 && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>مشغل المباراة</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                  {(selectedCompetition?.assignedOperators || []).map((op) => (
                    <TouchableOpacity
                      key={op.id}
                      style={[
                        styles.teamPickerItem,
                        { backgroundColor: createOperatorId === op.id ? '#05966920' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), borderColor: createOperatorId === op.id ? '#059669' : colors.border, width: 100 },
                      ]}
                      onPress={() => setCreateOperatorId(createOperatorId === op.id ? '' : op.id)}
                    >
                      <Ionicons name="radio" size={18} color={createOperatorId === op.id ? '#059669' : colors.textTertiary} />
                      <Text style={{ color: colors.text, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>{op.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#059669' }]}
              onPress={handleCreateMatch}
              disabled={creating}
            >
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>إنشاء المباراة</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </AppModal>

      {/* Edit Match Modal */}
      <AppModal visible={showEditModal} onClose={() => setShowEditModal(false)} title="تعديل المباراة" icon="pencil">
        {editingMatch && (
          <ScrollView style={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
            <Text style={[styles.matchInfoText, { color: colors.textSecondary }]}>
              {editingMatch.homeTeam?.name || '—'} vs {editingMatch.awayTeam?.name || '—'}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الملعب</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
              value={editVenue}
              onChangeText={setEditVenue}
              placeholder="اسم الملعب"
              placeholderTextColor={colors.textTertiary}
              textAlign={isRTL ? 'right' : 'left'}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الحكام</Text>
            {[
              { label: 'الحكم الرئيسي', value: editRefereeId, setter: setEditRefereeId, pickerKey: 'main' },
              { label: 'المساعد الأول', value: editAssistant1Id, setter: setEditAssistant1Id, pickerKey: 'a1' },
              { label: 'المساعد الثاني', value: editAssistant2Id, setter: setEditAssistant2Id, pickerKey: 'a2' },
              { label: 'الحكم الرابع', value: editFourthId, setter: setEditFourthId, pickerKey: 'fourth' },
            ].map((item) => (
              <TouchableOpacity
                key={item.pickerKey}
                style={[styles.refereeSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: item.value ? '#059669' : colors.border }]}
                onPress={() => setShowRefereePicker(item.pickerKey)}
              >
                <Ionicons name="flag" size={14} color={item.value ? '#059669' : colors.textTertiary} />
                <Text style={{ flex: 1, color: item.value ? colors.text : colors.textTertiary, fontSize: 13 }} numberOfLines={1}>
                  {item.value ? (getRefereeById(item.value)?.name || 'حكم محذوف') : item.label}
                </Text>
                {item.value ? (
                  <TouchableOpacity onPress={() => item.setter('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            ))}

            {/* Operator picker */}
            {(selectedCompetition?.assignedOperators || []).length > 0 && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: SPACING.md }]}>مشغل المباراة</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                  <TouchableOpacity
                    style={[
                      styles.teamPickerItem,
                      { backgroundColor: !editOperatorId ? '#EF444420' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), borderColor: !editOperatorId ? '#EF4444' : colors.border, width: 80 },
                    ]}
                    onPress={() => setEditOperatorId('')}
                  >
                    <Ionicons name="close-circle" size={18} color={!editOperatorId ? '#EF4444' : colors.textTertiary} />
                    <Text style={{ color: colors.textTertiary, fontSize: 11 }}>بدون</Text>
                  </TouchableOpacity>
                  {(selectedCompetition?.assignedOperators || []).map((op) => (
                    <TouchableOpacity
                      key={op.id}
                      style={[
                        styles.teamPickerItem,
                        { backgroundColor: editOperatorId === op.id ? '#05966920' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), borderColor: editOperatorId === op.id ? '#059669' : colors.border, width: 100 },
                      ]}
                      onPress={() => setEditOperatorId(op.id)}
                    >
                      <Ionicons name="radio" size={18} color={editOperatorId === op.id ? '#059669' : colors.textTertiary} />
                      <Text style={{ color: colors.text, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>{op.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#059669', marginTop: SPACING.lg }]}
              onPress={handleSaveMatch}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </AppModal>

      {/* Referee Picker Modal */}
      <AppModal
        visible={showRefereePicker !== null}
        onClose={() => setShowRefereePicker(null)}
        title="اختر الحكم"
        icon="flag"
        maxHeight="70%"
      >
        <ScrollView style={{ padding: SPACING.md }}>
          <TouchableOpacity
            style={[styles.refereePickerItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              if (showRefereePicker === 'main') setEditRefereeId('');
              else if (showRefereePicker === 'a1') setEditAssistant1Id('');
              else if (showRefereePicker === 'a2') setEditAssistant2Id('');
              else if (showRefereePicker === 'fourth') setEditFourthId('');
              setShowRefereePicker(null);
            }}
          >
            <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>بدون حكم</Text>
          </TouchableOpacity>
          {referees.map((ref) => (
            <TouchableOpacity
              key={ref.id}
              style={[styles.refereePickerItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (showRefereePicker === 'main') setEditRefereeId(ref.id);
                else if (showRefereePicker === 'a1') setEditAssistant1Id(ref.id);
                else if (showRefereePicker === 'a2') setEditAssistant2Id(ref.id);
                else if (showRefereePicker === 'fourth') setEditFourthId(ref.id);
                setShowRefereePicker(null);
              }}
            >
              {ref.imageUrl ? (
                <Image source={{ uri: ref.imageUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              ) : (
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#05966920', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={18} color="#059669" />
                </View>
              )}
              <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>{ref.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AppModal>

      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText="تأكيد"
        cancelText="إلغاء"
        showCancel={dialogConfig.showCancel}
        onConfirm={dialogConfig.onConfirm || (() => setDialogVisible(false))}
        onCancel={() => setDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', fontFamily: FONTS.bold },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2, fontFamily: FONTS.regular },
  addMatchBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: SPACING.md, fontFamily: FONTS.bold },
  compCard: {
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginRight: SPACING.sm, borderWidth: 1, minWidth: 160,
  },
  compName: { fontSize: 14, fontWeight: '700', marginBottom: 4, fontFamily: FONTS.bold },
  compInfoCard: {
    borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.md,
  },
  compInfoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, fontFamily: FONTS.bold },
  matchCard: { borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.md, overflow: 'hidden' },
  matchHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.sm, borderBottomWidth: 1,
  },
  matchDate: { fontSize: 12, fontFamily: FONTS.regular },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.semiBold },
  teamsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md,
  },
  teamCol: { alignItems: 'center', flex: 1, gap: SPACING.xs },
  teamName: { fontSize: 12, fontWeight: '600', textAlign: 'center', fontFamily: FONTS.semiBold },
  score: { fontSize: 24, fontWeight: '700', fontFamily: FONTS.bold },
  infoRow: {
    flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg,
    paddingVertical: SPACING.sm, borderTopWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row', gap: SPACING.sm, padding: SPACING.sm, borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, padding: SPACING.sm, borderRadius: RADIUS.md,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: SPACING.xs, fontFamily: FONTS.semiBold },
  input: {
    height: 48, borderRadius: RADIUS.md, borderWidth: 1,
    paddingHorizontal: SPACING.md, fontSize: 16, marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  saveBtn: { height: 50, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: FONTS.bold },
  matchInfoText: { fontSize: 14, textAlign: 'center', marginBottom: SPACING.lg, fontFamily: FONTS.regular },
  refereeSelector: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: 10, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.xs,
  },
  refereePickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md, borderBottomWidth: 1, borderRadius: RADIUS.md, marginBottom: SPACING.xs,
  },
  teamPickerItem: {
    alignItems: 'center', gap: 4, padding: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 1, marginRight: SPACING.xs, width: 72,
  },
});
