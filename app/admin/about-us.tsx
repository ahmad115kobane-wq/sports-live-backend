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
import { SPACING, RADIUS, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { aboutApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';
import * as ImagePicker from 'expo-image-picker';

interface AboutMember {
  id: string;
  name: string;
  title: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AboutUsManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [members, setMembers] = useState<AboutMember[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AboutMember | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formImageFile, setFormImageFile] = useState<any>(null);

  // Dialog
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersRes, publicRes] = await Promise.all([
        aboutApi.getMembers(),
        aboutApi.getPublic(),
      ]);
      setMembers(membersRes.data?.data || []);
      setAboutText(publicRes.data?.data?.text || '');
    } catch (error) {
      console.error('Error loading about data:', error);
      showError('خطأ', 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormTitle('');
    setFormSortOrder('0');
    setFormImage(null);
    setFormImageFile(null);
    setShowModal(true);
  };

  const openEdit = (member: AboutMember) => {
    setEditing(member);
    setFormName(member.name);
    setFormTitle(member.title);
    setFormSortOrder(String(member.sortOrder));
    setFormImage(member.imageUrl || null);
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
    if (!formName.trim() || !formTitle.trim()) {
      showError('خطأ', 'يرجى إدخال الاسم والمسمى الوظيفي');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('title', formTitle.trim());
      formData.append('sortOrder', formSortOrder || '0');

      if (formImageFile) {
        const uri = formImageFile.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('image', {
          uri,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          name: `about-member-${Date.now()}.${ext}`,
        } as any);
      }

      if (editing) {
        await aboutApi.updateMember(editing.id, formData);
      } else {
        await aboutApi.createMember(formData);
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Save member error:', error);
      showError('خطأ', 'فشل حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (member: AboutMember) => {
    showConfirm(
      'حذف العضو',
      `هل أنت متأكد من حذف "${member.name}"؟`,
      async () => {
        setDialogVisible(false);
        try {
          setSaving(true);
          await aboutApi.deleteMember(member.id);
          loadData();
        } catch (error) {
          showError('خطأ', 'فشل حذف العضو');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleSaveText = async () => {
    try {
      setSavingText(true);
      await aboutApi.updateText(aboutText);
      showError('نجاح', 'تم حفظ النص بنجاح');
    } catch (error) {
      showError('خطأ', 'فشل حفظ النص');
    } finally {
      setSavingText(false);
    }
  };

  const renderMemberCard = ({ item: member }: { item: AboutMember }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.cardContent, { flexDirection }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.accent + '20' }]}>
          {member.imageUrl ? (
            <Image source={{ uri: member.imageUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={28} color={colors.accent} />
          )}
        </View>
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]}>{member.name}</Text>
          <Text style={[styles.subtitle, { color: colors.accent }]}>{member.title}</Text>
          <Text style={[styles.orderText, { color: colors.textTertiary }]}>ترتيب: {member.sortOrder}</Text>
        </View>
        <View style={[styles.actions, { flexDirection }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.accent + '20' }]}
            onPress={() => openEdit(member)}
          >
            <Ionicons name="pencil" size={16} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
            onPress={() => handleDelete(member)}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Add Button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={openCreate}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Members List */}
        {members.length > 0 ? (
          <View style={styles.list}>
            {members.map((member) => (
              <View key={member.id}>
                {renderMemberCard({ item: member })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>لا يوجد أعضاء</Text>
          </View>
        )}

        {/* About Text Section */}
        <View style={[styles.textSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.textHeader, { flexDirection }]}>
            <Ionicons name="document-text" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text, flex: 1 }]}>النص التوضيحي</Text>
          </View>
          <TextInput
            style={[styles.textArea, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="أدخل نص توضيحي يظهر أسفل الشخصيات..."
            placeholderTextColor={colors.textTertiary}
            value={aboutText}
            onChangeText={setAboutText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.saveTextBtn, { backgroundColor: colors.accent, opacity: savingText ? 0.7 : 1 }]}
            onPress={handleSaveText}
            disabled={savingText}
          >
            {savingText ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveTextBtnText}>حفظ النص</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <AppModal visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'تعديل العضو' : 'إضافة عضو'}>
        <View style={styles.formContainer}>
          {/* Image Picker */}
          <TouchableOpacity style={[styles.imagePicker, { borderColor: colors.border }]} onPress={pickImage}>
            {formImage ? (
              <Image source={{ uri: formImage }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="camera" size={32} color={colors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: colors.textTertiary }]}>صورة العضو</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>الاسم *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="مثال: أحمد محمد"
            placeholderTextColor={colors.textTertiary}
            value={formName}
            onChangeText={setFormName}
          />

          {/* Title/Role */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>المسمى الوظيفي *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="مثال: رئيس الاتحاد"
            placeholderTextColor={colors.textTertiary}
            value={formTitle}
            onChangeText={setFormTitle}
          />

          {/* Sort Order */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>الترتيب</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={formSortOrder}
            onChangeText={setFormSortOrder}
            keyboardType="numeric"
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  headerRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  cardContent: { alignItems: 'center', gap: SPACING.md },
  avatarContainer: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  details: { flex: 1 },
  name: { fontSize: 15, fontFamily: FONTS.semiBold },
  subtitle: { fontSize: 13, fontFamily: FONTS.medium, marginTop: 2 },
  orderText: { fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
  actions: { gap: SPACING.xs },
  actionBtn: {
    width: 34, height: 34, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, fontFamily: FONTS.medium, marginTop: SPACING.md },

  // Text Section
  textSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  textHeader: { alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  textArea: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    fontFamily: FONTS.medium,
    minHeight: 120,
  },
  saveTextBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveTextBtnText: { color: '#fff', fontSize: 14, fontFamily: FONTS.bold },

  // Modal Form
  formContainer: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  imagePicker: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderStyle: 'dashed',
    alignSelf: 'center', marginBottom: SPACING.lg,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  imagePreview: { width: 100, height: 100, borderRadius: 50 },
  imagePickerPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  imagePickerText: { fontSize: 11, fontFamily: FONTS.medium, marginTop: 4 },
  label: { fontSize: 13, fontFamily: FONTS.semiBold, marginBottom: 6, marginTop: SPACING.sm },
  input: {
    borderRadius: RADIUS.md, borderWidth: 1,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 14, fontFamily: FONTS.medium,
  },
  saveBtn: {
    borderRadius: RADIUS.lg, paddingVertical: 14,
    alignItems: 'center', marginTop: SPACING.lg,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
});
