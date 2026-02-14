import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import { getNotificationPreferences, updateNotificationPreferences } from '@/services/notifications';

export default function NotificationSettings() {
  const { t, isRTL } = useRTL();
  const { alert } = useAlert();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    preMatch: true,
    matchStart: true,
    goals: true,
    redCards: true,
    penalties: true,
    matchEnd: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const prefs = await getNotificationPreferences();
      if (prefs) {
        setSettings(prefs);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(key: keyof typeof settings, value: boolean) {
    const newSettings = { ...settings, [key]: value };
    
    // If disabling main toggle, disable all
    if (key === 'enabled' && !value) {
      (Object.keys(newSettings) as Array<keyof typeof settings>).forEach(k => {
        if (k !== 'enabled') newSettings[k] = false;
      });
    }
    
    setSettings(newSettings);
    setSaving(true);

    const success = await updateNotificationPreferences(newSettings);
    
    if (success) {
      // Show success message
      alert(
        t('common.success'),
        t('settings.notificationsSaved'),
        [{ text: t('common.ok') }]
      );
    } else {
      // Revert on failure
      setSettings(settings);
      alert(
        t('common.error'),
        t('settings.notificationsSaveFailed'),
        [{ text: t('common.ok') }]
      );
    }
    
    setSaving(false);
  }

  const settingItems = [
    {
      key: 'enabled',
      icon: 'notifications',
      title: t('notificationSettings.enableNotifications'),
      description: t('notificationSettings.enableNotificationsDesc'),
      color: colors.primary,
    },
    {
      key: 'preMatch',
      icon: 'time',
      title: t('notificationSettings.preMatch'),
      description: t('notificationSettings.preMatchDesc'),
      color: '#FF9500',
    },
    {
      key: 'matchStart',
      icon: 'play-circle',
      title: t('notificationSettings.matchStart'),
      description: t('notificationSettings.matchStartDesc'),
      color: '#34C759',
    },
    {
      key: 'goals',
      icon: 'football',
      title: t('notificationSettings.goals'),
      description: t('notificationSettings.goalsDesc'),
      color: '#00C7BE',
    },
    {
      key: 'redCards',
      icon: 'square',
      title: t('notificationSettings.redCards'),
      description: t('notificationSettings.redCardsDesc'),
      color: '#FF3B30',
    },
    {
      key: 'penalties',
      icon: 'flag',
      title: t('notificationSettings.penalties'),
      description: t('notificationSettings.penaltiesDesc'),
      color: '#FF9500',
    },
    {
      key: 'matchEnd',
      icon: 'checkmark-circle',
      title: t('notificationSettings.matchEnd'),
      description: t('notificationSettings.matchEndDesc'),
      color: '#5856D6',
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: t('notificationSettings.title'),
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('common.loading')}...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t('notificationSettings.title'),
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Ionicons name="notifications" size={48} color={colors.accent} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('notificationSettings.manage')}
          </Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            {t('notificationSettings.manageDesc')}
          </Text>
        </View>

        <View style={styles.settingsList}>
          {settingItems.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.settingItem,
                { backgroundColor: colors.card },
                index === 0 && styles.firstItem,
                index === settingItems.length - 1 && styles.lastItem,
              ]}
            >
              <View style={[styles.settingLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20', marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings[item.key as keyof typeof settings]}
                onValueChange={(value) => updateSetting(item.key as keyof typeof settings, value)}
                disabled={saving || (item.key !== 'enabled' && !settings.enabled)}
                trackColor={{ false: colors.border, true: item.color }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('notificationInfo.hint')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    fontFamily: FONTS.bold,
  },
  headerDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: FONTS.regular,
  },
  settingsList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginHorizontal: 12,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
});
