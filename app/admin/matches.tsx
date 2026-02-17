import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { matchApi, refereeApi } from '@/services/api';
import TeamLogo from '@/components/ui/TeamLogo';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';

interface Referee {
  id: string;
  name: string;
  imageUrl?: string;
  nationality?: string;
}

interface Match {
  id: string;
  homeTeam: { id: string; name: string; shortName: string; logoUrl?: string };
  awayTeam: { id: string; name: string; shortName: string; logoUrl?: string };
  competition: { id: string; name: string };
  homeScore: number;
  awayScore: number;
  status: string;
  startTime: string;
  venue?: string;
  referee?: string;
  refereeId?: string;
  assistantReferee1?: string;
  assistantReferee1Id?: string;
  assistantReferee2?: string;
  assistantReferee2Id?: string;
  fourthReferee?: string;
  fourthRefereeId?: string;
}

export default function MatchesManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [matches, setMatches] = useState<Match[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeMainTab, setActiveMainTab] = useState<'upcoming' | 'finished'>('upcoming');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form
  const [editVenue, setEditVenue] = useState('');
  const [editReferee, setEditReferee] = useState('');
  const [editRefereeId, setEditRefereeId] = useState('');
  const [editAssistant1Id, setEditAssistant1Id] = useState('');
  const [editAssistant2Id, setEditAssistant2Id] = useState('');
  const [editFourthId, setEditFourthId] = useState('');
  const [saving, setSaving] = useState(false);

  // Referees
  const [referees, setReferees] = useState<Referee[]>([]);
  const [showRefereePicker, setShowRefereePicker] = useState<'main' | 'assistant1' | 'assistant2' | 'fourth' | null>(null);
  const safeReferees = Array.isArray(referees) ? referees : [];

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ type: 'error' | 'warning' | 'confirm'; title: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({
    type: 'error', title: '', message: '',
  });

  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({ type: 'warning', title, message, showCancel: true, onConfirm });
    setDialogVisible(true);
  };

  useEffect(() => {
    loadMatches();
    loadReferees();
  }, []);

  const loadReferees = async () => {
    try {
      const response = await refereeApi.getAll();
      setReferees(response.data?.data || []);
    } catch (error) {
      console.error('Error loading referees:', error);
    }
  };

  const getRefereeById = (id: string) => safeReferees.find(r => r.id === id);

  const loadMatches = async () => {
    try {
      setLoading(true);
      // Load upcoming/live matches
      const response = await matchApi.getAll();
      const data = response.data?.data || response.data || [];
      const allMatches = Array.isArray(data) ? data : [];
      setMatches(allMatches.filter((m: Match) => m.status !== 'finished'));

      // Load finished matches (last 30 days)
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      const finishedRes = await matchApi.getAll({ status: 'finished', from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] });
      const finData = finishedRes.data?.data || finishedRes.data || [];
      const sorted = (Array.isArray(finData) ? finData : []).sort((a: Match, b: Match) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setFinishedMatches(sorted);
    } catch (error) {
      console.error('Error loading matches:', error);
      showError(t('admin.error'), t('admin.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const openEditModal = (match: Match) => {
    setSelectedMatch(match);
    setEditVenue(match.venue || '');
    setEditReferee(match.referee || '');
    setEditRefereeId(match.refereeId || '');
    setEditAssistant1Id(match.assistantReferee1Id || '');
    setEditAssistant2Id(match.assistantReferee2Id || '');
    setEditFourthId(match.fourthRefereeId || '');
    setShowEditModal(true);
  };

  const handleSaveMatch = async () => {
    if (!selectedMatch) return;

    try {
      setSaving(true);
      await matchApi.update(selectedMatch.id, {
        venue: editVenue,
        referee: editRefereeId ? getRefereeById(editRefereeId)?.name : editReferee,
        refereeId: editRefereeId || undefined,
        assistantReferee1Id: editAssistant1Id || undefined,
        assistantReferee2Id: editAssistant2Id || undefined,
        fourthRefereeId: editFourthId || undefined,
      });
      setShowEditModal(false);
      loadMatches();
    } catch (error) {
      showError(t('admin.error'), t('admin.updateMatchFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMatch = (match: Match) => {
    showConfirm(
      t('admin.deleteMatchTitle'),
      t('admin.deleteMatchConfirm'),
      async () => {
        setDialogVisible(false);
        try {
          await matchApi.delete(match.id);
          loadMatches();
        } catch (error) {
          showError(t('admin.error'), t('admin.deleteMatchFailed'));
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#10B981';
      case 'finished': return colors.textSecondary;
      case 'scheduled': return colors.accent;
      case 'halftime': return '#F59E0B';
      default: return colors.textTertiary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'مباشر';
      case 'finished': return 'انتهت';
      case 'scheduled': return 'قادمة';
      case 'halftime': return 'استراحة';
      case 'postponed': return 'مؤجلة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const sourceMatches = activeMainTab === 'finished' ? finishedMatches : matches;
  const filteredMatches = sourceMatches.filter((match) => {
    const matchesSearch = 
      match.homeTeam.name.includes(searchQuery) ||
      match.awayTeam.name.includes(searchQuery) ||
      match.competition.name.includes(searchQuery);
    
    if (activeMainTab === 'finished') return matchesSearch;
    const matchesFilter = filterStatus === 'all' || match.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMatchCard = ({ item: match }: { item: Match }) => (
    <View style={[styles.matchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.matchHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.competitionName, { color: colors.textSecondary }]}>
          {match.competition?.name || 'بدون بطولة'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(match.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(match.status) }]}>
            {getStatusText(match.status)}
          </Text>
        </View>
      </View>

      {/* Teams */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamInfo}>
          <TeamLogo team={match.homeTeam || { name: '—', shortName: '—' }} size="medium" />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
            {match.homeTeam?.shortName || '—'}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: colors.text }]}>
            {match.homeScore} - {match.awayScore}
          </Text>
          <Text style={[styles.matchDate, { color: colors.textSecondary }]}>
            {formatDate(match.startTime)}
          </Text>
        </View>

        <View style={styles.teamInfo}>
          <TeamLogo team={match.awayTeam || { name: '—', shortName: '—' }} size="medium" />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
            {match.awayTeam?.shortName || '—'}
          </Text>
        </View>
      </View>

      {/* Details */}
      {(match.venue || match.referee) && (
        <View style={[styles.detailsRow, { borderTopColor: colors.border }]}>
          {match.venue && (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{match.venue}</Text>
            </View>
          )}
          {match.referee && (
            <View style={styles.detailItem}>
              <Ionicons name="flag" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{match.referee}</Text>
            </View>
          )}
          {match.assistantReferee1 && (
            <View style={styles.detailItem}>
              <Ionicons name="flag-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textTertiary, fontSize: 11 }]}>{match.assistantReferee1}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actionsRow, { flexDirection }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
          onPress={() => openEditModal(match)}
        >
          <Ionicons name="pencil" size={18} color={colors.accent} />
          <Text style={[styles.actionButtonText, { color: colors.accent }]}>تعديل</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#DC262620' }]}
          onPress={() => handleDeleteMatch(match)}
        >
          <Ionicons name="trash" size={18} color="#DC2626" />
          <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Main Tabs: Upcoming vs Finished */}
      <View style={[styles.mainTabsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.mainTab, activeMainTab === 'upcoming' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveMainTab('upcoming')}
        >
          <Ionicons name="football-outline" size={16} color={activeMainTab === 'upcoming' ? colors.accent : colors.textSecondary} />
          <Text style={[styles.mainTabText, { color: activeMainTab === 'upcoming' ? colors.accent : colors.textSecondary }]}>
            القادمة والجارية ({matches.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeMainTab === 'finished' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveMainTab('finished')}
        >
          <Ionicons name="checkmark-done-outline" size={16} color={activeMainTab === 'finished' ? colors.accent : colors.textSecondary} />
          <Text style={[styles.mainTabText, { color: activeMainTab === 'finished' ? colors.accent : colors.textSecondary }]}>
            المنتهية ({finishedMatches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="بحث عن مباراة..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
      </View>

      {/* Filter Tabs - only for upcoming tab */}
      {activeMainTab === 'upcoming' && (
        <View style={styles.filterContainer}>
          {[
            { key: 'all', label: 'الكل' },
            { key: 'scheduled', label: 'قادمة' },
            { key: 'live', label: 'مباشر' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                filterStatus === filter.key && { backgroundColor: colors.accent },
                { borderColor: colors.border },
              ]}
              onPress={() => setFilterStatus(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                { color: filterStatus === filter.key ? '#fff' : colors.textSecondary },
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Matches List */}
      <FlatList
        data={filteredMatches}
        renderItem={renderMatchCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.accent]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="football-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد مباريات
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <AppModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="تعديل المباراة"
        icon="pencil"
        subtitle={selectedMatch ? `${selectedMatch.homeTeam.name} vs ${selectedMatch.awayTeam.name}` : undefined}
      >
        {selectedMatch && (
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>الملعب</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editVenue}
                onChangeText={setEditVenue}
                placeholder="اسم الملعب"
                placeholderTextColor={colors.textTertiary}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>الحكام</Text>
              <View style={{ gap: SPACING.xs }}>
                <TouchableOpacity
                  style={[styles.refereeSelector, { backgroundColor: colors.surface, borderColor: editRefereeId ? colors.accent : colors.border }]}
                  onPress={() => setShowRefereePicker('main')}
                >
                  <Ionicons name="flag" size={16} color={editRefereeId ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.refereeSelectorText, { color: editRefereeId ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                    {editRefereeId ? getRefereeById(editRefereeId)?.name || 'حكم محذوف' : 'الحكم الرئيسي'}
                  </Text>
                  {editRefereeId ? (
                    <TouchableOpacity onPress={() => setEditRefereeId('')}>
                      <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                  <TouchableOpacity
                    style={[styles.refereeSelector, { flex: 1, backgroundColor: colors.surface, borderColor: editAssistant1Id ? colors.accent : colors.border }]}
                    onPress={() => setShowRefereePicker('assistant1')}
                  >
                    <Ionicons name="flag-outline" size={14} color={editAssistant1Id ? colors.accent : colors.textTertiary} />
                    <Text style={[styles.refereeSelectorText, { color: editAssistant1Id ? colors.text : colors.textTertiary, fontSize: 11 }]} numberOfLines={1}>
                      {editAssistant1Id ? getRefereeById(editAssistant1Id)?.name || '-' : 'مساعد ١'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.refereeSelector, { flex: 1, backgroundColor: colors.surface, borderColor: editAssistant2Id ? colors.accent : colors.border }]}
                    onPress={() => setShowRefereePicker('assistant2')}
                  >
                    <Ionicons name="flag-outline" size={14} color={editAssistant2Id ? colors.accent : colors.textTertiary} />
                    <Text style={[styles.refereeSelectorText, { color: editAssistant2Id ? colors.text : colors.textTertiary, fontSize: 11 }]} numberOfLines={1}>
                      {editAssistant2Id ? getRefereeById(editAssistant2Id)?.name || '-' : 'مساعد ٢'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.refereeSelector, { backgroundColor: colors.surface, borderColor: editFourthId ? colors.accent : colors.border }]}
                  onPress={() => setShowRefereePicker('fourth')}
                >
                  <Ionicons name="person-outline" size={14} color={editFourthId ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.refereeSelectorText, { color: editFourthId ? colors.text : colors.textTertiary, fontSize: 12 }]} numberOfLines={1}>
                    {editFourthId ? getRefereeById(editFourthId)?.name || '-' : 'الحكم الرابع'}
                  </Text>
                  {editFourthId ? (
                    <TouchableOpacity onPress={() => setEditFourthId('')}>
                      <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveMatch}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </AppModal>

      {/* Referee Picker Modal */}
      <AppModal
        visible={showRefereePicker !== null}
        onClose={() => setShowRefereePicker(null)}
        title={
          showRefereePicker === 'main' ? 'اختر الحكم الرئيسي' :
          showRefereePicker === 'assistant1' ? 'اختر المساعد الأول' :
          showRefereePicker === 'assistant2' ? 'اختر المساعد الثاني' :
          'اختر الحكم الرابع'
        }
        icon="flag"
        maxHeight="70%"
      >
        <ScrollView style={{ padding: SPACING.md }}>
          <TouchableOpacity
            style={[styles.refereePickerItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              if (showRefereePicker === 'main') setEditRefereeId('');
              else if (showRefereePicker === 'assistant1') setEditAssistant1Id('');
              else if (showRefereePicker === 'assistant2') setEditAssistant2Id('');
              else if (showRefereePicker === 'fourth') setEditFourthId('');
              setShowRefereePicker(null);
            }}
          >
            <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.refereePickerText, { color: colors.textSecondary }]}>بدون حكم</Text>
          </TouchableOpacity>
          {safeReferees.map((ref) => {
            const currentId = showRefereePicker === 'main' ? editRefereeId :
              showRefereePicker === 'assistant1' ? editAssistant1Id :
              showRefereePicker === 'assistant2' ? editAssistant2Id : editFourthId;
            return (
              <TouchableOpacity
                key={ref.id}
                style={[
                  styles.refereePickerItem,
                  { borderBottomColor: colors.border },
                  currentId === ref.id && { backgroundColor: colors.accent + '20' }
                ]}
                onPress={() => {
                  if (showRefereePicker === 'main') setEditRefereeId(ref.id);
                  else if (showRefereePicker === 'assistant1') setEditAssistant1Id(ref.id);
                  else if (showRefereePicker === 'assistant2') setEditAssistant2Id(ref.id);
                  else if (showRefereePicker === 'fourth') setEditFourthId(ref.id);
                  setShowRefereePicker(null);
                }}
              >
                {ref.imageUrl ? (
                  <Image source={{ uri: ref.imageUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={18} color={colors.accent} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refereePickerText, { color: colors.text }]}>{ref.name}</Text>
                  {ref.nationality && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{ref.nationality}</Text>
                  )}
                </View>
                {currentId === ref.id && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </AppModal>

      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.showCancel ? t('admin.confirm') : t('admin.ok')}
        cancelText={t('admin.cancel')}
        showCancel={dialogConfig.showCancel}
        onConfirm={dialogConfig.onConfirm || (() => setDialogVisible(false))}
        onCancel={() => setDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  searchContainer: {
    padding: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    height: 48,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  listContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  matchCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
  },
  competitionName: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
    gap: SPACING.xs,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  matchDate: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: 16,
    marginTop: SPACING.md,
    fontFamily: FONTS.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  matchInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontFamily: FONTS.regular,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  input: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  saveButton: {
    height: 50,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  refereeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  refereeSelectorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  refereePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  refereePickerText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
});
