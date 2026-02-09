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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { legalApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  titleKu: string;
  content: string;
  contentAr: string;
  contentKu: string;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminLegalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();

  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LegalPage | null>(null);

  // Form
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleKu, setTitleKu] = useState('');
  const [content, setContent] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [contentKu, setContentKu] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');

  // Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<any>({ type: 'error', title: '', message: '' });

  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({ type: 'warning', title, message, showCancel: true, onConfirm });
    setDialogVisible(true);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await legalApi.adminGetAll();
      setPages(res.data.data || []);
    } catch (error) {
      console.error('Load legal pages error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const openModal = (page?: LegalPage) => {
    if (page) {
      setEditing(page);
      setSlug(page.slug);
      setTitle(page.title);
      setTitleAr(page.titleAr);
      setTitleKu(page.titleKu);
      setContent(page.content);
      setContentAr(page.contentAr);
      setContentKu(page.contentKu);
      setIsActive(page.isActive);
      setSortOrder(String(page.sortOrder));
    } else {
      setEditing(null);
      setSlug('');
      setTitle('');
      setTitleAr('');
      setTitleKu('');
      setContent('');
      setContentAr('');
      setContentKu('');
      setIsActive(true);
      setSortOrder('0');
    }
    setShowModal(true);
  };

  const savePage = async () => {
    if (!slug || !title || !titleAr || !titleKu) {
      showError('خطأ', 'يرجى ملء جميع حقول العنوان والمعرّف');
      return;
    }
    setSaving(true);
    try {
      const data = {
        slug,
        title,
        titleAr,
        titleKu,
        content,
        contentAr,
        contentKu,
        isActive,
        sortOrder: parseInt(sortOrder) || 0,
      };
      if (editing) {
        await legalApi.adminUpdate(editing.id, data);
      } else {
        await legalApi.adminCreate(data);
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'فشل في حفظ الصفحة';
      showError('خطأ', msg);
    } finally {
      setSaving(false);
    }
  };

  const deletePage = (page: LegalPage) => {
    showConfirm('حذف الصفحة', `هل تريد حذف "${page.titleAr}"؟`, async () => {
      setDialogVisible(false);
      try {
        await legalApi.adminDelete(page.id);
        loadData();
      } catch (error) {
        showError('خطأ', 'فشل في حذف الصفحة');
      }
    });
  };

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
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          onPress={() => openModal()}
        >
          <Ionicons name="add-circle" size={20} color={colors.accent} />
          <Text style={[styles.addBtnText, { color: colors.accent }]}>إضافة صفحة قانونية</Text>
        </TouchableOpacity>

        {/* Pages List */}
        {pages.map((page) => (
          <View key={page.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.cardHeader, { flexDirection }]}>
              <View style={[styles.cardIcon, { backgroundColor: colors.accent + '15' }]}>
                <Ionicons name="document-text" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{page.titleAr}</Text>
                <Text style={[styles.cardSlug, { color: colors.textTertiary }]}>{page.slug}</Text>
              </View>
              {!page.isActive && (
                <View style={[styles.inactiveBadge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>معطل</Text>
                </View>
              )}
            </View>
            {page.contentAr ? (
              <Text style={[styles.cardPreview, { color: colors.textSecondary }]} numberOfLines={2}>
                {page.contentAr}
              </Text>
            ) : null}
            <View style={[styles.cardActions, { flexDirection }]}>
              <TouchableOpacity
                onPress={() => openModal(page)}
                style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)' }]}
              >
                <Ionicons name="create-outline" size={16} color="#6366f1" />
                <Text style={{ color: '#6366f1', fontSize: 12, fontWeight: '600' }}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deletePage(page)}
                style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.08)' }]}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {pages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا توجد صفحات قانونية بعد</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit/Create Modal */}
      <AppModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'تعديل الصفحة' : 'إضافة صفحة قانونية'}
        icon="document-text"
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Slug */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المعرّف (slug)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={slug}
            onChangeText={setSlug}
            placeholder="مثال: privacy-policy"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
          />

          {/* Title EN */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>العنوان (English)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Privacy Policy"
            placeholderTextColor={colors.textTertiary}
          />

          {/* Title AR */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>العنوان (عربي)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, textAlign: 'right' }]}
            value={titleAr}
            onChangeText={setTitleAr}
            placeholder="سياسة الخصوصية"
            placeholderTextColor={colors.textTertiary}
          />

          {/* Title KU */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>العنوان (كوردي)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, textAlign: 'right' }]}
            value={titleKu}
            onChangeText={setTitleKu}
            placeholder="سیاسەتی تایبەتمەندی"
            placeholderTextColor={colors.textTertiary}
          />

          {/* Content EN */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المحتوى (English)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={content}
            onChangeText={setContent}
            placeholder="Page content..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Content AR */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المحتوى (عربي)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, textAlign: 'right' }]}
            value={contentAr}
            onChangeText={setContentAr}
            placeholder="محتوى الصفحة..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Content KU */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المحتوى (كوردي)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, textAlign: 'right' }]}
            value={contentKu}
            onChangeText={setContentKu}
            placeholder="ناوەڕۆکی لاپەڕە..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Sort Order */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الترتيب</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={sortOrder}
            onChangeText={setSortOrder}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />

          {/* Active Toggle */}
          <View style={[styles.switchRow, { flexDirection }]}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>مفعّل</Text>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.accent }} />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
            onPress={savePage}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{editing ? 'تحديث' : 'إنشاء'}</Text>
              </>
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
        confirmText={dialogConfig.showCancel ? 'تأكيد' : 'حسناً'}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.md },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  addBtnText: { fontSize: 14, fontWeight: '600' },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSlug: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardPreview: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    gap: SPACING.md,
  },
  emptyText: { fontSize: 15, fontWeight: '500' },
  modalScroll: { paddingHorizontal: SPACING.lg, maxHeight: 500 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    minHeight: 120,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.lg,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
