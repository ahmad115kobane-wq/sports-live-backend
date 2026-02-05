import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { matchApi, teamApi, competitionApi, adminApi } from '@/services/api';
import TeamLogo from '@/components/ui/TeamLogo';

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
  const colors = Colors[colorScheme ?? 'dark'];
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

  // Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState<'home' | 'away' | null>(null);
  const [showCompetitionPicker, setShowCompetitionPicker] = useState(false);
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      Alert.alert('غير مصرح', 'يجب أن تكون مديراً للوصول إلى هذه الصفحة', [
        { text: 'حسناً', onPress: () => router.back() }
      ]);
      return;
    }
    loadData();
  }, []);

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
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedCompetition || !homeTeamId || !awayTeamId) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (homeTeamId === awayTeamId) {
      Alert.alert('خطأ', 'لا يمكن أن يكون الفريقان متماثلين');
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
          console.log('Operator assignment handled in create');
        }
      }

      Alert.alert('نجاح', 'تم إنشاء المباراة بنجاح', [
        { text: 'حسناً', onPress: resetForm }
      ]);
    } catch (error) {
      console.error('Error creating match:', error);
      Alert.alert('خطأ', 'فشل في إنشاء المباراة');
    } finally {
      setCreating(false);
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
        {/* Competition Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>البطولة *</Text>
          <TouchableOpacity
            style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowCompetitionPicker(true)}
          >
            <Text style={[
              styles.selectorText,
              { color: selectedCompetition ? colors.text : colors.textTertiary }
            ]}>
              {selectedCompetition ? getCompetitionById(selectedCompetition)?.name : 'اختر البطولة'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Teams Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>الفريقان *</Text>
          <View style={styles.teamsRow}>
            {/* Home Team */}
            <TouchableOpacity
              style={[styles.teamSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowTeamPicker('home')}
            >
              {homeTeamId ? (
                <View style={styles.selectedTeam}>
                  <TeamLogo team={getTeamById(homeTeamId)!} size="medium" />
                  <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                    {getTeamById(homeTeamId)?.shortName}
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyTeam}>
                  <Ionicons name="add-circle-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.emptyTeamText, { color: colors.textTertiary }]}>
                    الفريق المضيف
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.vsText, { color: colors.textSecondary }]}>VS</Text>

            {/* Away Team */}
            <TouchableOpacity
              style={[styles.teamSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowTeamPicker('away')}
            >
              {awayTeamId ? (
                <View style={styles.selectedTeam}>
                  <TeamLogo team={getTeamById(awayTeamId)!} size="medium" />
                  <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                    {getTeamById(awayTeamId)?.shortName}
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyTeam}>
                  <Ionicons name="add-circle-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.emptyTeamText, { color: colors.textTertiary }]}>
                    الفريق الضيف
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>التاريخ والوقت *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.accent} />
              <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(matchDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.accent} />
              <Text style={[styles.dateText, { color: colors.text }]}>{formatTime(matchDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Venue */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>الملعب</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="مثال: ملعب الشعب الدولي"
            placeholderTextColor={colors.textTertiary}
            value={venue}
            onChangeText={setVenue}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        {/* Referee */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>الحكم</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="اسم الحكم"
            placeholderTextColor={colors.textTertiary}
            value={referee}
            onChangeText={setReferee}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        {/* Operator Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المشغل (اختياري)</Text>
          <TouchableOpacity
            style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowOperatorPicker(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
              <Text style={[
                styles.selectorText,
                { color: selectedOperator ? colors.text : colors.textTertiary }
              ]}>
                {selectedOperator ? getOperatorById(selectedOperator)?.name : 'اختر مشغل للمباراة'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            المشغل سيتمكن من إدارة أحداث المباراة
          </Text>
        </View>

        {/* Featured Toggle */}
        <TouchableOpacity
          style={[styles.toggleRow, { backgroundColor: colors.surface }]}
          onPress={() => setIsFeatured(!isFeatured)}
        >
          <View style={styles.toggleInfo}>
            <Ionicons name="star" size={24} color={isFeatured ? colors.warning : colors.textTertiary} />
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>مباراة مميزة</Text>
              <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                ستظهر في القسم المميز
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, isFeatured && styles.toggleActive, { backgroundColor: isFeatured ? colors.accent : colors.border }]}>
            <View style={[styles.toggleDot, isFeatured && styles.toggleDotActive]} />
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, creating && styles.submitButtonDisabled]}
          onPress={handleCreateMatch}
          disabled={creating}
        >
          <LinearGradient
            colors={colors.gradients.accent}
            style={styles.submitGradient}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.submitText}>إنشاء المباراة</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

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
      <Modal
        visible={showTeamPicker !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTeamPicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {showTeamPicker === 'home' ? 'اختر الفريق المضيف' : 'اختر الفريق الضيف'}
              </Text>
              <TouchableOpacity onPress={() => setShowTeamPicker(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
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
          </View>
        </View>
      </Modal>

      {/* Competition Picker Modal */}
      <Modal
        visible={showCompetitionPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompetitionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>اختر البطولة</Text>
              <TouchableOpacity onPress={() => setShowCompetitionPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
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
          </View>
        </View>
      </Modal>

      {/* Operator Picker Modal */}
      <Modal
        visible={showOperatorPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOperatorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>اختر المشغل</Text>
              <TouchableOpacity onPress={() => setShowOperatorPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: '#fff',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  quickNav: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  quickNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  quickNavText: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  selectorText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  teamSelector: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTeam: {
    alignItems: 'center',
    gap: SPACING.sm,
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
  vsText: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  dateText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  input: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...TYPOGRAPHY.bodyMedium,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  toggleTextContainer: {
    gap: 2,
  },
  toggleTitle: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '600',
  },
  toggleSubtitle: {
    ...TYPOGRAPHY.labelSmall,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleDotActive: {
    transform: [{ translateX: 22 }],
  },
  submitButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  submitText: {
    ...TYPOGRAPHY.bodyLarge,
    color: '#fff',
    fontWeight: '700',
  },
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
  helperText: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.xs,
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
