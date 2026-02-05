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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { competitionApi, teamApi } from '@/services/api';

interface Competition {
  id: string;
  name: string;
  shortName: string;
  country: string;
  season: string;
  type: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  teams?: any[];
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor?: string;
}

export default function CompetitionsManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  const { user, isAuthenticated } = useAuthStore();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Competition form
  const [compName, setCompName] = useState('');
  const [compShortName, setCompShortName] = useState('');
  const [compSeason, setCompSeason] = useState('2025-2026');
  const [compType, setCompType] = useState('football');
  const [compIcon, setCompIcon] = useState('trophy');
  const [compIsActive, setCompIsActive] = useState(true);

  const competitionTypes = [
    { value: 'football', label: 'كرة القدم', icon: 'football' },
    { value: 'basketball', label: 'كرة السلة', icon: 'basketball' },
    { value: 'futsal', label: 'كرة مصغرة', icon: 'football-outline' },
    { value: 'women', label: 'نسوية', icon: 'people' },
    { value: 'national', label: 'منتخبات', icon: 'flag' },
  ];

  const iconOptions = [
    'trophy', 'football', 'basketball', 'star', 'medal', 
    'ribbon', 'flag', 'people', 'football-outline'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [compsResponse, teamsResponse] = await Promise.all([
        competitionApi.getAll(),
        teamApi.getAll(),
      ]);
      
      const compsData = compsResponse.data?.data || [];
      const teamsData = teamsResponse.data?.data || [];
      
      // Count teams for each competition
      const compsWithTeamCount = compsData.map((comp: Competition) => {
        const teamsInComp = teamsData.filter((team: any) => 
          team.competitions?.some((tc: any) => tc.competitionId === comp.id)
        );
        return {
          ...comp,
          teams: teamsInComp,
        };
      });
      
      setCompetitions(compsWithTeamCount);
      setAllTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const openAddCompetitionModal = () => {
    setEditingCompetition(null);
    setCompName('');
    setCompShortName('');
    setCompSeason('2025-2026');
    setCompType('football');
    setCompIcon('trophy');
    setCompIsActive(true);
    setShowCompetitionModal(true);
  };

  const openEditCompetitionModal = (competition: Competition) => {
    setEditingCompetition(competition);
    setCompName(competition.name);
    setCompShortName(competition.shortName);
    setCompSeason(competition.season);
    setCompType(competition.type);
    setCompIcon(competition.icon);
    setCompIsActive(competition.isActive);
    setShowCompetitionModal(true);
  };

  const openManageTeamsModal = async (competition: Competition) => {
    setSelectedCompetition(competition);
    
    // Get teams in this competition
    try {
      const response = await teamApi.getByCompetition(competition.id);
      const teamsInComp = response.data?.data || [];
      setSelectedTeamIds(teamsInComp.map((t: Team) => t.id));
      setShowTeamsModal(true);
    } catch (error) {
      console.error('Error loading competition teams:', error);
      setSelectedTeamIds([]);
      setShowTeamsModal(true);
    }
  };

  const handleSaveCompetition = async () => {
    if (!compName.trim() || !compShortName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم البطولة والاسم المختصر');
      return;
    }

    try {
      setSaving(true);
      const competitionData = {
        name: compName.trim(),
        shortName: compShortName.trim(),
        country: 'العراق',
        season: compSeason,
        type: compType,
        icon: compIcon,
        isActive: compIsActive,
        sortOrder: editingCompetition?.sortOrder || competitions.length + 1,
      };

      if (editingCompetition) {
        await competitionApi.update(editingCompetition.id, competitionData);
        Alert.alert('نجاح', 'تم تحديث البطولة بنجاح');
      } else {
        await competitionApi.create(competitionData);
        Alert.alert('نجاح', 'تم إنشاء البطولة بنجاح');
      }

      setShowCompetitionModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving competition:', error);
      Alert.alert('خطأ', error.response?.data?.message || 'فشل في حفظ البطولة');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeams = async () => {
    if (!selectedCompetition) return;

    try {
      setSaving(true);
      
      // Get current teams
      const response = await teamApi.getByCompetition(selectedCompetition.id);
      const currentTeams = response.data?.data || [];
      const currentTeamIds = currentTeams.map((t: Team) => t.id);
      
      // Find teams to add
      const toAdd = selectedTeamIds.filter(id => !currentTeamIds.includes(id));
      
      // Find teams to remove
      const toRemove = currentTeamIds.filter((id: string) => !selectedTeamIds.includes(id));
      
      // Add new teams
      for (const teamId of toAdd) {
        await teamApi.addToCompetition(teamId, selectedCompetition.id);
      }
      
      // Remove teams
      for (const teamId of toRemove) {
        await teamApi.removeFromCompetition(teamId, selectedCompetition.id);
      }
      
      Alert.alert('نجاح', 'تم تحديث الأندية بنجاح');
      setShowTeamsModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving teams:', error);
      Alert.alert('خطأ', error.response?.data?.message || 'فشل في حفظ الأندية');
    } finally {
      setSaving(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const renderCompetitionCard = ({ item: competition }: { item: Competition }) => (
    <View style={[styles.competitionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.competitionHeader, { flexDirection }]}>
        <View style={[styles.competitionInfo, { flexDirection }]}>
          <View style={[styles.competitionIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name={competition.icon as any} size={24} color="#fff" />
          </View>
          <View style={styles.competitionDetails}>
            <Text style={[styles.competitionName, { color: colors.text }]}>
              {competition.name}
            </Text>
            <Text style={[styles.competitionMeta, { color: colors.textSecondary }]}>
              {competition.shortName} • {competition.season}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: competition.isActive ? '#10B98120' : '#DC262620' }]}>
              <Text style={[styles.statusText, { color: competition.isActive ? '#10B981' : '#DC2626' }]}>
                {competition.isActive ? 'نشط' : 'غير نشط'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.competitionActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
            onPress={() => openEditCompetitionModal(competition)}
          >
            <Ionicons name="pencil" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Manage Teams Button */}
      <TouchableOpacity
        style={[styles.manageTeamsButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        onPress={() => openManageTeamsModal(competition)}
      >
        <Ionicons name="shield" size={18} color={colors.accent} />
        <Text style={[styles.manageTeamsText, { color: colors.text }]}>
          إدارة الأندية المشاركة
        </Text>
        <View style={[styles.teamCount, { backgroundColor: colors.accent }]}>
          <Text style={styles.teamCountText}>
            {competition.teams?.length || 0}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={openAddCompetitionModal}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>إضافة بطولة</Text>
        </TouchableOpacity>
      </View>

      {/* Competitions List */}
      <FlatList
        data={competitions}
        renderItem={renderCompetitionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد بطولات
            </Text>
          </View>
        }
      />

      {/* Edit Competition Modal */}
      <Modal
        visible={showCompetitionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompetitionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCompetition ? 'تعديل البطولة' : 'إضافة بطولة جديدة'}
              </Text>
              <TouchableOpacity onPress={() => setShowCompetitionModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Competition Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>اسم البطولة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={compName}
                  onChangeText={setCompName}
                  placeholder="مثال: الدوري العراقي الممتاز"
                  placeholderTextColor={colors.textSecondary}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Short Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>الاسم المختصر *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={compShortName}
                  onChangeText={setCompShortName}
                  placeholder="مثال: الدوري"
                  placeholderTextColor={colors.textSecondary}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Season */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>الموسم</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={compSeason}
                  onChangeText={setCompSeason}
                  placeholder="2025-2026"
                  placeholderTextColor={colors.textSecondary}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Type */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>النوع</Text>
                <View style={styles.typePicker}>
                  {competitionTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeOption,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        compType === type.value && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setCompType(type.value)}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={18} 
                        color={compType === type.value ? '#fff' : colors.text} 
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          { color: compType === type.value ? '#fff' : colors.text },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Icon */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>الأيقونة</Text>
                <View style={styles.iconPicker}>
                  {iconOptions.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconOption,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        compIcon === icon && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setCompIcon(icon)}
                    >
                      <Ionicons 
                        name={icon as any} 
                        size={20} 
                        color={compIcon === icon ? '#fff' : colors.text} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Active Status */}
              <TouchableOpacity
                style={[styles.switchRow, { backgroundColor: colors.surface }]}
                onPress={() => setCompIsActive(!compIsActive)}
              >
                <Text style={[styles.switchLabel, { color: colors.text }]}>البطولة نشطة</Text>
                <View style={[styles.switch, compIsActive && { backgroundColor: colors.accent }]}>
                  <View style={[styles.switchThumb, compIsActive && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveCompetition}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingCompetition ? 'حفظ التغييرات' : 'إضافة البطولة'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manage Teams Modal */}
      <Modal
        visible={showTeamsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTeamsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '70%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                إدارة الأندية - {selectedCompetition?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowTeamsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                اختر الأندية المشاركة في هذه البطولة
              </Text>

              {allTeams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedTeamIds.includes(team.id) && { 
                      backgroundColor: colors.accent + '20', 
                      borderColor: colors.accent 
                    },
                  ]}
                  onPress={() => toggleTeam(team.id)}
                >
                  <View style={[styles.teamItemInfo, { flexDirection }]}>
                    <View style={[styles.teamLogo, { backgroundColor: team.primaryColor || colors.accent }]}>
                      <Text style={styles.teamLogoText}>{team.shortName?.charAt(0)}</Text>
                    </View>
                    <View style={styles.teamItemDetails}>
                      <Text style={[styles.teamItemName, { color: colors.text }]}>
                        {team.name}
                      </Text>
                      <Text style={[styles.teamItemShort, { color: colors.textSecondary }]}>
                        {team.shortName}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    selectedTeamIds.includes(team.id) && { 
                      backgroundColor: colors.accent,
                      borderColor: colors.accent 
                    },
                  ]}>
                    {selectedTeamIds.includes(team.id) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveTeams}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
              )}
            </TouchableOpacity>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
  },
  competitionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  competitionHeader: {
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  competitionInfo: {
    alignItems: 'center',
    flex: 1,
  },
  competitionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  competitionDetails: {
    flex: 1,
  },
  competitionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  competitionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  competitionActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageTeamsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  manageTeamsText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  teamCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: 16,
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
  },
  typePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    padding: 2,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    marginLeft: 22,
  },
  saveButton: {
    margin: SPACING.lg,
    height: 50,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  teamItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  teamLogoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamItemDetails: {
    flex: 1,
  },
  teamItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamItemShort: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
