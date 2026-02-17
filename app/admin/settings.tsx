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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { settingsApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';

const CONTACT_FIELDS = [
  { key: 'contact_email', label: 'البريد الإلكتروني', icon: 'mail-outline', placeholder: 'example@mail.com', keyboardType: 'email-address' as const },
  { key: 'contact_phone', label: 'رقم الهاتف', icon: 'call-outline', placeholder: '+964 xxx xxx xxxx', keyboardType: 'phone-pad' as const },
  { key: 'contact_instagram', label: 'انستغرام', icon: 'logo-instagram', placeholder: '@username', keyboardType: 'default' as const },
  { key: 'contact_facebook', label: 'فيسبوك', icon: 'logo-facebook', placeholder: 'رابط أو اسم الصفحة', keyboardType: 'default' as const },
  { key: 'contact_telegram', label: 'تيليغرام', icon: 'paper-plane-outline', placeholder: '@username', keyboardType: 'default' as const },
  { key: 'contact_website', label: 'الموقع الإلكتروني', icon: 'globe-outline', placeholder: 'https://example.com', keyboardType: 'url' as const },
];

export default function AdminSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { isRTL } = useRTL();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<any>({ type: 'error', title: '', message: '' });

  const loadSettings = useCallback(async () => {
    try {
      const res = await settingsApi.getAll();
      setSettings(res.data.data || {});
      setHasChanges(false);
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const onRefresh = () => { setRefreshing(true); loadSettings(); };

  const updateField = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const contactSettings: Record<string, string> = {};
      CONTACT_FIELDS.forEach(field => {
        contactSettings[field.key] = settings[field.key] || '';
      });
      await settingsApi.adminUpdate(contactSettings);
      setHasChanges(false);
      setDialogConfig({ type: 'success', title: 'تم الحفظ', message: 'تم حفظ الإعدادات بنجاح' });
      setDialogVisible(true);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'فشل في حفظ الإعدادات';
      setDialogConfig({ type: 'error', title: 'خطأ', message: msg });
      setDialogVisible(true);
    } finally {
      setSaving(false);
    }
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
        {/* Contact Info Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="call" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>معلومات الاتصال</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.textTertiary }]}>
            هذه المعلومات ستظهر في صفحة "حول التطبيق" للمستخدمين
          </Text>

          {CONTACT_FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldContainer}>
              <View style={[styles.fieldLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name={field.icon as any} size={16} color={colors.textSecondary} />
                <Text style={[styles.fieldLabelText, { color: colors.textSecondary }]}>{field.label}</Text>
              </View>
              <TextInput
                style={[styles.fieldInput, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  borderColor: colors.border,
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                }]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textTertiary}
                value={settings[field.key] || ''}
                onChangeText={(val) => updateField(field.key, val)}
                keyboardType={field.keyboardType}
                autoCapitalize="none"
              />
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: hasChanges ? colors.accent : colors.border }]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>حفظ الإعدادات</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onClose={() => setDialogVisible(false)}
        onConfirm={() => setDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  sectionDesc: {
    fontSize: 12,
    marginBottom: SPACING.md,
    paddingStart: 48,
    fontFamily: FONTS.regular,
  },
  fieldContainer: {
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabelText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
