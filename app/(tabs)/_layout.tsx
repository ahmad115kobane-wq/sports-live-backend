import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@/components/ui/BlurView';
import { Colors } from '@/constants/Colors';
import { useRTL } from '@/contexts/RTLContext';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useRef } from 'react';

// ─── Modern Floating Tab Icon ───
function TabIcon({ 
  name, 
  focused, 
  color, 
  accentColor,
  isDark,
}: { 
  name: string; 
  focused: boolean; 
  color: string;
  accentColor: string;
  isDark: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const pillScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconTranslate = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  return (
    <View style={styles.iconWrapper}>
      {/* Active pill background */}
      <Animated.View
        style={[
          styles.activePill,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            transform: [{ scaleX: pillScale }, { scaleY: pillScale }],
            opacity: scaleAnim,
          },
        ]}
      />
      {/* Icon */}
      <Animated.View style={[styles.iconContainer, { transform: [{ translateY: iconTranslate }] }]}>
        <Ionicons 
          name={(focused ? name : `${name}-outline`) as any}
          size={focused ? 22 : 21} 
          color={color} 
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colorScheme, isDark } = useTheme();
  const colors = Colors[colorScheme];
  const { t, isRTL } = useRTL();

  return (
    <Tabs
      screenOptions={{
        lazy: true,
        freezeOnBlur: true,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 0,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Platform.OS === 'ios' ? 26 : 12,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          borderRadius: 20,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden' }]}>
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <View 
              style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: isDark ? 'rgba(20,20,20,0.92)' : 'rgba(245,245,245,0.92)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  borderRadius: 20,
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
              name="football" 
              focused={focused} 
              color={color}
              accentColor={colors.accent}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t('news.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name="newspaper" 
              focused={focused} 
              color={color}
              accentColor={colors.accent}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name="star" 
              focused={focused} 
              color={focused ? colors.tertiary : color}
              accentColor={colors.tertiary}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: t('store.tab'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name="bag-handle" 
              focused={focused} 
              color={color}
              accentColor={colors.accent}
              isDark={isDark}
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
              name="person-circle" 
              focused={focused} 
              color={color}
              accentColor={colors.accent}
              isDark={isDark}
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
    width: 48,
    height: 30,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderRadius: 14,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
