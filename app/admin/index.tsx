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
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { matchApi, teamApi, competitionApi, adminApi, videoAdApi, refereeApi, supervisorApi } from '@/services/api';
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
  const [refereesList, setRefereesList] = useState<any[]>([]);
  const [supervisorsList, setSupervisorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Safe arrays for mapping
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeCompetitions = Array.isArray(competitions) ? competitions : [];
  const safeOperators = Array.isArray(operators) ? operators : [];
  const safeReferees = Array.isArray(refereesList) ? refereesList : [];
  const safeSupervisors = Array.isArray(supervisorsList) ? supervisorsList : [];

  // Form state
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [matchDate, setMatchDate] = useState(new Date());
  const [venue, setVenue] = useState('');
  const [referee, setReferee] = useState('');
  const [selectedRefereeId, setSelectedRefereeId] = useState('');
  const [selectedAssistant1Id, setSelectedAssistant1Id] = useState('');
  const [selectedAssistant2Id, setSelectedAssistant2Id] = useState('');
  const [selectedFourthId, setSelectedFourthId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Video Ad form state
  const [videoAdTitle, setVideoAdTitle] = useState('');
  const [videoAdClickUrl, setVideoAdClickUrl] = useState('');
  const [videoAdMandatorySeconds, setVideoAdMandatorySeconds] = useState(5);
  const [videoAdIsActive, setVideoAdIsActive] = useState(true);
  const [videoAdCreating, setVideoAdCreating] = useState(false);
  const [videoAdFile, setVideoAdFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [videoAdThumbnail, setVideoAdThumbnail] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Video Ads list state
  const [videoAds, setVideoAds] = useState<any[]>([]);
  const [videoAdsLoading, setVideoAdsLoading] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [showVideoAdForm, setShowVideoAdForm] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'match' | 'videoAds' | 'supervisors'>('match');

  // Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState<'home' | 'away' | null>(null);
  const [showCompetitionPicker, setShowCompetitionPicker] = useState(false);
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);
  const [showRefereePicker, setShowRefereePicker] = useState<'main' | 'assistant1' | 'assistant2' | 'fourth' | null>(null);

  // Supervisor form state
  const [supervisorForm, setSupervisorForm] = useState({ name: '', nationality: '', isActive: true });
  const [supervisorImage, setSupervisorImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [editingSupervisor, setEditingSupervisor] = useState<any>(null);
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);
  const [supervisorSaving, setSupervisorSaving] = useState(false);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ type: 'error' | 'warning' | 'confirm'; title: string; message: string; onConfirm?: () => void }>({
    type: 'error', title: '', message: '',
  });

  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      showError(t('admin.unauthorized'), t('admin.unauthorizedDesc'));
      return;
    }
    loadData();
    loadVideoAds();
  }, []);

  const loadVideoAds = async () => {
    try {
      setVideoAdsLoading(true);
      const res = await videoAdApi.adminGetAll();
      setVideoAds(res.data?.data || []);
    } catch (error) {
      console.error('Error loading video ads:', error);
    } finally {
      setVideoAdsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsRes, competitionsRes, operatorsRes, refereesRes, supervisorsRes] = await Promise.all([
        teamApi.getAll(),
        competitionApi.getAll(),
        adminApi.getOperators(),
        refereeApi.getAll(),
        supervisorApi.getAll(),
      ]);
      // API returns { success: true, data: [...] }
      // axios wraps it in response.data
      setTeams(teamsRes.data?.data || teamsRes.data || []);
      setCompetitions(competitionsRes.data?.data || competitionsRes.data || []);
      setOperators(operatorsRes.data?.data || operatorsRes.data || []);
      setRefereesList(refereesRes.data?.data || refereesRes.data || []);
      setSupervisorsList(supervisorsRes.data?.data || supervisorsRes.data || []);
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
        referee: selectedRefereeId ? safeReferees.find(r => r.id === selectedRefereeId)?.name : referee,
        refereeId: selectedRefereeId || undefined,
        assistantReferee1Id: selectedAssistant1Id || undefined,
        assistantReferee2Id: selectedAssistant2Id || undefined,
        fourthRefereeId: selectedFourthId || undefined,
        isFeatured,
        operatorId: selectedOperator || undefined,
      } as any);

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

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
      videoMaxDuration: 120,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoAdFile(result.assets[0]);
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      setVideoAdThumbnail(result.assets[0]);
    }
  };

  const handleCreateVideoAd = async () => {
    if (!videoAdTitle) {
      showError('خطأ', 'يجب إدخال عنوان الإعلان');
      return;
    }
    if (!videoAdFile) {
      showError('خطأ', 'يجب اختيار ملف فيديو');
      return;
    }

    try {
      setVideoAdCreating(true);
      const formData = new FormData();
      formData.append('title', videoAdTitle);
      formData.append('mandatorySeconds', String(videoAdMandatorySeconds));
      formData.append('isActive', String(videoAdIsActive));
      if (videoAdClickUrl) formData.append('clickUrl', videoAdClickUrl);

      // Append video file
      const videoUri = videoAdFile.uri;
      const videoName = videoUri.split('/').pop() || 'video.mp4';
      formData.append('video', {
        uri: videoUri,
        name: videoName,
        type: videoAdFile.mimeType || 'video/mp4',
      } as any);

      // Append thumbnail if selected
      if (videoAdThumbnail) {
        const thumbUri = videoAdThumbnail.uri;
        const thumbName = thumbUri.split('/').pop() || 'thumb.jpg';
        formData.append('thumbnail', {
          uri: thumbUri,
          name: thumbName,
          type: videoAdThumbnail.mimeType || 'image/jpeg',
        } as any);
      }

      if (editingAd) {
        await videoAdApi.adminUpdate(editingAd.id, formData);
      } else {
        await videoAdApi.adminCreate(formData);
      }
      
      // Reset form
      setVideoAdTitle('');
      setVideoAdClickUrl('');
      setVideoAdMandatorySeconds(5);
      setVideoAdIsActive(true);
      setVideoAdFile(null);
      setVideoAdThumbnail(null);
      setEditingAd(null);
      setShowVideoAdForm(false);
      loadVideoAds();
      
      showError('نجاح', editingAd ? 'تم تحديث الإعلان بنجاح' : 'تم إنشاء الإعلان بنجاح');
    } catch (error) {
      console.error('Error creating video ad:', error);
      showError('خطأ', 'فشل إنشاء الإعلان');
    } finally {
      setVideoAdCreating(false);
    }
  };

  const handleEditAd = (ad: any) => {
    setEditingAd(ad);
    setVideoAdTitle(ad.title || '');
    setVideoAdClickUrl(ad.clickUrl || '');
    setVideoAdMandatorySeconds(ad.mandatorySeconds || 5);
    setVideoAdIsActive(ad.isActive !== false);
    setVideoAdFile(null);
    setVideoAdThumbnail(null);
    setShowVideoAdForm(true);
  };

  const handleDeleteAd = (ad: any) => {
    setDialogConfig({
      type: 'confirm',
      title: 'حذف الإعلان',
      message: `هل تريد حذف الإعلان "${ad.title}"؟`,
      onConfirm: async () => {
        try {
          await videoAdApi.adminDelete(ad.id);
          loadVideoAds();
          showError('نجاح', 'تم حذف الإعلان');
        } catch {
          showError('خطأ', 'فشل حذف الإعلان');
        }
      },
    });
    setDialogVisible(true);
  };

  const handleToggleAd = async (ad: any) => {
    try {
      const fd = new FormData();
      fd.append('isActive', String(!ad.isActive));
      await videoAdApi.adminUpdate(ad.id, fd);
      loadVideoAds();
    } catch {
      showError('خطأ', 'فشل تحديث الإعلان');
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
    setSelectedRefereeId('');
    setSelectedAssistant1Id('');
    setSelectedAssistant2Id('');
    setSelectedFourthId('');
    setIsFeatured(false);
  };

  const getTeamById = (id: string) => safeTeams.find(t => t.id === id);
  const getCompetitionById = (id: string) => safeCompetitions.find(c => c.id === id);
  const getOperatorById = (id: string) => safeOperators.find(o => o.id === id);
  const getRefereeById = (id: string) => safeReferees.find(r => r.id === id);
  const getSupervisorById = (id: string) => safeSupervisors.find(s => s.id === id);

  // Supervisor functions
  const pickSupervisorImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setSupervisorImage(result.assets[0]);
    }
  };

  const handleSaveSupervisor = async () => {
    if (!supervisorForm.name.trim()) {
      showError('خطأ', 'يرجى إدخال اسم المشرف');
      return;
    }
    setSupervisorSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', supervisorForm.name);
      formData.append('nationality', supervisorForm.nationality);
      formData.append('isActive', String(supervisorForm.isActive));
      if (supervisorImage) {
        formData.append('image', {
          uri: supervisorImage.uri,
          name: supervisorImage.uri.split('/').pop() || 'supervisor.jpg',
          type: supervisorImage.mimeType || 'image/jpeg',
        } as any);
      }

      if (editingSupervisor) {
        await supervisorApi.update(editingSupervisor.id, formData);
        showError('نجاح', 'تم تحديث المشرف');
      } else {
        await supervisorApi.create(formData);
        showError('نجاح', 'تم إضافة المشرف');
      }
      
      // Reset form
      setSupervisorForm({ name: '', nationality: '', isActive: true });
      setSupervisorImage(null);
      setEditingSupervisor(null);
      setShowSupervisorForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving supervisor:', error);
      showError('خطأ', 'فشل حفظ المشرف');
    } finally {
      setSupervisorSaving(false);
    }
  };

  const handleEditSupervisor = (supervisor: any) => {
    setEditingSupervisor(supervisor);
    setSupervisorForm({
      name: supervisor.name || '',
      nationality: supervisor.nationality || '',
      isActive: supervisor.isActive !== false,
    });
    setSupervisorImage(null);
    setShowSupervisorForm(true);
  };

  const handleDeleteSupervisor = (supervisor: any) => {
    setDialogConfig({
      type: 'confirm',
      title: 'حذف المشرف',
      message: `هل تريد حذف المشرف "${supervisor.name}"؟`,
      onConfirm: async () => {
        try {
          await supervisorApi.delete(supervisor.id);
          loadData();
          showError('نجاح', 'تم حذف المشرف');
        } catch {
          showError('خطأ', 'فشل حذف المشرف');
        }
      },
    });
    setDialogVisible(true);
  };

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
      {/* ── Top Tab Navigation ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'match' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('match')}
          activeOpacity={0.7}
        >
          <Ionicons name="football-outline" size={18} color={activeTab === 'match' ? colors.accent : colors.textTertiary} />
          <Text style={[styles.tabText, { color: activeTab === 'match' ? colors.accent : colors.textTertiary }]}>إنشاء مباراة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'videoAds' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('videoAds')}
          activeOpacity={0.7}
        >
          <Ionicons name="videocam-outline" size={18} color={activeTab === 'videoAds' ? colors.accent : colors.textTertiary} />
          <Text style={[styles.tabText, { color: activeTab === 'videoAds' ? colors.accent : colors.textTertiary }]}>إعلانات الفيديو</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'supervisors' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('supervisors')}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={18} color={activeTab === 'supervisors' ? colors.accent : colors.textTertiary} />
          <Text style={[styles.tabText, { color: activeTab === 'supervisors' ? colors.accent : colors.textTertiary }]}>المشرفون</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'match' && (
        <>
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
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
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
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
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

          {/* Venue */}
          <View style={styles.field}>
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

          {/* Referees Selection */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الحكام</Text>
            <View style={styles.fieldRow}>
              <TouchableOpacity
                style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]}
                onPress={() => setShowRefereePicker('main')}
              >
                <View style={styles.selectorInner}>
                  <Ionicons name="flag" size={16} color={selectedRefereeId ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.selectorText, { color: selectedRefereeId ? colors.text : colors.textTertiary, fontSize: 12 }]} numberOfLines={1}>
                    {selectedRefereeId ? getRefereeById(selectedRefereeId)?.name : 'الحكم الرئيسي'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]}
                onPress={() => setShowRefereePicker('assistant1')}
              >
                <View style={styles.selectorInner}>
                  <Ionicons name="flag-outline" size={16} color={selectedAssistant1Id ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.selectorText, { color: selectedAssistant1Id ? colors.text : colors.textTertiary, fontSize: 12 }]} numberOfLines={1}>
                    {selectedAssistant1Id ? getRefereeById(selectedAssistant1Id)?.name : 'مساعد أول'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={[styles.fieldRow, { marginTop: SPACING.xs }]}>
              <TouchableOpacity
                style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]}
                onPress={() => setShowRefereePicker('assistant2')}
              >
                <View style={styles.selectorInner}>
                  <Ionicons name="flag-outline" size={16} color={selectedAssistant2Id ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.selectorText, { color: selectedAssistant2Id ? colors.text : colors.textTertiary, fontSize: 12 }]} numberOfLines={1}>
                    {selectedAssistant2Id ? getRefereeById(selectedAssistant2Id)?.name : 'مساعد ثاني'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border, flex: 1 }]}
                onPress={() => setShowRefereePicker('fourth')}
              >
                <View style={styles.selectorInner}>
                  <Ionicons name="person-outline" size={16} color={selectedFourthId ? colors.accent : colors.textTertiary} />
                  <Text style={[styles.selectorText, { color: selectedFourthId ? colors.text : colors.textTertiary, fontSize: 12 }]} numberOfLines={1}>
                    {selectedFourthId ? getRefereeById(selectedFourthId)?.name : 'الحكم الرابع'}
                  </Text>
                </View>
              </TouchableOpacity>
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
        </>
        )}

        {activeTab === 'videoAds' && (
        <>
        {/* ── Video Ads Management ── */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.formCardHeader, { borderBottomColor: colors.divider }]}>
            <Ionicons name="videocam" size={22} color={colors.accent} />
            <Text style={[styles.formCardTitle, { color: colors.text, flex: 1 }]}>إعلانات الفيديو</Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md }}
              onPress={() => {
                setEditingAd(null);
                setVideoAdTitle('');
                setVideoAdClickUrl('');
                setVideoAdMandatorySeconds(5);
                setVideoAdIsActive(true);
                setVideoAdFile(null);
                setVideoAdThumbnail(null);
                setShowVideoAdForm(!showVideoAdForm);
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {showVideoAdForm ? 'إلغاء' : '+ إضافة'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Existing Ads List */}
          {videoAdsLoading ? (
            <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : videoAds.length > 0 ? (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
              {videoAds.map((ad: any) => (
                <View
                  key={ad.id}
                  style={[
                    styles.adItem,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.adTitle, { color: colors.text }]}>{ad.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 11, color: colors.textTertiary }}>
                        ⏱ {ad.mandatorySeconds}ث
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary }}>
                        👁 {ad.views || 0}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleToggleAd(ad)}>
                      <View style={[
                        styles.adStatusBadge,
                        { backgroundColor: ad.isActive ? '#22C55E20' : colors.border + '40' },
                      ]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: ad.isActive ? '#22C55E' : colors.textTertiary }}>
                          {ad.isActive ? 'نشط' : 'متوقف'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditAd(ad)} style={styles.adActionBtn}>
                      <Ionicons name="create-outline" size={16} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAd(ad)} style={styles.adActionBtn}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>لا توجد إعلانات فيديو</Text>
            </View>
          )}

          {/* Create/Edit Form (collapsible) */}
          {showVideoAdForm && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.divider, marginTop: SPACING.sm }}>

          {/* Title */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>عنوان الإعلان *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={videoAdTitle}
              onChangeText={setVideoAdTitle}
              placeholder="أدخل عنوان الإعلان"
              placeholderTextColor={colors.textTertiary}
              textAlign="right"
            />
          </View>

          {/* Video Picker */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ملف الفيديو *</Text>
            <TouchableOpacity
              style={[styles.filePicker, { backgroundColor: colors.background, borderColor: videoAdFile ? colors.success : colors.border }]}
              onPress={pickVideo}
              activeOpacity={0.7}
            >
              <Ionicons name={videoAdFile ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color={videoAdFile ? colors.success : colors.textTertiary} />
              <Text style={[styles.filePickerText, { color: videoAdFile ? colors.text : colors.textTertiary }]}>
                {videoAdFile ? `✓ تم اختيار الفيديو (${Math.round((videoAdFile.fileSize || 0) / 1024 / 1024)}MB)` : 'اضغط لاختيار فيديو'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Thumbnail Picker */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>صورة مصغرة (اختياري)</Text>
            <TouchableOpacity
              style={[styles.filePicker, { backgroundColor: colors.background, borderColor: videoAdThumbnail ? colors.success : colors.border }]}
              onPress={pickThumbnail}
              activeOpacity={0.7}
            >
              {videoAdThumbnail ? (
                <Image source={{ uri: videoAdThumbnail.uri }} style={styles.thumbPreview} />
              ) : (
                <Ionicons name="image-outline" size={24} color={colors.textTertiary} />
              )}
              <Text style={[styles.filePickerText, { color: videoAdThumbnail ? colors.text : colors.textTertiary }]}>
                {videoAdThumbnail ? '✓ تم اختيار الصورة' : 'اضغط لاختيار صورة'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Click URL */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>رابط عند النقر (اختياري)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
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
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
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
                  <Text style={styles.submitText}>{editingAd ? 'تحديث الإعلان' : 'إنشاء الإعلان'}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          </View>
          )}
        </View>
        </>
        )}

        {activeTab === 'supervisors' && (
        <>
        {/* ── Supervisors Management ── */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.formCardHeader, { borderBottomColor: colors.divider }]}>
            <Ionicons name="eye" size={22} color={colors.accent} />
            <Text style={[styles.formCardTitle, { color: colors.text, flex: 1 }]}>المشرفون</Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md }}
              onPress={() => {
                setEditingSupervisor(null);
                setSupervisorForm({ name: '', nationality: '', isActive: true });
                setSupervisorImage(null);
                setShowSupervisorForm(!showSupervisorForm);
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {showSupervisorForm ? 'إلغاء' : '+ إضافة'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Create/Edit Form */}
          {showSupervisorForm && (
            <View style={{ padding: SPACING.md, borderTopWidth: 1, borderTopColor: colors.divider }}>
              {/* Image Upload */}
              <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
                <TouchableOpacity onPress={pickSupervisorImage}>
                  {supervisorImage ? (
                    <Image source={{ uri: supervisorImage.uri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                  ) : (
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="camera" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: SPACING.xs }}>اضغط لإضافة صورة</Text>
              </View>

              {/* Name */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الاسم *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={supervisorForm.name}
                  onChangeText={(text) => setSupervisorForm({ ...supervisorForm, name: text })}
                  placeholder="اسم المشرف"
                  placeholderTextColor={colors.textTertiary}
                  textAlign="right"
                />
              </View>

              {/* Nationality */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الجنسية</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={supervisorForm.nationality}
                  onChangeText={(text) => setSupervisorForm({ ...supervisorForm, nationality: text })}
                  placeholder="مثلاً: عراقي"
                  placeholderTextColor={colors.textTertiary}
                  textAlign="right"
                />
              </View>

              {/* Active Status */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
                <TouchableOpacity
                  style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: supervisorForm.isActive ? colors.accent : colors.border, justifyContent: supervisorForm.isActive ? 'flex-end' : 'flex-start', padding: 2 }}
                  onPress={() => setSupervisorForm({ ...supervisorForm, isActive: !supervisorForm.isActive })}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 13, color: colors.text }}>نشط</Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={{ backgroundColor: colors.accent, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' }}
                onPress={handleSaveSupervisor}
                disabled={supervisorSaving}
              >
                {supervisorSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                    {editingSupervisor ? 'تحديث' : 'إضافة'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Supervisors List */}
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            {safeSupervisors.length > 0 ? (
              safeSupervisors.map((supervisor: any) => (
                <View
                  key={supervisor.id}
                  style={[
                    styles.adItem,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 }}>
                    {supervisor.imageUrl ? (
                      <Image source={{ uri: supervisor.imageUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="person" size={20} color={colors.accent} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.adTitle, { color: colors.text }]}>{supervisor.name}</Text>
                      {supervisor.nationality && (
                        <Text style={{ fontSize: 11, color: colors.textTertiary }}>{supervisor.nationality}</Text>
                      )}
                    </View>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: supervisor.isActive ? '#22C55E20' : colors.border + '40'
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: supervisor.isActive ? '#22C55E' : colors.textTertiary }}>
                        {supervisor.isActive ? 'نشط' : 'متوقف'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleEditSupervisor(supervisor)} style={styles.adActionBtn}>
                      <Ionicons name="create-outline" size={16} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSupervisor(supervisor)} style={styles.adActionBtn}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
                <Text style={{ color: colors.textTertiary, fontSize: 13 }}>لا يوجد مشرفين</Text>
              </View>
            )}
          </View>
        </View>
        </>
        )}

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

      {/* Referee Picker Modal */}
      <AppModal
        visible={showRefereePicker !== null}
        onClose={() => setShowRefereePicker(null)}
        title={
          showRefereePicker === 'main' ? 'اختر الحكم الرئيسي' :
          showRefereePicker === 'assistant1' ? 'اختر المساعد الأول' :
          showRefereePicker === 'assistant2' ? 'اختر المساعد الثاني' :
          'اختر الحكم الرابع'
        }
        icon="flag"
        maxHeight="70%"
      >
        <ScrollView style={styles.modalList}>
          {/* Option to clear selection */}
          <TouchableOpacity
            style={[
              styles.modalItem,
              { borderBottomColor: colors.border },
              !(showRefereePicker === 'main' ? selectedRefereeId :
                showRefereePicker === 'assistant1' ? selectedAssistant1Id :
                showRefereePicker === 'assistant2' ? selectedAssistant2Id :
                selectedFourthId) && { backgroundColor: colors.accent + '20' }
            ]}
            onPress={() => {
              if (showRefereePicker === 'main') setSelectedRefereeId('');
              else if (showRefereePicker === 'assistant1') setSelectedAssistant1Id('');
              else if (showRefereePicker === 'assistant2') setSelectedAssistant2Id('');
              else if (showRefereePicker === 'fourth') setSelectedFourthId('');
              setShowRefereePicker(null);
            }}
          >
            <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.modalItemText, { color: colors.textSecondary }]}>بدون حكم</Text>
          </TouchableOpacity>
          {safeReferees.map((ref) => {
            const currentId = showRefereePicker === 'main' ? selectedRefereeId :
              showRefereePicker === 'assistant1' ? selectedAssistant1Id :
              showRefereePicker === 'assistant2' ? selectedAssistant2Id :
              selectedFourthId;
            return (
              <TouchableOpacity
                key={ref.id}
                style={[
                  styles.modalItem,
                  { borderBottomColor: colors.border },
                  currentId === ref.id && { backgroundColor: colors.accent + '20' }
                ]}
                onPress={() => {
                  if (showRefereePicker === 'main') setSelectedRefereeId(ref.id);
                  else if (showRefereePicker === 'assistant1') setSelectedAssistant1Id(ref.id);
                  else if (showRefereePicker === 'assistant2') setSelectedAssistant2Id(ref.id);
                  else if (showRefereePicker === 'fourth') setSelectedFourthId(ref.id);
                  setShowRefereePicker(null);
                }}
              >
                {ref.imageUrl ? (
                  <Image source={{ uri: ref.imageUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '20', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={18} color={colors.accent} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{ref.name}</Text>
                  {ref.nationality && (
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{ref.nationality}</Text>
                  )}
                </View>
                {currentId === ref.id && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                )}
              </TouchableOpacity>
            );
          })}
          {safeReferees.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا يوجد حكام{'\n'}قم بإضافة حكام من صفحة الحكام
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
        confirmText={dialogConfig.onConfirm ? 'تأكيد' : t('admin.ok')}
        showCancel={!!dialogConfig.onConfirm}
        cancelText="إلغاء"
        onCancel={() => setDialogVisible(false)}
        onConfirm={() => {
          setDialogVisible(false);
          if (dialogConfig.onConfirm) dialogConfig.onConfirm();
        }}
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
  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingTop: SPACING.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
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
    fontFamily: FONTS.extraBold,
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
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginHorizontal: SPACING.lg,
  },
  filePickerText: {
    ...TYPOGRAPHY.bodySmall,
    flex: 1,
    fontWeight: '500',
  },
  thumbPreview: {
    width: 48,
    height: 28,
    borderRadius: RADIUS.sm,
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
  adItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  adTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
  },
  adStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adActionBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
  },
});
