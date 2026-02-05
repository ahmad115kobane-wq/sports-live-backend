import { Tabs } from 'expo-router';
import { useColorScheme, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@/components/ui/BlurView';
import { Colors } from '@/constants/Colors';
import { useMatchStore } from '@/store/matchStore';
import { useRTL } from '@/contexts/RTLContext';

// Custom Tab Icon Component - Optimized for performance
function TabIcon({ 
  name, 
  focused, 
  color, 
  isLive = false,
  badgeCount = 0,
  accentColor,
  liveColor,
}: { 
  name: string; 
  focused: boolean; 
  color: string;
  isLive?: boolean;
  badgeCount?: number;
  accentColor: string;
  liveColor: string;
}) {
  return (
    <View style={styles.iconWrapper}>
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: accentColor }]} />
      )}
      <View style={styles.iconContainer}>
        <Ionicons 
          name={(focused ? name : `${name}-outline`) as any}
          size={24} 
          color={isLive && badgeCount > 0 ? liveColor : color} 
        />
        {isLive && badgeCount > 0 && (
          <View 
            style={[
              styles.liveBadge, 
              { backgroundColor: liveColor }
            ]}
          >
            <View style={styles.liveDotInner} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { liveMatches } = useMatchStore();
  const { t, isRTL } = useRTL();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={90}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <View 
              style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: colors.tabBar,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }
              ]} 
            />
          </View>
        ),
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name="home" 
              focused={focused} 
              color={color}
              accentColor={colors.accent}
              liveColor={colors.live}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t('match.live'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name="pulse" 
              focused={focused} 
              color={color}
              isLive={true}
              badgeCount={liveMatches.length}
              accentColor={colors.accent}
              liveColor={colors.live}
            />
          ),
          tabBarBadge: liveMatches.length > 0 ? liveMatches.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.live,
            color: '#fff',
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            top: -2,
          },
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name="heart" 
              focused={focused} 
              color={focused ? colors.tertiary : color}
              accentColor={colors.tertiary}
              liveColor={colors.live}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name="person" 
              focused={focused} 
              color={color}
              accentColor={colors.accent}
              liveColor={colors.live}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 36,
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  liveDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});
