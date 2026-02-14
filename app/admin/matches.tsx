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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { matchApi } from '@/services/api';
import TeamLogo from '@/components/ui/TeamLogo';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';

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
}

export default function MatchesManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form
  const [editVenue, setEditVenue] = useState('');
  const [editReferee, setEditReferee] = useState('');
  const [saving, setSaving] = useState(false);

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
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await matchApi.getAll();
      const data = response.data?.data || response.data || [];
      setMatches(Array.isArray(data) ? data : []);
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
    setShowEditModal(true);
  };

  const handleSaveMatch = async () => {
    if (!selectedMatch) return;

    try {
      setSaving(true);
      await matchApi.update(selectedMatch.id, {
        venue: editVenue,
        referee: editReferee,
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

  const filteredMatches = matches.filter((match) => {
    const matchesSearch = 
      match.homeTeam.name.includes(searchQuery) ||
      match.awayTeam.name.includes(searchQuery) ||
      match.competition.name.includes(searchQuery);
    
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
          {match.competition.name}
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
          <TeamLogo team={match.homeTeam} size="medium" />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
            {match.homeTeam.shortName}
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
          <TeamLogo team={match.awayTeam} size="medium" />
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
            {match.awayTeam.shortName}
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
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{match.referee}</Text>
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

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'الكل' },
          { key: 'scheduled', label: 'قادمة' },
          { key: 'live', label: 'مباشر' },
          { key: 'finished', label: 'انتهت' },
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
              <Text style={[styles.inputLabel, { color: colors.text }]}>الحكم</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editReferee}
                onChangeText={setEditReferee}
                placeholder="اسم الحكم"
                placeholderTextColor={colors.textTertiary}
                textAlign={isRTL ? 'right' : 'left'}
              />
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
});
