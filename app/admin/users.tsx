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
import { userApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'operator' | 'admin' | 'publisher';
  avatar?: string;
  isBanned?: boolean;
  createdAt: string;
  _count?: {
    favorites: number;
  };
}

export default function UsersManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
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
    loadUsers();
  }, []);

  const loadUsers = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      const response = await userApi.getAll(pageNum, 10);
      const data = response.data?.data || [];
      const pagination = response.data?.pagination;
      if (append) {
        setUsers(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
      } else {
        setUsers(Array.isArray(data) ? data : []);
      }
      setPage(pageNum);
      setHasMore(pagination?.hasMore ?? false);
      setTotalUsers(pagination?.total ?? 0);
    } catch (error) {
      console.error('Error loading users:', error);
      showError(t('admin.error'), t('admin.loadUsersFailed'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadUsers(page + 1, true);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers(1, false);
  };

  const handleBanUser = (user: User) => {
    const isBan = !user.isBanned;
    showConfirm(
      isBan ? t('admin.banUserTitle') : t('admin.unbanUserTitle'),
      isBan ? t('admin.banUserConfirm') : t('admin.unbanUserConfirm'),
      async () => {
        setDialogVisible(false);
        try {
          setSaving(true);
          await userApi.toggleBan(user.id);
          loadUsers();
        } catch (error) {
          showError(t('admin.error'), t('admin.banFailed'));
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    try {
      setSaving(true);
      await userApi.updateRole(user.id, newRole);
      setShowUserModal(false);
      loadUsers();
    } catch (error) {
      showError(t('admin.error'), t('admin.roleFailed'));
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#DC2626';
      case 'operator': return '#F59E0B';
      case 'publisher': return '#8B5CF6';
      default: return colors.accent;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'operator': return 'مشغل';
      case 'publisher': return 'ناشر';
      default: return 'مستخدم';
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const renderUserCard = ({ item: user }: { item: User }) => (
    <TouchableOpacity 
      style={[
        styles.userCard, 
        { backgroundColor: colors.surface, borderColor: colors.border },
        user.isBanned && styles.bannedCard,
      ]}
      onPress={() => openUserModal(user)}
    >
      <View style={[styles.userInfo, { flexDirection }]}>
        {/* Avatar */}
        <View style={[styles.avatarContainer, { backgroundColor: colors.accent + '20' }]}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Text style={[styles.avatarText, { color: colors.accent }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          )}
          {user.isBanned && (
            <View style={styles.bannedBadge}>
              <Ionicons name="ban" size={12} color="#fff" />
            </View>
          )}
        </View>

        {/* User Details */}
        <View style={styles.userDetails}>
          <View style={[styles.nameRow, { flexDirection }]}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                {getRoleText(user.role)}
              </Text>
            </View>
          </View>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
          <View style={[styles.userMeta, { flexDirection }]}>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              انضم: {formatDate(user.createdAt)}
            </Text>
            {user._count && (
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                • {user._count.favorites} مفضلة
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actionsRow, { flexDirection }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: user.isBanned ? '#10B98120' : '#DC262620' }
          ]}
          onPress={() => handleBanUser(user)}
        >
          <Ionicons 
            name={user.isBanned ? "checkmark-circle" : "ban"} 
            size={18} 
            color={user.isBanned ? '#10B981' : '#DC2626'} 
          />
          <Text style={[
            styles.actionButtonText, 
            { color: user.isBanned ? '#10B981' : '#DC2626' }
          ]}>
            {user.isBanned ? 'إلغاء الحظر' : 'حظر'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
          onPress={() => openUserModal(user)}
        >
          <Ionicons name="settings" size={18} color={colors.accent} />
          <Text style={[styles.actionButtonText, { color: colors.accent }]}>إدارة</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={24} color={colors.accent} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{totalUsers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>إجمالي</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="person" size={24} color="#10B981" />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {users.filter(u => u.role === 'user').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>مستخدم</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="ban" size={24} color="#DC2626" />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {users.filter(u => u.isBanned).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>محظور</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="بحث عن مستخدم..."
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
          { key: 'user', label: 'مستخدمون' },
          { key: 'operator', label: 'مشغلون' },
          { key: 'publisher', label: 'ناشرون' },
          { key: 'admin', label: 'مدراء' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterRole === filter.key && { backgroundColor: colors.accent },
              { borderColor: colors.border },
            ]}
            onPress={() => setFilterRole(filter.key)}
          >
            <Text style={[
              styles.filterTabText,
              { color: filterRole === filter.key ? '#fff' : colors.textSecondary },
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.accent]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>جاري تحميل المزيد...</Text>
            </View>
          ) : hasMore && filteredUsers.length > 0 ? (
            <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: colors.border }]} onPress={loadMore}>
              <Text style={[styles.loadMoreBtnText, { color: colors.accent }]}>تحميل المزيد</Text>
            </TouchableOpacity>
          ) : filteredUsers.length > 0 ? (
            <Text style={[styles.loadMoreText, { color: colors.textTertiary, textAlign: 'center', paddingVertical: SPACING.md }]}>
              تم عرض جميع المستخدمين ({totalUsers})
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا يوجد مستخدمون
            </Text>
          </View>
        }
      />

      {/* User Modal */}
      <AppModal
        visible={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="إدارة المستخدم"
        icon="person-circle"
        subtitle={selectedUser?.email}
      >
        {selectedUser && (
          <View style={styles.modalBody}>
            {/* User Info */}
            <View style={styles.userInfoModal}>
              <View style={[styles.avatarContainerLarge, { backgroundColor: colors.accent + '20' }]}>
                {selectedUser.avatar ? (
                  <Image source={{ uri: selectedUser.avatar }} style={styles.avatarLarge} />
                ) : (
                  <Text style={[styles.avatarTextLarge, { color: colors.accent }]}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={[styles.userNameModal, { color: colors.text }]}>{selectedUser.name}</Text>
              <Text style={[styles.userEmailModal, { color: colors.textSecondary }]}>{selectedUser.email}</Text>
            </View>

            {/* Role Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>تغيير الصلاحية</Text>
            <View style={styles.roleOptions}>
              {['user', 'operator', 'publisher', 'admin'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    { borderColor: colors.border },
                    selectedUser.role === role && { 
                      backgroundColor: getRoleColor(role) + '20',
                      borderColor: getRoleColor(role),
                    },
                  ]}
                  onPress={() => handleChangeRole(selectedUser, role)}
                  disabled={saving}
                >
                  <Ionicons 
                    name={
                      role === 'admin' ? 'shield' : 
                      role === 'operator' ? 'construct' :
                      role === 'publisher' ? 'newspaper' : 'person'
                    } 
                    size={20} 
                    color={selectedUser.role === role ? getRoleColor(role) : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.roleOptionText,
                    { color: selectedUser.role === role ? getRoleColor(role) : colors.text },
                  ]}>
                    {getRoleText(role)}
                  </Text>
                  {selectedUser.role === role && (
                    <Ionicons name="checkmark-circle" size={20} color={getRoleColor(role)} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Ban Button */}
            <TouchableOpacity
              style={[
                styles.banButton,
                { backgroundColor: selectedUser.isBanned ? '#10B981' : '#DC2626' },
              ]}
              onPress={() => {
                setShowUserModal(false);
                handleBanUser(selectedUser);
              }}
            >
              <Ionicons 
                name={selectedUser.isBanned ? "checkmark-circle" : "ban"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.banButtonText}>
                {selectedUser.isBanned ? 'إلغاء الحظر' : 'حظر المستخدم'}
              </Text>
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
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
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
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
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
  },
  listContainer: {
    padding: SPACING.md,
  },
  userCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bannedCard: {
    opacity: 0.7,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  bannedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  userMeta: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
    fontSize: 13,
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
  userInfoModal: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarContainerLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  userNameModal: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  userEmailModal: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
    fontFamily: FONTS.semiBold,
  },
  roleOptions: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
  },
  roleOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  banButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  banButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    marginVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
