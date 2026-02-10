import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import { sliderApi } from '@/services/api';
import AppModal from '@/components/ui/AppModal';
import AppDialog from '@/components/ui/AppDialog';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/constants/config';

interface Slider {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function AdminSlidersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();

  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadSliders = useCallback(async () => {
    try {
      const res = await sliderApi.adminGetAll();
      setSliders(res.data.data || []);
    } catch (error) {
      console.error('Error loading sliders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSliders();
  }, [loadSliders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSliders();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingSlider(null);
    setTitle('');
    setLinkUrl('');
    setIsActive(true);
    setSortOrder('0');
    setSelectedImage(null);
    setShowModal(true);
  };

  const openEditModal = (slider: Slider) => {
    setEditingSlider(slider);
    setTitle(slider.title || '');
    setLinkUrl(slider.linkUrl || '');
    setIsActive(slider.isActive);
    setSortOrder(String(slider.sortOrder));
    setSelectedImage(null);
    setShowModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!editingSlider && !selectedImage) {
      alert('خطأ', 'يجب اختيار صورة');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('linkUrl', linkUrl);
      formData.append('isActive', String(isActive));
      formData.append('sortOrder', sortOrder || '0');

      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'slider.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }

      if (editingSlider) {
        await sliderApi.adminUpdate(editingSlider.id, formData);
      } else {
        await sliderApi.adminCreate(formData);
      }

      setShowModal(false);
      await loadSliders();
    } catch (error) {
      console.error('Error saving slider:', error);
      alert('خطأ', 'فشل حفظ الإعلان');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await sliderApi.adminDelete(deleteId);
      setDeleteId(null);
      await loadSliders();
    } catch (error) {
      console.error('Error deleting slider:', error);
      alert('خطأ', 'فشل حذف الإعلان');
    }
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: colors.accent }]}
        onPress={openCreateModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>إضافة إعلان</Text>
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {sliders.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد إعلانات بعد
            </Text>
          </View>
        ) : (
          sliders.map((slider) => (
            <View
              key={slider.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: slider.isActive ? colors.accent + '30' : colors.cardBorder,
                },
              ]}
            >
              {/* Image */}
              <Image
                source={{ uri: getFullImageUrl(slider.imageUrl) }}
                style={styles.cardImage}
                resizeMode="cover"
              />

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={[styles.cardRow, { flexDirection }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {slider.title || '(بدون عنوان)'}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: slider.isActive ? colors.success + '15' : colors.textTertiary + '15' },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: slider.isActive ? colors.success : colors.textTertiary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: slider.isActive ? colors.success : colors.textTertiary },
                      ]}
                    >
                      {slider.isActive ? 'نشط' : 'معطل'}
                    </Text>
                  </View>
                </View>

                {slider.linkUrl ? (
                  <Text style={[styles.cardLink, { color: colors.textTertiary }]} numberOfLines={2}>
                    🔗 {slider.linkUrl}
                  </Text>
                ) : null}

                <Text style={[styles.cardOrder, { color: colors.textTertiary }]}>
                  ترتيب: {slider.sortOrder}
                </Text>

                {/* Actions */}
                <View style={[styles.cardActions, { flexDirection }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.accent + '15' }]}
                    onPress={() => openEditModal(slider)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.accent} />
                    <Text style={[styles.actionText, { color: colors.accent }]}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                    onPress={() => setDeleteId(slider.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <AppModal visible={showModal} onClose={() => setShowModal(false)} title={editingSlider ? 'تعديل إعلان' : 'إعلان جديد'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Picker */}
          <TouchableOpacity
            style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
            ) : editingSlider?.imageUrl ? (
              <Image source={{ uri: getFullImageUrl(editingSlider.imageUrl) }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>
                  اختر صورة الإعلان
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>العنوان (اختياري)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: colors.text, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="عنوان الإعلان..."
            placeholderTextColor={colors.textTertiary}
          />

          {/* Link URL */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>رابط (اختياري)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: colors.text, borderColor: colors.border }]}
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* Sort Order */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>الترتيب</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: colors.text, borderColor: colors.border }]}
            value={sortOrder}
            onChangeText={setSortOrder}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />

          {/* Active Switch */}
          <View style={[styles.switchRow, { flexDirection }]}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>نشط</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.border, true: colors.accent + '60' }}
              thumbColor={isActive ? colors.accent : colors.textTertiary}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{editingSlider ? 'تحديث' : 'إضافة'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </AppModal>

      {/* Delete Confirmation */}
      <AppDialog
        visible={!!deleteId}
        type="warning"
        title="حذف الإعلان"
        message="هل أنت متأكد من حذف هذا الإعلان؟"
        buttons={[
          { text: 'إلغاء', style: 'cancel', onPress: () => setDeleteId(null) },
          { text: 'حذف', style: 'destructive', onPress: handleDelete },
        ]}
        onDismiss={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: SPACING.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardInfo: {
    padding: SPACING.md,
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardLink: {
    fontSize: 11,
  },
  cardOrder: {
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal
  imagePicker: {
    width: '100%',
    height: 170,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
