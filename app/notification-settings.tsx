import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRTL } from '@/contexts/RTLContext';
import { getNotificationPreferences, updateNotificationPreferences } from '@/services/notifications';

export default function NotificationSettings() {
  const { t, isRTL } = useRTL();
  const colors = Colors.dark;

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

  async function updateSetting(key: string, value: boolean) {
    const newSettings = { ...settings, [key]: value };
    
    // If disabling main toggle, disable all
    if (key === 'enabled' && !value) {
      Object.keys(newSettings).forEach(k => {
        if (k !== 'enabled') newSettings[k] = false;
      });
    }
    
    setSettings(newSettings);
    setSaving(true);

    const success = await updateNotificationPreferences(newSettings);
    
    if (success) {
      // Show success message
      Alert.alert(
        t('common.success'),
        t('settings.notificationsSaved'),
        [{ text: t('common.ok') }]
      );
    } else {
      // Revert on failure
      setSettings(settings);
      Alert.alert(
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
      title: isRTL ? 'تفعيل الإشعارات' : 'Enable Notifications',
      description: isRTL ? 'تفعيل/تعطيل جميع الإشعارات' : 'Enable/disable all notifications',
      color: colors.primary,
    },
    {
      key: 'preMatch',
      icon: 'time',
      title: isRTL ? 'تذكير قبل المباراة' : 'Pre-Match Reminder',
      description: isRTL ? 'إشعار قبل 15 دقيقة من بداية المباراة' : 'Notification 15 minutes before match starts',
      color: '#FF9500',
    },
    {
      key: 'matchStart',
      icon: 'play-circle',
      title: isRTL ? 'بداية المباراة' : 'Match Start',
      description: isRTL ? 'إشعار عند بداية المباراة' : 'Notification when match starts',
      color: '#34C759',
    },
    {
      key: 'goals',
      icon: 'football',
      title: isRTL ? 'الأهداف' : 'Goals',
      description: isRTL ? 'إشعار عند تسجيل هدف' : 'Notification when a goal is scored',
      color: '#00C7BE',
    },
    {
      key: 'redCards',
      icon: 'square',
      title: isRTL ? 'البطاقات الحمراء' : 'Red Cards',
      description: isRTL ? 'إشعار عند طرد لاعب' : 'Notification when a player is sent off',
      color: '#FF3B30',
    },
    {
      key: 'penalties',
      icon: 'flag',
      title: isRTL ? 'ركلات الجزاء' : 'Penalties',
      description: isRTL ? 'إشعار عند احتساب ركلة جزاء' : 'Notification when a penalty is awarded',
      color: '#FF9500',
    },
    {
      key: 'matchEnd',
      icon: 'checkmark-circle',
      title: isRTL ? 'نهاية المباراة' : 'Match End',
      description: isRTL ? 'إشعار عند انتهاء المباراة' : 'Notification when match ends',
      color: '#5856D6',
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: isRTL ? 'إعدادات الإشعارات' : 'Notification Settings',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
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
          title: isRTL ? 'إعدادات الإشعارات' : 'Notification Settings',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Ionicons name="notifications" size={48} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isRTL ? 'إدارة الإشعارات' : 'Manage Notifications'}
          </Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            {isRTL
              ? 'اختر أنواع الإشعارات التي تريد استقبالها'
              : 'Choose which notifications you want to receive'}
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
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
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
                onValueChange={(value) => updateSetting(item.key, value)}
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
            {isRTL
              ? 'ستتلقى إشعارات فقط للفرق والبطولات المفضلة لديك'
              : 'You will only receive notifications for your favorite teams and competitions'}
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
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  headerDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18,
  },
});
