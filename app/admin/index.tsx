import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { matchApi, teamApi, competitionApi, adminApi, videoAdApi } from '@/services/api';
import TeamLogo from '@/components/ui/TeamLogo';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';

interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}

interface Competition {
  id: string;
  name: string;
  shortName?: string;
}

interface Operator {
  id: string;
  name: string;
  email: string;
}

export default function AdminScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { user, isAuthenticated } = useAuthStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Safe arrays for mapping
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeCompetitions = Array.isArray(competitions) ? competitions : [];
  const safeOperators = Array.isArray(operators) ? operators : [];

  // Form state
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [matchDate, setMatchDate] = useState(new Date());
  const [venue, setVenue] = useState('');
  const [referee, setReferee] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Video Ad form state
  const [videoAdTitle, setVideoAdTitle] = useState('');
  const [videoAdClickUrl, setVideoAdClickUrl] = useState('');
  const [videoAdMandatorySeconds, setVideoAdMandatorySeconds] = useState(5);
  const [videoAdIsActive, setVideoAdIsActive] = useState(true);
  const [videoAdCreating, setVideoAdCreating] = useState(false);
  const [videoFile, setVideoFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

  // Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState<'home' | 'away' | null>(null);
  const [showCompetitionPicker, setShowCompetitionPicker] = useState(false);
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ type: 'error' | 'warning' | 'confirm'; title: string; message: string; onConfirm?: () => void }>({
    type: 'error', title: '', message: '',
  });

  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/webm', 'video/quicktime'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoFile(result);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      showError('خطأ', 'فشل اختيار الفيديو');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      showError('غير مصرح', 'يجب تسجيل الدخول أولاً');
      setTimeout(() => router.back(), 1500);
      return;
    }
    
    if (user?.role !== 'admin') {
      showError('غير مصرح', 'هذه الصفحة للمدراء فقط');
      setTimeout(() => router.back(), 1500);
      return;
    }
    
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsRes, competitionsRes, operatorsRes] = await Promise.all([
        teamApi.getAll(),
        competitionApi.getAll(),
        adminApi.getOperators(),
      ]);
      // API returns { success: true, data: [...] }
      // axios wraps it in response.data
      setTeams(teamsRes.data?.data || teamsRes.data || []);
      setCompetitions(competitionsRes.data?.data || competitionsRes.data || []);
      setOperators(operatorsRes.data?.data || operatorsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showError(t('admin.error'), t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedCompetition || !homeTeamId || !awayTeamId) {
      showError(t('admin.error'), t('admin.fillRequired'));
      return;
    }

    if (homeTeamId === awayTeamId) {
      showError(t('admin.error'), t('admin.sameTeams'));
      return;
    }

    try {
      setCreating(true);
      const response = await matchApi.create({
        competitionId: selectedCompetition,
        homeTeamId,
        awayTeamId,
        startTime: matchDate.toISOString(),
        venue,
        referee,
        isFeatured,
        operatorId: selectedOperator || undefined,
      });

      // If operator selected, assign them to the match
      if (selectedOperator && response.data?.data?.id) {
        try {
          await matchApi.assignOperator(response.data.data.id, selectedOperator);
        } catch (assignError) {
          
        }
      }

      resetForm();
    } catch (error) {
      console.error('Error creating match:', error);
      showError(t('admin.error'), t('admin.createMatchFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateVideoAd = async () => {
    if (!videoAdTitle) {
      showError('خطأ', 'يجب إدخال عنوان الإعلان');
      return;
    }

    if (!videoFile || videoFile.canceled || !videoFile.assets || videoFile.assets.length === 0) {
      showError('خطأ', 'يجب اختيار ملف الفيديو');
      return;
    }

    try {
      setVideoAdCreating(true);
      const formData = new FormData();
      formData.append('title', videoAdTitle);
      formData.append('mandatorySeconds', String(videoAdMandatorySeconds));
      formData.append('isActive', String(videoAdIsActive));
      if (videoAdClickUrl) formData.append('clickUrl', videoAdClickUrl);
      
      // Add video file
      const videoAsset = videoFile.assets[0];
      formData.append('video', {
        uri: videoAsset.uri,
        type: videoAsset.mimeType || 'video/mp4',
        name: videoAsset.name,
      } as any);

      await videoAdApi.adminCreate(formData);
      
      // Reset form
      setVideoAdTitle('');
      setVideoAdClickUrl('');
      setVideoAdMandatorySeconds(5);
      setVideoAdIsActive(true);
      setVideoFile(null);
      
      showError('نجاح', 'تم إنشاء الإعلان بنجاح');
    } catch (error) {
      console.error('Error creating video ad:', error);
      showError('خطأ', 'فشل إنشاء الإعلان');
    } finally {
      setVideoAdCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedCompetition('');
    setHomeTeamId('');
    setAwayTeamId('');
    setSelectedOperator('');
    setMatchDate(new Date());
    setVenue('');
    setReferee('');
    setIsFeatured(false);
  };

  const getTeamById = (id: string) => safeTeams.find(t => t.id === id);
  const getCompetitionById = (id: string) => safeCompetitions.find(c => c.id === id);
  const getOperatorById = (id: string) => safeOperators.find(o => o.id === id);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Dashboard Summary Cards ── */}
        <View style={styles.dashCards}>
          <View style={[styles.dashCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.dashIconWrap, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="people" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.dashValue, { color: colors.text }]}>{safeTeams.length}</Text>
            <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>فريق</Text>
          </View>
          <View style={[styles.dashCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.dashIconWrap, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="trophy" size={20} color={colors.success} />
            </View>
            <Text style={[styles.dashValue, { color: colors.text }]}>{safeCompetitions.length}</Text>
            <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>بطولة</Text>
          </View>
          <View style={[styles.dashCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.dashIconWrap, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="person" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.dashValue, { color: colors.text }]}>{safeOperators.length}</Text>
            <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>مشغل</Text>
          </View>
        </View>

        {/* ── Create Match Card ── */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.formCardHeader, { borderBottomColor: colors.divider }]}>
            <Ionicons name="add-circle" size={22} color={colors.accent} />
            <Text style={[styles.formCardTitle, { color: colors.text }]}>إنشاء مباراة جديدة</Text>
          </View>

          {/* Competition */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>البطولة *</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowCompetitionPicker(true)}
            >
              <View style={styles.selectorInner}>
                <Ionicons name="trophy-outline" size={18} color={selectedCompetition ? colors.accent : colors.textTertiary} />
                <Text style={[styles.selectorText, { color: selectedCompetition ? colors.text : colors.textTertiary }]}>
                  {selectedCompetition ? getCompetitionById(selectedCompetition)?.name : 'اختر البطولة'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Teams */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الفريقان *</Text>
            <View style={styles.teamsRow}>
              <TouchableOpacity
                style={[styles.teamSelector, { backgroundColor: colors.background, borderColor: homeTeamId ? colors.accent : colors.border }]}
                onPress={() => setShowTeamPicker('home')}
              >
                {homeTeamId ? (
                  <View style={styles.selectedTeam}>
                    <TeamLogo team={getTeamById(homeTeamId)!} size="medium" />
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                      {getTeamById(homeTeamId)?.shortName}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyTeam}>
                    <Ionicons name="shield-outline" size={28} color={colors.textTertiary} />
                    <Text style={[styles.emptyTeamText, { color: colors.textTertiary }]}>المضيف</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={[styles.vsBadge, { backgroundColor: colors.accent + '15' }]}>
                <Text style={[styles.vsText, { color: colors.accent }]}>{t('match.vs')}</Text>
              </View>

              <TouchableOpacity
                style={[styles.teamSelector, { backgroundColor: colors.background, borderColor: awayTeamId ? colors.accent : colors.border }]}
                onPress={() => setShowTeamPicker('away')}
              >
                {awayTeamId ? (
                  <View style={styles.selectedTeam}>
                    <TeamLogo team={getTeamById(awayTeamId)!} size="medium" />
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                      {getTeamById(awayTeamId)?.shortName}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyTeam}>
                    <Ionicons name="shield-outline" size={28} color={colors.textTertiary} />
                    <Text style={[styles.emptyTeamText, { color: colors.textTertiary }]}>الضيف</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>التاريخ والوقت *</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(matchDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={18} color={colors.accent} />
                <Text style={[styles.dateText, { color: colors.text }]}>{formatTime(matchDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Venue & Referee Row */}
          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الملعب</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="ملعب الشعب"
                placeholderTextColor={colors.textTertiary}
                value={venue}
                onChangeText={setVenue}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الحكم</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="اسم الحكم"
                placeholderTextColor={colors.textTertiary}
                value={referee}
                onChangeText={setReferee}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
          </View>

          {/* Operator */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المشغل (اختياري)</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowOperatorPicker(true)}
            >
              <View style={styles.selectorInner}>
                <Ionicons name="person-circle-outline" size={18} color={selectedOperator ? colors.accent : colors.textTertiary} />
                <Text style={[styles.selectorText, { color: selectedOperator ? colors.text : colors.textTertiary }]}>
                  {selectedOperator ? getOperatorById(selectedOperator)?.name : 'اختر مشغل'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Featured Toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, { backgroundColor: colors.background, borderColor: isFeatured ? colors.accent : colors.border }]}
            onPress={() => setIsFeatured(!isFeatured)}
            activeOpacity={0.7}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name="star" size={20} color={isFeatured ? '#F59E0B' : colors.textTertiary} />
              <Text style={[styles.toggleTitle, { color: colors.text }]}>مباراة مميزة</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: isFeatured ? colors.accent : colors.border }]}>
              <View style={[styles.toggleDot, isFeatured && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, creating && { opacity: 0.6 }]}
            onPress={handleCreateMatch}
            disabled={creating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="football-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>إنشاء المباراة</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Create Video Ad Card ── */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.formCardHeader, { borderBottomColor: colors.divider }]}>
            <Ionicons name="videocam" size={22} color={colors.accent} />
            <Text style={[styles.formCardTitle, { color: colors.text }]}>إنشاء إعلان فيديو</Text>
          </View>

          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>عنوان الإعلان *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={videoAdTitle}
              onChangeText={setVideoAdTitle}
              placeholder="أدخل عنوان الإعلان"
              placeholderTextColor={colors.textTertiary}
              textAlign="right"
            />
          </View>

          {/* Video File */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ملف الفيديو *</Text>
            <TouchableOpacity
              style={[styles.filePicker, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={pickVideo}
              activeOpacity={0.7}
            >
              <View style={styles.filePickerInner}>
                <Ionicons name="videocam" size={20} color={videoFile?.assets ? colors.accent : colors.textTertiary} />
                <Text style={[styles.filePickerText, { color: videoFile?.assets ? colors.text : colors.textTertiary }]}>
                  {videoFile?.assets && !videoFile.canceled ? videoFile.assets[0].name : 'اختر ملف الفيديو'}
                </Text>
              </View>
              <Ionicons name="folder-open" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Click URL */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>رابط عند النقر (اختياري)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={videoAdClickUrl}
              onChangeText={setVideoAdClickUrl}
              placeholder="https://example.com"
              placeholderTextColor={colors.textTertiary}
              textAlign="right"
              keyboardType="url"
            />
          </View>

          {/* Mandatory Seconds */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الوقت الإجباري (ثانية)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={String(videoAdMandatorySeconds)}
              onChangeText={(text) => setVideoAdMandatorySeconds(Number(text) || 5)}
              placeholder="5"
              placeholderTextColor={colors.textTertiary}
              textAlign="right"
              keyboardType="numeric"
            />
          </View>

          {/* Active Toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, { backgroundColor: colors.background, borderColor: videoAdIsActive ? colors.accent : colors.border }]}
            onPress={() => setVideoAdIsActive(!videoAdIsActive)}
            activeOpacity={0.7}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name="checkmark-circle" size={20} color={videoAdIsActive ? colors.success : colors.textTertiary} />
              <Text style={[styles.toggleTitle, { color: colors.text }]}>تفعيل الإعلان</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: videoAdIsActive ? colors.accent : colors.border }]}>
              <View style={[styles.toggleDot, videoAdIsActive && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          
          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, videoAdCreating && { opacity: 0.6 }]}
            onPress={handleCreateVideoAd}
            disabled={videoAdCreating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradients.success}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {videoAdCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="videocam-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>إنشاء الإعلان</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={matchDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              const newDate = new Date(matchDate);
              newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
              setMatchDate(newDate);
            }
          }}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={matchDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (date) {
              const newDate = new Date(matchDate);
              newDate.setHours(date.getHours(), date.getMinutes());
              setMatchDate(newDate);
            }
          }}
        />
      )}

      {/* Team Picker Modal */}
      <AppModal
        visible={showTeamPicker !== null}
        onClose={() => setShowTeamPicker(null)}
        title={showTeamPicker === 'home' ? 'اختر الفريق المضيف' : 'اختر الفريق الضيف'}
        icon="shield"
        maxHeight="70%"
      >
        <ScrollView style={styles.modalList}>
          {safeTeams.map((team) => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.modalItem,
                { borderBottomColor: colors.border },
                (showTeamPicker === 'home' ? homeTeamId : awayTeamId) === team.id && 
                  { backgroundColor: colors.accent + '20' }
              ]}
              onPress={() => {
                if (showTeamPicker === 'home') {
                  setHomeTeamId(team.id);
                } else {
                  setAwayTeamId(team.id);
                }
                setShowTeamPicker(null);
              }}
            >
              <TeamLogo team={team} size="small" />
              <Text style={[styles.modalItemText, { color: colors.text }]}>{team.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AppModal>

      {/* Competition Picker Modal */}
      <AppModal
        visible={showCompetitionPicker}
        onClose={() => setShowCompetitionPicker(false)}
        title="اختر البطولة"
        icon="trophy"
        maxHeight="70%"
      >
        <ScrollView style={styles.modalList}>
          {safeCompetitions.map((comp) => (
            <TouchableOpacity
              key={comp.id}
              style={[
                styles.modalItem,
                { borderBottomColor: colors.border },
                selectedCompetition === comp.id && { backgroundColor: colors.accent + '20' }
              ]}
              onPress={() => {
                setSelectedCompetition(comp.id);
                setShowCompetitionPicker(false);
              }}
            >
              <Ionicons name="trophy" size={24} color={colors.accent} />
              <Text style={[styles.modalItemText, { color: colors.text }]}>{comp.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AppModal>

      {/* Operator Picker Modal */}
      <AppModal
        visible={showOperatorPicker}
        onClose={() => setShowOperatorPicker(false)}
        title="اختر المشغل"
        icon="person-circle"
        maxHeight="70%"
      >
        <ScrollView style={styles.modalList}>
          {/* Option to not assign operator */}
          <TouchableOpacity
            style={[
              styles.modalItem,
              { borderBottomColor: colors.border },
              !selectedOperator && { backgroundColor: colors.accent + '20' }
            ]}
            onPress={() => {
              setSelectedOperator('');
              setShowOperatorPicker(false);
            }}
          >
            <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.modalItemText, { color: colors.textSecondary }]}>بدون مشغل</Text>
          </TouchableOpacity>
          {safeOperators.map((op) => (
            <TouchableOpacity
              key={op.id}
              style={[
                styles.modalItem,
                { borderBottomColor: colors.border },
                selectedOperator === op.id && { backgroundColor: colors.accent + '20' }
              ]}
              onPress={() => {
                setSelectedOperator(op.id);
                setShowOperatorPicker(false);
              }}
            >
              <Ionicons name="person-circle" size={24} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalItemText, { color: colors.text }]}>{op.name}</Text>
                <Text style={[{ fontSize: 12, color: colors.textSecondary }]}>{op.email}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {safeOperators.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا يوجد مشغلين{'\n'}قم بترقية مستخدم إلى مشغل من صفحة المستخدمين
              </Text>
            </View>
          )}
        </ScrollView>
      </AppModal>

      {/* Error/Info Dialog */}
      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={t('admin.ok')}
        showCancel={false}
        onConfirm={() => setDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  // ── Dashboard Cards ──
  dashCards: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  dashCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  dashIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dashValue: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '800',
  },
  dashLabel: {
    ...TYPOGRAPHY.labelSmall,
  },
  // ── Form Card ──
  formCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  formCardTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  // ── Fields ──
  field: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  selectorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  selectorText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  teamSelector: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTeam: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  teamName: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  emptyTeam: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emptyTeamText: {
    ...TYPOGRAPHY.labelSmall,
  },
  vsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  dateText: {
    ...TYPOGRAPHY.bodySmall,
  },
  input: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...TYPOGRAPHY.bodySmall,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  toggleTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  filePickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  filePickerText: {
    ...TYPOGRAPHY.bodyMedium,
    flex: 1,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  noteText: {
    ...TYPOGRAPHY.bodySmall,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
  },
  submitText: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#fff',
    fontWeight: '700',
  },
  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  modalList: {
    padding: SPACING.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  modalItemText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
  },
});
