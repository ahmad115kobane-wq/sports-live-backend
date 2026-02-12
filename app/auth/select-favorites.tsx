import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { competitionApi, teamApi, matchApi, userApi } from '@/services/api';
import { Competition, Team, Match } from '@/types';

export default function SelectFavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();

  const [step, setStep] = useState<'competitions' | 'teams'>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    setLoadingCompetitions(true);
    try {
      const response = await competitionApi.getActive();
      setCompetitions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoadingCompetitions(false);
    }
  };

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      // If no competitions selected, show all teams
      if (selectedCompetitions.length === 0) {
        const teamsResponse = await teamApi.getAll();
        const allTeams: Team[] = teamsResponse.data.data || [];
        setTeams(allTeams);
        setLoadingTeams(false);
        return;
      }
      
      // Get teams for each selected competition
      const teamsPromises = selectedCompetitions.map(compId => {
        return teamApi.getByCompetition(compId);
      });
      
      const teamsResponses = await Promise.all(teamsPromises);
      
      // Combine and deduplicate teams
      const allTeamsMap = new Map<string, Team>();
      teamsResponses.forEach((response) => {
        const teams: Team[] = response.data.data || [];
        teams.forEach(team => {
          allTeamsMap.set(team.id, team);
        });
      });
      
      const uniqueTeams = Array.from(allTeamsMap.values());
      
      setTeams(uniqueTeams);
    } catch (error) {
      // Fallback: show all teams
      try {
        const teamsResponse = await teamApi.getAll();
        const allTeams: Team[] = teamsResponse.data.data || [];
        setTeams(allTeams);
      } catch (fallbackError) {
        setTeams([]);
      }
    } finally {
      setLoadingTeams(false);
    }
  };

  const toggleCompetition = (id: string) => {
    setSelectedCompetitions(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 'competitions' && selectedCompetitions.length > 0) {
      setStep('teams');
      fetchTeams();
    }
  };

  const handleBack = () => {
    if (step === 'teams') {
      setStep('competitions');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to backend if user is authenticated
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await userApi.savePreferences({
          favoriteTeams: selectedTeams,
          favoriteCompetitions: selectedCompetitions,
        });
      }
      
      // Also save locally as backup
      await AsyncStorage.setItem('favoriteTeams', JSON.stringify(selectedTeams));
      await AsyncStorage.setItem('favoriteCompetitions', JSON.stringify(selectedCompetitions));
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving favorites:', error);
      // If backend fails, at least save locally
      try {
        await AsyncStorage.setItem('favoriteTeams', JSON.stringify(selectedTeams));
        await AsyncStorage.setItem('favoriteCompetitions', JSON.stringify(selectedCompetitions));
        router.replace('/(tabs)');
      } catch (localError) {
        console.error('Error saving locally:', localError);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <LinearGradient
            colors={colors.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="heart" size={28} color="#fff" />
          </LinearGradient>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 'competitions' ? t('favorites.selectCompetitions') : t('favorites.selectTeams')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 'competitions' ? t('favorites.selectCompetitionsDesc') : t('favorites.selectTeamsDesc')}
        </Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.accent, width: step === 'competitions' ? '50%' : '100%' }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'competitions' ? (
          loadingCompetitions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <View style={styles.selectionGrid}>
              {competitions.map((comp) => (
                <TouchableOpacity
                  key={comp.id}
                  style={[
                    styles.selectionItem,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    selectedCompetitions.includes(comp.id) && { borderColor: colors.accent, backgroundColor: colors.accentGlow }
                  ]}
                  onPress={() => toggleCompetition(comp.id)}
                  activeOpacity={0.7}
                >
                  {comp.logoUrl ? (
                    <Image source={{ uri: comp.logoUrl }} style={styles.selectionLogo} resizeMode="contain" />
                  ) : (
                    <View style={[styles.selectionLogoPlaceholder, { backgroundColor: colors.surface }]}>
                      <Ionicons name="trophy" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                  <Text style={[styles.selectionName, { color: colors.text }]} numberOfLines={2}>
                    {comp.name}
                  </Text>
                  {selectedCompetitions.includes(comp.id) && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          loadingTeams ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : teams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="football-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('favorites.noTeamsInCompetition')}
              </Text>
            </View>
          ) : (
            <View style={styles.selectionGrid}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.selectionItem,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    selectedTeams.includes(team.id) && { borderColor: colors.accent, backgroundColor: colors.accentGlow }
                  ]}
                  onPress={() => toggleTeam(team.id)}
                  activeOpacity={0.7}
                >
                  {team.logoUrl ? (
                    <Image source={{ uri: team.logoUrl }} style={styles.selectionLogo} resizeMode="contain" />
                  ) : (
                    <View style={[styles.selectionLogoPlaceholder, { backgroundColor: team.primaryColor || colors.surface }]}>
                      <Ionicons name="shield" size={24} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.selectionName, { color: colors.text }]} numberOfLines={2}>
                    {team.name}
                  </Text>
                  {selectedTeams.includes(team.id) && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <View style={[styles.buttonRow, { flexDirection }]}>
          {step === 'teams' && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surfacePressed }]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>{t('common.back')}</Text>
            </TouchableOpacity>
          )}

          {step === 'competitions' && (
            <TouchableOpacity
              style={[styles.skipButton]}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>{t('common.skip')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton, 
              { shadowColor: colors.accent },
              (step === 'competitions' && selectedCompetitions.length === 0) && styles.buttonDisabled
            ]}
            onPress={step === 'teams' ? handleSave : handleNext}
            disabled={(step === 'competitions' && selectedCompetitions.length === 0) || saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={[styles.buttonContent, { flexDirection }]}>
                  <Text style={styles.nextButtonText}>
                    {step === 'teams' ? t('common.done') : t('common.next')}
                  </Text>
                  <Ionicons 
                    name={step === 'teams' ? "checkmark" : (isRTL ? "arrow-forward" : "arrow-back")} 
                    size={20} 
                    color="#fff" 
                  />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 20,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: SPACING.md,
  },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: SPACING.xl,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectionItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectionLogo: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  selectionLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selectionName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  nextButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
