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
import * as ImagePicker from 'expo-image-picker';

interface Supervisor {
  id: string;
  name: string;
  imageUrl?: string;
  nationality?: string;
  isActive: boolean;
  createdAt: string;
}

export default function SupervisorsManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supervisor | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNationality, setFormNationality] = useState('');
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
    loadSupervisors();
  }, []);

  const loadSupervisors = async () => {
    try {
      setLoading(true);
      const response = await supervisorApi.getAll();
      setSupervisors(response.data?.data || []);
    } catch (error) {
      console.error('Error loading supervisors:', error);
      showError('خطأ', 'فشل تحميل المشرفين');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSupervisors();
  };

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormNationality('');
    setFormImage(null);
    setFormImageFile(null);
    setShowModal(true);
  };

  const openEdit = (supervisor: Supervisor) => {
    setEditing(supervisor);
    setFormName(supervisor.name);
    setFormNationality(supervisor.nationality || '');
    setFormImage(supervisor.imageUrl || null);
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
      showError('خطأ', 'يرجى إدخال اسم المشرف');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', formName.trim());
      if (formNationality.trim()) {
        formData.append('nationality', formNationality.trim());
      }

      if (formImageFile) {
        const uri = formImageFile.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('image', {
          uri,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          name: `supervisor-${Date.now()}.${ext}`,
        } as any);
      }

      if (editing) {
        await supervisorApi.update(editing.id, formData);
      } else {
        await supervisorApi.create(formData);
      }

      setShowModal(false);
      loadSupervisors();
    } catch (error) {
      console.error('Save supervisor error:', error);
      showError('خطأ', 'فشل حفظ بيانات المشرف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (supervisor: Supervisor) => {
    showConfirm(
      'حذف المشرف',
      `هل أنت متأكد من حذف المشرف "${supervisor.name}"؟`,
      async () => {
        setDialogVisible(false);
        try {
          setSaving(true);
          await supervisorApi.delete(supervisor.id);
          loadSupervisors();
        } catch (error) {
          showError('خطأ', 'فشل حذف المشرف');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const filteredSupervisors = supervisors.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSupervisorCard = ({ item: supervisor }: { item: Supervisor }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.cardContent, { flexDirection }]}>
        {/* Image */}
        <View style={[styles.avatarContainer, { backgroundColor: colors.accent + '20' }]}>
          {supervisor.imageUrl ? (
            <Image source={{ uri: supervisor.imageUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="eye" size={28} color={colors.accent} />
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]}>{supervisor.name}</Text>
          {supervisor.nationality && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {supervisor.nationality}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, { flexDirection }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent + '20' }]}
            onPress={() => openEdit(supervisor)}
          >
            <Ionicons name="pencil" size={16} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
            onPress={() => handleDelete(supervisor)}
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
            placeholder="بحث عن مشرف..."
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
        {filteredSupervisors.length} مشرف
      </Text>

      {/* List */}
      <FlatList
        data={filteredSupervisors}
        keyExtractor={(item) => item.id}
        renderItem={renderSupervisorCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="eye-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              لا يوجد مشرفين
            </Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <AppModal visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'تعديل المشرف' : 'إضافة مشرف'}>
        <View style={styles.formContainer}>
          {/* Image Picker */}
          <TouchableOpacity style={[styles.imagePicker, { borderColor: colors.border }]} onPress={pickImage}>
            {formImage ? (
              <Image source={{ uri: formImage }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="camera" size={32} color={colors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: colors.textTertiary }]}>
                  صورة المشرف
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>الاسم *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="اسم المشرف"
            placeholderTextColor={colors.textTertiary}
            value={formName}
            onChangeText={setFormName}
          />

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