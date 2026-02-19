import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { refereeApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';
import * as ImagePicker from 'expo-image-picker';

interface Referee {
  id: string;
  name: string;
  imageUrl?: string;
  nationality?: string;
  refereeType: string; // LOCAL, INTERNATIONAL
  isActive: boolean;
  createdAt: string;
}

export default function RefereesManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();

  const [referees, setReferees] = useState<Referee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Referee | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNationality, setFormNationality] = useState('');
  const [formRefereeType, setFormRefereeType] = useState<'LOCAL' | 'INTERNATIONAL'>('LOCAL');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formImageFile, setFormImageFile] = useState<any>(null);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    type: 'error' | 'warning' | 'confirm';
    title: string;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({ type: 'error', title: '', message: '' });

  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({ type: 'warning', title, message, showCancel: true, onConfirm });
    setDialogVisible(true);
  };

  useEffect(() => {
    loadReferees();
  }, []);

  const loadReferees = async () => {
    try {
      setLoading(true);
      const response = await refereeApi.getAll();
      setReferees(response.data?.data || []);
    } catch (error) {
      console.error('Error loading referees:', error);
      showError(t('admin.error') || 'خطأ', t('admin.loadFailed') || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReferees();
  };

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormNationality('');
    setFormRefereeType('LOCAL');
    setFormImage(null);
    setFormImageFile(null);
    setShowModal(true);
  };

  const openEdit = (referee: Referee) => {
    setEditing(referee);
    setFormName(referee.name);
    setFormNationality(referee.nationality || '');
    setFormRefereeType((referee.refereeType as 'LOCAL' | 'INTERNATIONAL') || 'LOCAL');
    setFormImage(referee.imageUrl || null);
    setFormImageFile(null);
    setShowModal(true);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormImage(result.assets[0].uri);
        setFormImageFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showError(t('admin.error') || 'خطأ', 'يرجى إدخال اسم الحكم');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('refereeType', formRefereeType);
      if (formNationality.trim()) {
        formData.append('nationality', formNationality.trim());
      }

      if (formImageFile) {
        const uri = formImageFile.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('image', {
          uri,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          name: `referee-${Date.now()}.${ext}`,
        } as any);
      }

      if (editing) {
        await refereeApi.update(editing.id, formData);
      } else {
        await refereeApi.create(formData);
      }

      setShowModal(false);
      loadReferees();
    } catch (error) {
      console.error('Save referee error:', error);
      showError(t('admin.error') || 'خطأ', 'فشل حفظ بيانات الحكم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (referee: Referee) => {
    showConfirm(
      'حذف الحكم',
      `هل أنت متأكد من حذف الحكم "${referee.name}"؟`,
      async () => {
        setDialogVisible(false);
        try {
          setSaving(true);
          await refereeApi.delete(referee.id);
          loadReferees();
        } catch (error) {
          showError(t('admin.error') || 'خطأ', 'فشل حذف الحكم');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const filteredReferees = referees.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRefereeCard = ({ item: referee }: { item: Referee }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.cardContent, { flexDirection }]}>
        {/* Image */}
        <View style={[styles.avatarContainer, { backgroundColor: colors.accent + '20' }]}>
          {referee.imageUrl ? (
            <Image source={{ uri: referee.imageUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={28} color={colors.accent} />
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]}>{referee.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: referee.refereeType === 'INTERNATIONAL' ? '#3B82F620' : '#10B98120' }}>
              <Text style={{ fontSize: 10, fontFamily: FONTS.semiBold, color: referee.refereeType === 'INTERNATIONAL' ? '#3B82F6' : '#10B981' }}>
                {referee.refereeType === 'INTERNATIONAL' ? 'دولي' : 'محلي'}
              </Text>
            </View>
            {referee.nationality && (
              <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 0 }]}>
                {referee.nationality}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { flexDirection }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent + '20' }]}
            onPress={() => openEdit(referee)}
          >
            <Ionicons name="pencil" size={16} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
            onPress={() => handleDelete(referee)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Actions */}
      <View style={[styles.headerRow, { flexDirection }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="بحث عن حكم..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={openCreate}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Count */}
      <Text style={[styles.count, { color: colors.textSecondary }]}>
        {filteredReferees.length} حكم
      </Text>

      {/* List */}
      <FlatList
        data={filteredReferees}
        keyExtractor={(item) => item.id}
        renderItem={renderRefereeCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              لا يوجد حكام
            </Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <AppModal visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'تعديل الحكم' : 'إضافة حكم'}>
        <View style={styles.formContainer}>
          {/* Image Picker */}
          <TouchableOpacity style={[styles.imagePicker, { borderColor: colors.border }]} onPress={pickImage}>
            {formImage ? (
              <Image source={{ uri: formImage }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="camera" size={32} color={colors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: colors.textTertiary }]}>
                  صورة الحكم
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>الاسم *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="اسم الحكم"
            placeholderTextColor={colors.textTertiary}
            value={formName}
            onChangeText={setFormName}
          />

          {/* Referee Type */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>نوع الحكم *</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm }}>
            <TouchableOpacity
              style={[styles.input, { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: formRefereeType === 'LOCAL' ? colors.accent + '20' : colors.surface, borderColor: formRefereeType === 'LOCAL' ? colors.accent : colors.border }]}
              onPress={() => setFormRefereeType('LOCAL')}
            >
              <Text style={{ color: formRefereeType === 'LOCAL' ? colors.accent : colors.text, fontFamily: FONTS.semiBold, fontSize: 14 }}>محلي</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.input, { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: formRefereeType === 'INTERNATIONAL' ? '#3B82F620' : colors.surface, borderColor: formRefereeType === 'INTERNATIONAL' ? '#3B82F6' : colors.border }]}
              onPress={() => setFormRefereeType('INTERNATIONAL')}
            >
              <Text style={{ color: formRefereeType === 'INTERNATIONAL' ? '#3B82F6' : colors.text, fontFamily: FONTS.semiBold, fontSize: 14 }}>دولي</Text>
            </TouchableOpacity>
          </View>

          {/* Nationality */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>الجنسية</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="الجنسية (اختياري)"
            placeholderTextColor={colors.textTertiary}
            value={formNationality}
            onChangeText={setFormNationality}
          />

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{editing ? 'تحديث' : 'إضافة'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* Dialog */}
      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        showCancel={dialogConfig.showCancel}
        onConfirm={() => {
          if (dialogConfig.onConfirm) dialogConfig.onConfirm();
          else setDialogVisible(false);
        }}
        onCancel={() => setDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  headerRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
    gap: SPACING.sm,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  cardContent: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  actions: {
    gap: SPACING.xs,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    marginTop: SPACING.md,
  },
  formContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignSelf: 'center',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePickerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  saveBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
});
