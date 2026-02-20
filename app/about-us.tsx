import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme } from '@/contexts/ThemeContext';
import { aboutApi } from '@/services/api';

interface AboutMember {
  id: string;
  name: string;
  title: string;
  imageUrl?: string;
  sortOrder: number;
}

const STATUS_TOP = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24);

export default function AboutUsScreen() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();

  const [members, setMembers] = useState<AboutMember[]>([]);
  const [aboutText, setAboutText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await aboutApi.getPublic();
      setMembers(res.data?.data?.members || []);
      setAboutText(res.data?.data?.text || '');
    } catch (error) {
      console.error('Error loading about data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>من نحن</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>من نحن</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.accent} />}
      >
        {/* App Icon */}
        <View style={styles.logoSection}>
          <Image source={require('@/assets/icon.png')} style={{ width: 80, height: 80, borderRadius: 20 }} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.text }]}>{t('app.name')}</Text>
        </View>

        {/* Members */}
        {members.length > 0 && (
          <View style={styles.membersSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              أعضاء الاتحاد
            </Text>
            {members.map((member) => (
              <View
                key={member.id}
                style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.memberInner, { flexDirection }]}>
                  {member.imageUrl ? (
                    <Image source={{ uri: member.imageUrl }} style={styles.memberAvatar} />
                  ) : (
                    <View style={[styles.memberAvatarFallback, { backgroundColor: colors.accent + '15' }]}>
                      <Ionicons name="person" size={28} color={colors.accent} />
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberTitle, { color: colors.accent, textAlign: isRTL ? 'right' : 'left' }]}>
                      {member.title}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* About Text */}
        {aboutText ? (
          <View style={[styles.textSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.aboutText, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {aboutText}
            </Text>
          </View>
        ) : null}

        {/* Empty State */}
        {members.length === 0 && !aboutText && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              لا توجد معلومات حالياً
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_TOP + 8,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17, fontFamily: FONTS.bold,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  appName: {
    fontSize: 20, fontFamily: FONTS.bold, marginTop: SPACING.md,
  },
  membersSection: {
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16, fontFamily: FONTS.bold, marginBottom: SPACING.md,
  },
  memberCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  memberInner: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  memberAvatar: {
    width: 56, height: 56, borderRadius: 28,
  },
  memberAvatarFallback: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16, fontFamily: FONTS.semiBold,
  },
  memberTitle: {
    fontSize: 13, fontFamily: FONTS.medium, marginTop: 3,
  },
  textSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  aboutText: {
    fontSize: 14, fontFamily: FONTS.regular, lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15, fontFamily: FONTS.medium, marginTop: SPACING.md,
  },
});
