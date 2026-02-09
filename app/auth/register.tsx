import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { competitionApi, teamApi, matchApi } from '@/services/api';
import { Competition, Team, Match } from '@/types';

// Cities list
const CITIES = [
  'Baghdad', 'Basra', 'Erbil', 'Sulaymaniyah', 'Mosul', 'Kirkuk', 
  'Najaf', 'Karbala', 'Nasiriyah', 'Amarah', 'Diwaniyah', 'Hillah',
  'Duhok', 'Samawah', 'Kut', 'Ramadi', 'Fallujah', 'Tikrit'
];

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t, isRTL, flexDirection } = useRTL();
  
  // Form state - Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  
  // Form state - Step 2
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form state - Step 3 (Favorites)
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  
  // UI state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { register, upgradeGuest, isGuest, user } = useAuthStore();

  // Animations removed

  // Fetch competitions when step 3 is reached
  useEffect(() => {
    if (step === 3) {
      fetchCompetitions();
    }
  }, [step]);

  // Fetch teams when competitions are selected
  useEffect(() => {
    if (selectedCompetitions.length > 0) {
      fetchTeams();
    } else {
      setTeams([]);
    }
  }, [selectedCompetitions]);

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
      // Get matches for selected competitions to extract teams
      const matchesResponse = await matchApi.getAll();
      const allMatches: Match[] = matchesResponse.data.data || [];
      
      // Filter matches by selected competitions
      const filteredMatches = allMatches.filter(match => 
        match.competitionId && selectedCompetitions.includes(match.competitionId)
      );
      
      // Extract unique team IDs from filtered matches
      const teamIdsSet = new Set<string>();
      filteredMatches.forEach(match => {
        teamIdsSet.add(match.homeTeamId);
        teamIdsSet.add(match.awayTeamId);
      });
      
      // Get all teams and filter by extracted IDs
      const teamsResponse = await teamApi.getAll();
      const allTeams: Team[] = teamsResponse.data.data || [];
      const filteredTeams = allTeams.filter(team => teamIdsSet.has(team.id));
      
      setTeams(filteredTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
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

  const validateStep1 = () => {
    if (!firstName.trim()) {
      Alert.alert(t('common.error'), t('auth.firstNameRequired'));
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert(t('common.error'), t('auth.lastNameRequired'));
      return false;
    }
    if (!age || parseInt(age) < 13 || parseInt(age) > 100) {
      Alert.alert(t('common.error'), t('auth.invalidAge'));
      return false;
    }
    if (!city) {
      Alert.alert(t('common.error'), t('auth.cityRequired'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
      return false;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordMinLength'));
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsNotMatch'));
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setLoading(true);
      try {
        const fullName = `${firstName} ${lastName}`;
        if (isGuest && user?.id) {
          // Upgrade guest account — keeps all existing data (favorites, notifications, etc.)
          await upgradeGuest(fullName, email, password);
        } else {
          // Create new account
          await register(fullName, email, password);
        }
        router.replace('/auth/select-favorites');
      } catch (error: any) {
        Alert.alert(t('auth.registerFailed'), error.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Save favorite teams to AsyncStorage
      if (selectedTeams.length > 0) {
        await AsyncStorage.setItem('favoriteTeams', JSON.stringify(selectedTeams));
      }
      if (selectedCompetitions.length > 0) {
        await AsyncStorage.setItem('favoriteCompetitions', JSON.stringify(selectedCompetitions));
      }
      
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return { level: 1, text: t('auth.weak'), color: colors.error };
    if (password.length < 10) return { level: 2, text: t('auth.medium'), color: colors.warning };
    return { level: 3, text: t('auth.strong'), color: colors.accent };
  };

  const passwordStrength = getPasswordStrength();

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* First Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {t('auth.firstName')}
        </Text>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          focusedInput === 'firstName' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
          { flexDirection }
        ]}>
          <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'firstName' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}>
            <Ionicons name="person-outline" size={20} color={focusedInput === 'firstName' ? colors.accent : colors.textTertiary} />
          </View>
          <TextInput
            style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
            placeholder={t('auth.enterFirstName')}
            placeholderTextColor={colors.textTertiary}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            onFocus={() => setFocusedInput('firstName')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Last Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {t('auth.lastName')}
        </Text>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          focusedInput === 'lastName' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
          { flexDirection }
        ]}>
          <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'lastName' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}>
            <Ionicons name="person-outline" size={20} color={focusedInput === 'lastName' ? colors.accent : colors.textTertiary} />
          </View>
          <TextInput
            style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
            placeholder={t('auth.enterLastName')}
            placeholderTextColor={colors.textTertiary}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            onFocus={() => setFocusedInput('lastName')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Age */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {t('auth.age')}
        </Text>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          focusedInput === 'age' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
          { flexDirection }
        ]}>
          <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'age' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={20} color={focusedInput === 'age' ? colors.accent : colors.textTertiary} />
          </View>
          <TextInput
            style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
            placeholder={t('auth.enterAge')}
            placeholderTextColor={colors.textTertiary}
            value={age}
            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            onFocus={() => setFocusedInput('age')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* City */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {t('auth.city')}
        </Text>
        <TouchableOpacity
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            showCityPicker && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
            { flexDirection }
          ]}
          onPress={() => setShowCityPicker(!showCityPicker)}
          activeOpacity={0.8}
        >
          <View style={[styles.inputIcon, { backgroundColor: colors.surface }, showCityPicker && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}>
            <Ionicons name="location-outline" size={20} color={showCityPicker ? colors.accent : colors.textTertiary} />
          </View>
          <Text style={[
            styles.selectText,
            { textAlign: isRTL ? 'right' : 'left' },
            city ? { color: colors.text } : { color: colors.textTertiary }
          ]}>
            {city || t('auth.selectCity')}
          </Text>
          <Ionicons name={showCityPicker ? "chevron-up" : "chevron-down"} size={20} color={colors.textTertiary} />
        </TouchableOpacity>
        
        {showCityPicker && (
          <View style={[styles.cityPickerContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <ScrollView style={styles.cityPicker} nestedScrollEnabled>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.cityOption,
                    { borderBottomColor: colors.border },
                    city === c && { backgroundColor: colors.accentGlow }
                  ]}
                  onPress={() => {
                    setCity(c);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[
                    styles.cityOptionText,
                    { color: colors.textSecondary },
                    city === c && { color: colors.accent }
                  ]}>
                    {c}
                  </Text>
                  {city === c && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.primaryButton, { shadowColor: colors.accent }]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <View style={[styles.buttonContent, { flexDirection }]}>
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('common.next')}</Text>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={colors.textInverse} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Footer */}
      <View style={[styles.footer, { flexDirection }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('auth.haveAccount')} </Text>
        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text style={[styles.footerLink, { color: colors.accent }]}>{t('auth.signIn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {t('auth.email')}
        </Text>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          focusedInput === 'email' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
          { flexDirection }
        ]}>
          <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'email' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}>
            <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? colors.accent : colors.textTertiary} />
          </View>
          <TextInput
            style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
            placeholder={t('auth.enterEmail')}
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Password */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {t('auth.password')}
        </Text>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          focusedInput === 'password' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
          { flexDirection }
        ]}>
          <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'password' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}>
            <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? colors.accent : colors.textTertiary} />
          </View>
          <TextInput
            style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
            placeholder={t('auth.createPassword')}
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={colors.textTertiary} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Password Strength */}
        {passwordStrength && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBars}>
              <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
              <View style={[styles.strengthBar, { backgroundColor: passwordStrength.level >= 2 ? passwordStrength.color : colors.border }]} />
              <View style={[styles.strengthBar, { backgroundColor: passwordStrength.level >= 3 ? passwordStrength.color : colors.border }]} />
            </View>
            <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
              {passwordStrength.text}
            </Text>
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
          {t('auth.confirmPassword')}
        </Text>
        <View style={[
          styles.inputWrapper,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          focusedInput === 'confirm' && { borderColor: colors.accent, backgroundColor: colors.accentGlow },
          confirmPassword && confirmPassword !== password && { borderColor: colors.error },
          { flexDirection }
        ]}>
          <View style={[styles.inputIcon, { backgroundColor: colors.surface }, focusedInput === 'confirm' && { backgroundColor: colors.accentGlow }, isRTL ? { marginLeft: 10 } : { marginRight: 10 }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'confirm' ? colors.accent : colors.textTertiary} />
          </View>
          <TextInput
            style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
            placeholder={t('auth.confirmYourPassword')}
            placeholderTextColor={colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            onFocus={() => setFocusedInput('confirm')}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons 
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={colors.textTertiary} 
            />
          </TouchableOpacity>
        </View>
        
        {confirmPassword && password && (
          <View style={[styles.matchIndicator, { flexDirection }]}>
            <Ionicons 
              name={confirmPassword === password ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={confirmPassword === password ? colors.success : colors.error} 
            />
            <Text style={{ 
              color: confirmPassword === password ? colors.success : colors.error,
              fontSize: 12,
              marginLeft: isRTL ? 0 : 6,
              marginRight: isRTL ? 6 : 0
            }}>
              {confirmPassword === password ? t('auth.passwordsMatch') : t('auth.passwordsNotMatch')}
            </Text>
          </View>
        )}
      </View>

      {/* Terms */}
      <Text style={[styles.termsText, { color: colors.textTertiary }]}>
        {t('auth.termsText')}{' '}
        <Text style={{ color: colors.accent }}>{t('auth.termsOfService')}</Text>
        {' '}{t('auth.and')}{' '}
        <Text style={{ color: colors.accent }}>{t('auth.privacyPolicy')}</Text>
      </Text>

      {/* Buttons */}
      <View style={[styles.buttonRow, { flexDirection }]}>
        <TouchableOpacity
          style={[styles.backStepButton, { backgroundColor: colors.surfacePressed }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color={colors.text} />
          <Text style={[styles.backStepButtonText, { color: colors.text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, { shadowColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.registerButtonGradient}
          >
            {loading ? (
              <View style={[styles.buttonContent, { flexDirection }]}>
                <Ionicons name="reload" size={20} color={colors.textInverse} />
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.creatingAccount')}</Text>
              </View>
            ) : (
              <View style={[styles.buttonContent, { flexDirection }]}>
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.createAccount')}</Text>
                <Ionicons name="checkmark" size={20} color={colors.textInverse} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // renderStep3 is no longer used - favorites selection moved to separate screen
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {/* Favorites Title */}
      <Text style={[styles.favoritesTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
        {t('favorites.selectCompetitions')}
      </Text>
      <Text style={[styles.favoritesSubtitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {t('favorites.selectCompetitionsDesc')}
      </Text>

      {/* Competitions List */}
      {loadingCompetitions ? (
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
                  <Ionicons name="checkmark" size={12} color={colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Teams Section */}
      {selectedCompetitions.length > 0 && (
        <>
          <Text style={[styles.favoritesTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left', marginTop: 20 }]}>
            {t('favorites.selectTeams')}
          </Text>
          <Text style={[styles.favoritesSubtitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('favorites.selectTeamsDesc')}
          </Text>

          {loadingTeams ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
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
                      <Ionicons name="shield" size={24} color={colors.textInverse} />
                    </View>
                  )}
                  <Text style={[styles.selectionName, { color: colors.text }]} numberOfLines={2}>
                    {team.name}
                  </Text>
                  {selectedTeams.includes(team.id) && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color={colors.textInverse} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {/* Skip/Continue Buttons */}
      <View style={[styles.buttonRow, { flexDirection, marginTop: 20 }]}>
        <TouchableOpacity
          style={[styles.backStepButton, { backgroundColor: colors.surfacePressed }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color={colors.text} />
          <Text style={[styles.backStepButtonText, { color: colors.text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, { shadowColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.registerButtonGradient}
          >
            {loading ? (
              <View style={[styles.buttonContent, { flexDirection }]}>
                <Ionicons name="reload" size={20} color={colors.textInverse} />
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.creatingAccount')}</Text>
              </View>
            ) : (
              <View style={[styles.buttonContent, { flexDirection }]}>
                <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('auth.createAccount')}</Text>
                <Ionicons name="checkmark" size={20} color={colors.textInverse} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Full Screen Gradient Background */}
      <LinearGradient
        colors={colors.gradients.dark}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.navBackButton, { backgroundColor: colors.surfacePressed }, isRTL && styles.navBackButtonRTL]}
        onPress={() => router.back()}
      >
        <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={24} color={colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Logo */}
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={colors.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.logoGradient, { shadowColor: colors.accent }]}
              >
                <Ionicons name="person-add" size={28} color={colors.textInverse} />
              </LinearGradient>
            </View>

            <Text style={[styles.welcomeText, { color: colors.text }]}>{t('auth.createAccount')}</Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>{t('auth.joinToday')}</Text>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.accent, width: step === 1 ? '50%' : '100%' }
                  ]}
                />
              </View>
              <View style={[styles.stepsIndicator, { flexDirection }]}>
                <View style={styles.stepDot}>
                  <View style={[styles.stepDotInner, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{t('auth.personalInfo')}</Text>
                </View>
                <View style={styles.stepDot}>
                  <View style={[styles.stepDotInner, { backgroundColor: step >= 2 ? colors.accent : colors.border }]} />
                  <Text style={[styles.stepLabel, { color: step < 2 ? colors.textTertiary : colors.textSecondary }]}>
                    {t('auth.accountInfo')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Form Steps */}
          <View style={styles.formContainer}>
            {step === 1 ? renderStep1() : renderStep2()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  bgCircle3: {
    position: 'absolute',
    top: '50%',
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  navBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 24) + 60,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    marginBottom: 12,
  },
  logoGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepDot: {
    alignItems: 'center',
  },
  stepDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: '#6366F1',
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  stepLabelInactive: {
    color: 'rgba(255,255,255,0.4)',
  },
  formContainer: {
    marginBottom: 16,
  },
  stepContent: {},
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBackButtonRTL: {
    left: undefined,
    right: 20,
  },
  inputIconFocused: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    height: '100%',
  },
  selectText: {
    flex: 1,
    fontSize: 13,
  },
  eyeButton: {
    padding: 4,
  },
  cityPickerContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cityPicker: {
    maxHeight: 150,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cityOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  cityOptionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  cityOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 3,
  },
  strengthBar: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '600',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  termsText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  termsLink: {
    color: '#6366F1',
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backStepButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  registerButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  // Step 3 - Favorites styles
  favoritesTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  favoritesSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
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
  },
});
