import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import { delegateApi, competitionApi, userApi } from '@/services/api';
import AppModal from '@/components/ui/AppModal';
import AppDialog from '@/components/ui/AppDialog';

interface Delegation {
  id: string;
  userId: string;
  competitionId: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string; avatar?: string };
  competition: { id: string; name: string; shortName?: string; logoUrl?: string; isActive?: boolean };
}

interface Competition {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  isActive: boolean;
}

export default function AdminDelegatesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignCompetitionId, setAssignCompetitionId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Users search for assignment
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<any>({});

  const loadData = useCallback(async () => {
    try {
      const [delRes, compRes] = await Promise.all([
        delegateApi.adminGetAll(),
        competitionApi.getAll(),
      ]);
      setDelegations(delRes.data?.data || []);
      setCompetitions(compRes.data?.data || []);
    } catch (error) {
      console.error('Load delegates error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await userApi.getAll(1, 200);
      const userData = res.data?.data;
      setUsers(Array.isArray(userData) ? userData : (userData?.users || []));
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const openAssignModal = () => {
    setAssignUserId('');
    setAssignCompetitionId('');
    loadUsers();
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignUserId || !assignCompetitionId) {
      alert('خطأ', 'يرجى اختيار المستخدم والبطولة');
      return;
    }
    try {
      setAssigning(true);
      await delegateApi.adminAssign(assignUserId, assignCompetitionId);
      setShowAssignModal(false);
      loadData();
      alert('تم', 'تم تعيين المكلف بنجاح');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'فشل في تعيين المكلف';
      alert('خطأ', msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = (delegation: Delegation) => {
    setDialogConfig({
      type: 'warning',
      title: 'إزالة المكلف',
      message: `هل أنت متأكد من إزالة "${delegation.user.name}" من إدارة "${delegation.competition.name}"؟`,
      showCancel: true,
      onConfirm: async () => {
        setDialogVisible(false);
        try {
          await delegateApi.adminRemove(delegation.id);
          loadData();
        } catch (error) {
          alert('خطأ', 'فشل في إزالة المكلف');
        }
      },
    });
    setDialogVisible(true);
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
      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* Assign Button */}
        <TouchableOpacity
          style={[styles.assignBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          onPress={openAssignModal}
        >
          <Ionicons name="add-circle" size={20} color="#059669" />
          <Text style={{ color: '#059669', fontSize: 14, fontWeight: '700', fontFamily: FONTS.bold }}>تعيين مكلف جديد</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={[styles.statsRow, { flexDirection }]}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{delegations.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>مكلف</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {new Set(delegations.map((d) => d.competitionId)).size}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>بطولة</Text>
          </View>
        </View>

        {/* Delegations List */}
        {delegations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: SPACING.xxl }}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: SPACING.md }}>لا يوجد مكلفون بعد</Text>
          </View>
        ) : (
          delegations.map((delegation) => (
            <View key={delegation.id} style={[styles.delegationCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.delegationRow, { flexDirection }]}>
                {/* User avatar */}
                <View style={[styles.avatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  {delegation.user.avatar ? (
                    <Image source={{ uri: delegation.user.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  ) : (
                    <Ionicons name="person" size={22} color={colors.textTertiary} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.text }]}>{delegation.user.name}</Text>
                  <Text style={[styles.userEmail, { color: colors.textTertiary }]}>{delegation.user.email}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
                  onPress={() => handleRemove(delegation)}
                >
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Competition info */}
              <View style={[styles.compRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', flexDirection }]}>
                <Ionicons name="trophy" size={16} color="#059669" />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{delegation.competition.name}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
                  {new Date(delegation.createdAt).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Assign Modal */}
      <AppModal visible={showAssignModal} onClose={() => setShowAssignModal(false)} title="تعيين مكلف" icon="people-circle" maxHeight="85%">
        <ScrollView style={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
          {/* Select Competition */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>اختر البطولة *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
            {competitions.filter((c) => c.isActive).map((comp) => (
              <TouchableOpacity
                key={comp.id}
                style={[
                  styles.compPickerItem,
                  {
                    backgroundColor: assignCompetitionId === comp.id ? '#05966920' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    borderColor: assignCompetitionId === comp.id ? '#059669' : colors.border,
                  },
                ]}
                onPress={() => setAssignCompetitionId(comp.id)}
              >
                <Ionicons name="trophy" size={18} color={assignCompetitionId === comp.id ? '#059669' : colors.textTertiary} />
                <Text style={{ color: assignCompetitionId === comp.id ? colors.text : colors.textTertiary, fontSize: 12, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                  {comp.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Select User */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>اختر المستخدم *</Text>
          {usersLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: SPACING.lg }} />
          ) : (
            <View style={{ gap: SPACING.xs, marginBottom: SPACING.lg }}>
              {users.filter((u: any) => u.role !== 'admin').map((u: any) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userPickerItem,
                    {
                      backgroundColor: assignUserId === u.id ? '#05966920' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                      borderColor: assignUserId === u.id ? '#059669' : colors.border,
                      flexDirection,
                    },
                  ]}
                  onPress={() => setAssignUserId(u.id)}
                >
                  <View style={[styles.userPickerAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    {u.avatar ? (
                      <Image source={{ uri: u.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                    ) : (
                      <Ionicons name="person" size={16} color={colors.textTertiary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{u.name}</Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 11 }}>{u.email}</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={{ color: colors.textTertiary, fontSize: 10, fontWeight: '600' }}>{u.role}</Text>
                  </View>
                  {assignUserId === u.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Assign Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#059669' }]}
            onPress={handleAssign}
            disabled={assigning}
          >
            {assigning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>تعيين المكلف</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
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
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderStyle: 'dashed', marginBottom: SPACING.lg,
  },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, borderRadius: RADIUS.lg, borderWidth: 1,
    padding: SPACING.md, alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '800', fontFamily: FONTS.bold },
  statLabel: { fontSize: 12, marginTop: 2, fontFamily: FONTS.regular },
  delegationCard: {
    borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.md, overflow: 'hidden',
  },
  delegationRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.md,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  userName: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.bold },
  userEmail: { fontSize: 12, marginTop: 2, fontFamily: FONTS.regular },
  removeBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  compRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: SPACING.xs, fontFamily: FONTS.semiBold },
  compPickerItem: {
    alignItems: 'center', gap: 6, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, marginRight: SPACING.sm, width: 110,
  },
  userPickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1,
  },
  userPickerAvatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm,
  },
  saveBtn: {
    height: 50, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: FONTS.bold },
});
