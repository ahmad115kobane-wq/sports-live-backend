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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { supervisorApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';

interface Supervisor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  permissions: string[];
  assignedMatches: number;
  createdAt: string;
}

export default function SupervisorsManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalSupervisors, setTotalSupervisors] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);

  const loadSupervisors = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await supervisorApi.getAll({
        page: pageNum,
        limit: 20,
        search: searchQuery,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });

      if (isRefresh) {
        setSupervisors(response.data.data);
      } else {
        setSupervisors(prev => [...prev, ...response.data.data]);
      }

      setTotalSupervisors(response.data.total);
      setHasMore(response.data.data.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadSupervisors(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadSupervisors(page + 1);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setPage(1);
    setTimeout(() => loadSupervisors(1, true), 500);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setPage(1);
    loadSupervisors(1, true);
  };

  const handleSupervisorPress = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowSupervisorModal(true);
  };

  const handleToggleStatus = async (supervisorId: string, currentStatus: boolean) => {
    try {
      await supervisorApi.updateStatus(supervisorId, !currentStatus);
      setSupervisors(prev =>
        prev.map(s =>
          s.id === supervisorId ? { ...s, isActive: !currentStatus } : s
        )
      );
    } catch (error) {
      console.error('Error updating supervisor status:', error);
    }
  };

  const handleDeleteSupervisor = async (supervisorId: string) => {
    try {
      await supervisorApi.delete(supervisorId);
      setSupervisors(prev => prev.filter(s => s.id !== supervisorId));
    } catch (error) {
      console.error('Error deleting supervisor:', error);
    }
  };

  useEffect(() => {
    loadSupervisors();
  }, []);

  const renderSupervisorItem = ({ item }: { item: Supervisor }) => (
    <TouchableOpacity
      style={[styles.supervisorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleSupervisorPress(item)}
    >
      <View style={styles.supervisorHeader}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
              <Text style={[styles.avatarText, { color: colors.background }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.supervisorInfo}>
          <Text style={[styles.supervisorName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <Text style={[styles.supervisorEmail, { color: colors.textTertiary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.email}
          </Text>
          {item.phone && (
            <Text style={[styles.supervisorPhone, { color: colors.textTertiary }]} numberOfLines={1} ellipsizeMode="tail">
              {item.phone}
            </Text>
          )}
        </View>
        <View style={styles.supervisorStats}>
          <View style={styles.matchCount}>
            <Ionicons name="football" size={14} color={colors.textTertiary} />
            <Text style={[styles.matchCountText, { color: colors.textTertiary }]}>
              {item.assignedMatches}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statusBtn, { backgroundColor: item.isActive ? colors.success + '20' : colors.error + '20' }]}
            onPress={() => handleToggleStatus(item.id, item.isActive)}
          >
            <Text style={[styles.statusText, { color: item.isActive ? colors.success : colors.error }]}>
              {item.isActive ? 'نشط' : 'غير نشط'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.permissionsContainer, { borderTopColor: colors.divider }]}>
        <Text style={[styles.permissionsLabel, { color: colors.textTertiary }]}>الصلاحيات:</Text>
        <View style={styles.permissionsList}>
          {item.permissions.slice(0, 3).map((permission, index) => (
            <View key={index} style={[styles.permissionTag, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.permissionText, { color: colors.accent }]} numberOfLines={1} ellipsizeMode="tail">
                {permission}
              </Text>
            </View>
          ))}
          {item.permissions.length > 3 && (
            <View style={[styles.moreTag, { backgroundColor: colors.textTertiary + '20' }]}>
              <Text style={[styles.moreText, { color: colors.textTertiary }]}>
                +{item.permissions.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>لا يوجد مشرفون</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        {searchQuery ? 'لم يتم العثور على مشرفين مطابقين للبحث' : 'لم يتم إضافة أي مشرفين بعد'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>إدارة المشرفين</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
          {totalSupervisors} مشرف
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ابحث عن مشرف..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.filterContainer}>
          {['all', 'active', 'inactive'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterBtn,
                { backgroundColor: colors.surface },
                filterStatus === status && { backgroundColor: colors.accent },
              ]}
              onPress={() => handleFilterChange(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textTertiary },
                  filterStatus === status && { color: colors.background },
                ]}
              >
                {status === 'all' ? 'الكل' : status === 'active' ? 'نشط' : 'غير نشط'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Supervisors List */}
      {loading && page === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={supervisors}
          renderItem={renderSupervisorItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Add Supervisor Button */}
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: colors.accent }]}
        onPress={() => {
          // TODO: Implement add supervisor
        }}
      >
        <Ionicons name="add" size={24} color={colors.background} />
      </TouchableOpacity>

      {/* Supervisor Details Modal */}
      <AppModal
        visible={showSupervisorModal}
        onClose={() => setShowSupervisorModal(false)}
        title="تفاصيل المشرف"
      >
        {selectedSupervisor && (
          <View style={styles.modalContent}>
            <View style={styles.modalAvatarContainer}>
              {selectedSupervisor.avatar ? (
                <Image source={{ uri: selectedSupervisor.avatar }} style={styles.modalAvatar} />
              ) : (
                <View style={[styles.modalAvatarPlaceholder, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.modalAvatarText, { color: colors.background }]}>
                    {selectedSupervisor.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.modalName, { color: colors.text }]}>{selectedSupervisor.name}</Text>
            <Text style={[styles.modalEmail, { color: colors.textTertiary }]}>{selectedSupervisor.email}</Text>
            {selectedSupervisor.phone && (
              <Text style={[styles.modalPhone, { color: colors.textTertiary }]}>{selectedSupervisor.phone}</Text>
            )}
            <View style={[styles.modalStatus, { backgroundColor: selectedSupervisor.isActive ? colors.success + '20' : colors.error + '20' }]}>
              <Text style={[styles.modalStatusText, { color: selectedSupervisor.isActive ? colors.success : colors.error }]}>
                {selectedSupervisor.isActive ? 'نشط' : 'غير نشط'}
              </Text>
            </View>
            <View style={[styles.modalSection, { borderTopColor: colors.divider }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>المباريات الموكلة</Text>
              <Text style={[styles.sectionValue, { color: colors.accent }]}>{selectedSupervisor.assignedMatches}</Text>
            </View>
            <View style={[styles.modalSection, { borderTopColor: colors.divider }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>تاريخ الإضافة</Text>
              <Text style={[styles.sectionValue, { color: colors.textTertiary }]}>
                {new Date(selectedSupervisor.createdAt).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            <View style={[styles.modalSection, { borderTopColor: colors.divider }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>الصلاحيات</Text>
              <View style={styles.modalPermissions}>
                {selectedSupervisor.permissions.map((permission, index) => (
                  <View key={index} style={[styles.modalPermissionTag, { backgroundColor: colors.accent + '20' }]}>
                    <Text style={[styles.modalPermissionText, { color: colors.accent }]}>{permission}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  // TODO: Implement edit supervisor
                  setShowSupervisorModal(false);
                }}
              >
                <Text style={[styles.modalActionText, { color: colors.background }]}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.error + '20' }]}
                onPress={() => {
                  AppDialog.show({
                    title: 'حذف المشرف',
                    message: `هل أنت متأكد من حذف المشرف ${selectedSupervisor.name}؟`,
                    confirmText: 'حذف',
                    cancelText: 'إلغاء',
                    onConfirm: () => {
                      handleDeleteSupervisor(selectedSupervisor.id);
                      setShowSupervisorModal(false);
                    },
                  });
                }}
              >
                <Text style={[styles.modalActionText, { color: colors.error }]}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  searchContainer: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  searchInput: {
    flex: 1,
    marginHorizontal: SPACING.sm,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  filterText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  supervisorCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  supervisorHeader: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  supervisorEmail: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  supervisorPhone: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  supervisorStats: {
    alignItems: 'flex-end',
  },
  matchCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  matchCountText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: FONTS.medium,
  },
  statusBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  permissionsContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  permissionsLabel: {
    fontSize: 13,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  permissionTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  permissionText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  moreTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  moreText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.md,
    fontFamily: FONTS.semiBold,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: SPACING.xs,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
  },
  addBtn: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalAvatarContainer: {
    marginBottom: SPACING.md,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  modalEmail: {
    fontSize: 15,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  modalPhone: {
    fontSize: 15,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  modalStatus: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  modalSection: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  sectionValue: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  modalPermissions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  modalPermissionTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  modalPermissionText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});