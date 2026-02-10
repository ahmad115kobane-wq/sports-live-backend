import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/services/api';
import { useRTL } from '@/contexts/RTLContext';
import { SOCKET_URL } from '@/constants/config';
import { useAlert } from '@/contexts/AlertContext';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user, updateUser } = useAuthStore();
  const { isRTL, t } = useRTL();
  const { alert } = useAlert();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const isPublisherOrAdmin = user?.role === 'publisher' || user?.role === 'admin';

  const getAvatarUrl = () => {
    if (user?.avatar) {
      return `${SOCKET_URL}${user.avatar}`;
    }
    return null;
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingAvatar(true);
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await userApi.uploadAvatar(formData);
      if (response.data?.data) {
        updateUser(response.data.data);
        alert(
          t('profile.success'),
          t('profile.avatarUpdated'),
        );
      }
    } catch (error: any) {
      alert(
        t('profile.error'),
        error.response?.data?.message || t('profile.avatarUploadFailed'),
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert(t('profile.error'), t('profile.nameRequired'));
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      alert(
        t('profile.error'),
        t('profile.passwordsNotMatch'),
      );
      return;
    }

    if (newPassword && newPassword.length < 6) {
      alert(
        t('profile.error'),
        t('profile.passwordMinLength'),
      );
      return;
    }

    if (newPassword && !currentPassword) {
      alert(
        t('profile.error'),
        t('profile.enterCurrentPassword'),
      );
      return;
    }

    try {
      setSaving(true);
      const data: any = {};

      if (name.trim() !== user?.name) {
        data.name = name.trim();
      }

      if (newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }

      if (Object.keys(data).length === 0) {
        alert(
          t('profile.info'),
          t('profile.noChanges'),
        );
        return;
      }

      const response = await userApi.updateProfile(data);
      if (response.data?.data) {
        updateUser(response.data.data);
        alert(
          t('profile.success'),
          t('profile.profileUpdated'),
          [{ text: t('common.ok'), onPress: () => router.back() }],
        );
      }
    } catch (error: any) {
      alert(
        t('profile.error'),
        error.response?.data?.message || t('profile.profileUpdateFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t('profile.editProfile'),
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section - Publisher/Admin only */}
          {isPublisherOrAdmin && (
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={[styles.avatarContainer, { borderColor: colors.accent + '40' }]}
                onPress={pickAvatar}
                disabled={uploadingAvatar}
                activeOpacity={0.7}
              >
                {uploadingAvatar ? (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent + '15' }]}>
                    <ActivityIndicator size="large" color={colors.accent} />
                  </View>
                ) : getAvatarUrl() ? (
                  <Image source={{ uri: getAvatarUrl()! }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent + '15' }]}>
                    <Ionicons name="person" size={40} color={colors.accent} />
                  </View>
                )}
                <View style={[styles.cameraIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarHint, { color: colors.textTertiary }]}>
                {t('profile.tapToChangeAvatar')}
              </Text>
            </View>
          )}

          {/* Name Field */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('profile.name')}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.enterName')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          {/* Email (read-only) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('profile.email')}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}
                value={user?.email || ''}
                editable={false}
              />
              <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
            </View>
          </View>

          {/* Password Section */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {t('profile.changePassword')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
            {t('profile.changePasswordHint')}
          </Text>

          {/* Current Password */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('profile.currentPassword')}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={t('profile.currentPassword')}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('profile.newPassword')}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="key-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('profile.newPassword')}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('profile.confirmPassword')}
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('profile.confirmPasswordPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showNewPassword}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {t('profile.saveChanges')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.md,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '700',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.labelLarge,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    ...SHADOWS.xs,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.bodyLarge,
    height: '100%',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.xl,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 48,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.sm,
  },
  saveBtnText: {
    ...TYPOGRAPHY.titleMedium,
    color: '#fff',
    fontWeight: '700',
  },
});
