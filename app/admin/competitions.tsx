import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { competitionApi, teamApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';
import TeamLogo from '@/components/ui/TeamLogo';

interface Competition {
  id: string;
  name: string;
  shortName: string;
  country: string;
  season: string;
  type: string;
  format: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  teams?: any[];
  groups?: any[];
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
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { user, isAuthenticated } = useAuthStore();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGroupTeamsModal, setShowGroupTeamsModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [newGroupName, setNewGroupName] = useState('');

  // Knockout state
  const [knockout, setKnockout] = useState<any>({});
  const [knockoutLoading, setKnockoutLoading] = useState(false);

  // Detail tab
  const [detailTab, setDetailTab] = useState<'groups' | 'knockout' | 'matches' | 'standings'>('groups');

  // Create match inside competition
  const [matchHomeTeamId, setMatchHomeTeamId] = useState('');
  const [matchAwayTeamId, setMatchAwayTeamId] = useState('');
  const [matchStage, setMatchStage] = useState('GROUP');
  const [matchGroupId, setMatchGroupId] = useState('');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ type: 'error' | 'warning' | 'confirm'; title: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({
    type: 'error', title: '', message: '',
  });
  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };

  // Competition form
  const [compName, setCompName] = useState('');
  const [compShortName, setCompShortName] = useState('');
  const [compSeason, setCompSeason] = useState('2025-2026');
  const [compType, setCompType] = useState('futsal');
  const [compFormat, setCompFormat] = useState('LEAGUE');
  const [compIcon, setCompIcon] = useState('trophy');
  const [compIsActive, setCompIsActive] = useState(true);

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
      showError(t('admin.error'), t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const openAddCompetitionModal = () => {
    setEditingCompetition(null);
    setCompName('');
    setCompShortName('');
    setCompSeason('2025-2026');
    setCompType('futsal');
    setCompFormat('LEAGUE');
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
    setCompFormat(competition.format || 'LEAGUE');
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
      showError(t('admin.error'), t('admin.fillRequired'));
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
        format: compFormat,
        icon: compIcon,
        isActive: compIsActive,
        sortOrder: editingCompetition?.sortOrder || competitions.length + 1,
      };

      if (editingCompetition) {
        await competitionApi.update(editingCompetition.id, competitionData);
      } else {
        await competitionApi.create(competitionData);
      }

      setShowCompetitionModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving competition:', error);
      showError(t('admin.error'), t('admin.saveCompFailed'));
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
      
      setShowTeamsModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving teams:', error);
      showError(t('admin.error'), t('admin.saveCompFailed'));
    } finally {
      setSaving(false);
    }
  };

  const openStandingsModal = async (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowStandingsModal(true);
    setStandingsLoading(true);
    try {
      const response = await competitionApi.getStandings(competition.id);
      setStandings(response.data?.data || []);
    } catch (error) {
      console.error('Error loading standings:', error);
      setStandings([]);
    } finally {
      setStandingsLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // ── Group Management ──
  const loadGroups = async (compId: string) => {
    try {
      setGroupsLoading(true);
      const res = await competitionApi.getGroups(compId);
      setGroups(res.data?.data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!selectedCompetition || !newGroupName.trim()) return;
    try {
      setSaving(true);
      await competitionApi.createGroup(selectedCompetition.id, { name: newGroupName.trim(), sortOrder: groups.length });
      setNewGroupName('');
      loadGroups(selectedCompetition.id);
    } catch (error) {
      showError('خطأ', 'فشل إنشاء المجموعة');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!selectedCompetition) return;
    try {
      setSaving(true);
      await competitionApi.deleteGroup(selectedCompetition.id, groupId);
      loadGroups(selectedCompetition.id);
    } catch (error) {
      showError('خطأ', 'فشل حذف المجموعة');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTeamToGroup = async (teamId: string) => {
    if (!selectedCompetition || !selectedGroup) return;
    try {
      await competitionApi.addTeamToGroup(selectedCompetition.id, selectedGroup.id, teamId);
      loadGroups(selectedCompetition.id);
    } catch (error) {
      showError('خطأ', 'فشل إضافة الفريق');
    }
  };

  const handleRemoveTeamFromGroup = async (teamId: string) => {
    if (!selectedCompetition || !selectedGroup) return;
    try {
      await competitionApi.removeTeamFromGroup(selectedCompetition.id, selectedGroup.id, teamId);
      loadGroups(selectedCompetition.id);
    } catch (error) {
      showError('خطأ', 'فشل إزالة الفريق');
    }
  };

  // ── Knockout Management ──
  const loadKnockout = async (compId: string) => {
    try {
      setKnockoutLoading(true);
      const res = await competitionApi.getKnockout(compId);
      setKnockout(res.data?.data || {});
    } catch (error) {
      console.error('Error loading knockout:', error);
    } finally {
      setKnockoutLoading(false);
    }
  };

  // ── Open Competition Detail ──
  const openDetailModal = async (competition: Competition) => {
    setSelectedCompetition(competition);
    setDetailTab(competition.format === 'GROUPS' ? 'groups' : 'standings');
    setShowDetailModal(true);
    if (competition.format === 'GROUPS') {
      loadGroups(competition.id);
      loadKnockout(competition.id);
    }
  };

  // ── Create Match inside competition ──
  const handleCreateCompMatch = async () => {
    if (!selectedCompetition || !matchHomeTeamId || !matchAwayTeamId) {
      showError('خطأ', 'اختر الفريقين');
      return;
    }
    if (matchHomeTeamId === matchAwayTeamId) {
      showError('خطأ', 'لا يمكن اختيار نفس الفريق');
      return;
    }
    try {
      setSaving(true);
      const { matchApi: mApi } = require('@/services/api');
      await mApi.create({
        competitionId: selectedCompetition.id,
        homeTeamId: matchHomeTeamId,
        awayTeamId: matchAwayTeamId,
        startTime: new Date().toISOString(),
        stage: matchStage || undefined,
        groupId: matchStage === 'GROUP' ? matchGroupId || undefined : undefined,
      });
      setShowCreateMatchModal(false);
      setMatchHomeTeamId('');
      setMatchAwayTeamId('');
      showError('نجاح', 'تم إنشاء المباراة بنجاح');
    } catch (error) {
      showError('خطأ', 'فشل إنشاء المباراة');
    } finally {
      setSaving(false);
    }
  };

  const STAGE_LABELS: Record<string, string> = {
    GROUP: 'دور المجموعات',
    QUARTER_FINAL: 'ربع النهائي',
    SEMI_FINAL: 'نصف النهائي',
    FINAL: 'النهائي',
  };

  const renderCompetitionCard = ({ item: competition }: { item: Competition }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => openDetailModal(competition)}
      style={[styles.competitionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
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
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <View style={[styles.statusBadge, { backgroundColor: competition.isActive ? '#10B98120' : '#DC262620' }]}>
                <Text style={[styles.statusText, { color: competition.isActive ? '#10B981' : '#DC2626' }]}>
                  {competition.isActive ? 'نشط' : 'غير نشط'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colors.accent + '15' }]}>
                <Text style={[styles.statusText, { color: colors.accent }]}>
                  {competition.format === 'GROUPS' ? 'مجموعات' : 'دوري'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.competitionActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
            onPress={(e) => { e.stopPropagation(); openEditCompetitionModal(competition); }}
          >
            <Ionicons name="pencil" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cardActionBtn, { backgroundColor: colors.background }]}
          onPress={(e) => { e.stopPropagation(); openManageTeamsModal(competition); }}
        >
          <Ionicons name="shield" size={16} color={colors.accent} />
          <Text style={[styles.cardActionText, { color: colors.text }]}>الأندية</Text>
          <View style={[styles.teamCount, { backgroundColor: colors.accent }]}>
            <Text style={styles.teamCountText}>{competition.teams?.length || 0}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cardActionBtn, { backgroundColor: colors.background }]}
          onPress={(e) => { e.stopPropagation(); openDetailModal(competition); }}
        >
          <Ionicons name="settings" size={16} color={colors.accent} />
          <Text style={[styles.cardActionText, { color: colors.text }]}>إدارة</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
      {/* Competitions List */}
      <FlatList
        data={competitions}
        renderItem={renderCompetitionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: SPACING.sm }}>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={openAddCompetitionModal}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>إضافة بطولة</Text>
            </TouchableOpacity>
          </View>
        }
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
      <AppModal
        visible={showCompetitionModal}
        onClose={() => setShowCompetitionModal(false)}
        title={editingCompetition ? 'تعديل البطولة' : 'إضافة بطولة جديدة'}
        icon="trophy"
        maxHeight="85%"
      >
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

              {/* Format */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>نظام البطولة *</Text>
                <View style={styles.typePicker}>
                  {[
                    { value: 'LEAGUE', label: 'دوري ترتيب', icon: 'podium' as const },
                    { value: 'GROUPS', label: 'مجموعات + إقصائي', icon: 'grid' as const },
                  ].map((fmt) => (
                    <TouchableOpacity
                      key={fmt.value}
                      style={[
                        styles.typeOption,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        compFormat === fmt.value && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setCompFormat(fmt.value)}
                    >
                      <Ionicons 
                        name={fmt.icon} 
                        size={18} 
                        color={compFormat === fmt.value ? '#fff' : colors.text} 
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          { color: compFormat === fmt.value ? '#fff' : colors.text },
                        ]}
                      >
                        {fmt.label}
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
      </AppModal>

      {/* Manage Teams Modal */}
      <AppModal
        visible={showTeamsModal}
        onClose={() => setShowTeamsModal(false)}
        title="إدارة الأندية"
        subtitle={selectedCompetition?.name}
        icon="shield"
        maxHeight="70%"
      >
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
      </AppModal>

      {/* Standings Modal */}
      <AppModal
        visible={showStandingsModal}
        onClose={() => setShowStandingsModal(false)}
        title="ترتيب البطولة"
        subtitle={selectedCompetition?.name}
        icon="podium"
        maxHeight="85%"
      >
        {standingsLoading ? (
          <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : standings.length === 0 ? (
          <View style={{ padding: SPACING.xxl, alignItems: 'center' }}>
            <Ionicons name="podium-outline" size={48} color={colors.textTertiary} />
            <Text style={{ color: colors.textSecondary, marginTop: SPACING.md, fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center' }}>
              لا توجد بيانات ترتيب{"\n"}يتم حساب الترتيب من المباريات المنتهية
            </Text>
          </View>
        ) : (
          <ScrollView style={{ padding: SPACING.sm }} showsVerticalScrollIndicator={false}>
            {/* Table Header */}
            <View style={[styles.standingsRow, styles.standingsHeader, { backgroundColor: colors.accent + '10' }]}>
              <Text style={[styles.standingsRank, styles.standingsHeaderText, { color: colors.textSecondary }]}>#</Text>
              <Text style={[styles.standingsTeam, styles.standingsHeaderText, { color: colors.textSecondary }]}>الفريق</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText, { color: colors.textSecondary }]}>لعب</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText, { color: colors.textSecondary }]}>ف</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText, { color: colors.textSecondary }]}>ت</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText, { color: colors.textSecondary }]}>خ</Text>
              <Text style={[styles.standingsCell, styles.standingsHeaderText, { color: colors.textSecondary }]}>+/-</Text>
              <Text style={[styles.standingsPts, styles.standingsHeaderText, { color: colors.textSecondary }]}>نقاط</Text>
            </View>
            {/* Table Body */}
            {standings.map((item: any, index: number) => (
              <View
                key={item.teamId}
                style={[
                  styles.standingsRow,
                  { borderBottomColor: colors.border, borderBottomWidth: index < standings.length - 1 ? 0.5 : 0 },
                  index < 3 && { backgroundColor: (index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32') + '08' },
                ]}
              >
                <Text style={[styles.standingsRank, {
                  color: index < 3 ? colors.accent : colors.text,
                  fontWeight: index < 3 ? '800' : '600',
                }]}>{item.rank}</Text>
                <View style={[styles.standingsTeam, { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }]}>
                  <TeamLogo team={item.team} size="small" />
                  <Text style={[styles.standingsTeamName, { color: colors.text }]} numberOfLines={1}>{item.team?.shortName || item.team?.name}</Text>
                </View>
                <Text style={[styles.standingsCell, { color: colors.text }]}>{item.played}</Text>
                <Text style={[styles.standingsCell, { color: '#10B981' }]}>{item.won}</Text>
                <Text style={[styles.standingsCell, { color: colors.textSecondary }]}>{item.drawn}</Text>
                <Text style={[styles.standingsCell, { color: '#DC2626' }]}>{item.lost}</Text>
                <Text style={[styles.standingsCell, { color: item.goalDifference > 0 ? '#10B981' : item.goalDifference < 0 ? '#DC2626' : colors.textSecondary }]}>
                  {item.goalDifference > 0 ? '+' : ''}{item.goalDifference}
                </Text>
                <Text style={[styles.standingsPts, {
                  color: colors.accent,
                  fontWeight: '800',
                }]}>{item.points}</Text>
              </View>
            ))}
            {/* Goals Detail */}
            <View style={{ marginTop: SPACING.lg, padding: SPACING.md }}>
              <Text style={{ color: colors.textTertiary, fontSize: 11, textAlign: 'center', fontFamily: FONTS.regular }}>
                يتم حساب الترتيب تلقائياً من نتائج المباريات المنتهية
              </Text>
            </View>
          </ScrollView>
        )}
      </AppModal>

      {/* ── Competition Detail Modal ── */}
      <AppModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedCompetition?.name || 'إدارة البطولة'}
        subtitle={selectedCompetition?.format === 'GROUPS' ? 'مجموعات + إقصائي' : 'دوري ترتيب'}
        icon="trophy"
        maxHeight="90%"
      >
        {/* Detail Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.md, gap: 2 }}>
            {selectedCompetition?.format === 'GROUPS' && (
              <TouchableOpacity
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: detailTab === 'groups' ? 2 : 0, borderBottomColor: colors.accent }}
                onPress={() => setDetailTab('groups')}
              >
                <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: detailTab === 'groups' ? colors.accent : colors.textTertiary }}>المجموعات</Text>
              </TouchableOpacity>
            )}
            {selectedCompetition?.format === 'GROUPS' && (
              <TouchableOpacity
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: detailTab === 'knockout' ? 2 : 0, borderBottomColor: colors.accent }}
                onPress={() => setDetailTab('knockout')}
              >
                <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: detailTab === 'knockout' ? colors.accent : colors.textTertiary }}>الأدوار الإقصائية</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: detailTab === 'matches' ? 2 : 0, borderBottomColor: colors.accent }}
              onPress={() => setDetailTab('matches')}
            >
              <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: detailTab === 'matches' ? colors.accent : colors.textTertiary }}>إنشاء مباراة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: detailTab === 'standings' ? 2 : 0, borderBottomColor: colors.accent }}
              onPress={() => {
                setDetailTab('standings');
                if (selectedCompetition) openStandingsModal(selectedCompetition);
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: detailTab === 'standings' ? colors.accent : colors.textTertiary }}>الترتيب</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <ScrollView style={{ padding: SPACING.md }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── Groups Tab ── */}
          {detailTab === 'groups' && selectedCompetition?.format === 'GROUPS' && (
            <View>
              {/* Create Group */}
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
                <TextInput
                  style={[styles.input, { flex: 1, height: 44, backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="اسم المجموعة (مثال: مجموعة أ)"
                  placeholderTextColor={colors.textTertiary}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  textAlign={isRTL ? 'right' : 'left'}
                />
                <TouchableOpacity
                  style={{ backgroundColor: colors.accent, height: 44, paddingHorizontal: 16, borderRadius: RADIUS.lg, justifyContent: 'center' }}
                  onPress={handleCreateGroup}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {groupsLoading ? (
                <ActivityIndicator color={colors.accent} style={{ paddingVertical: 20 }} />
              ) : groups.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="grid-outline" size={40} color={colors.textTertiary} />
                  <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 8, fontFamily: FONTS.regular }}>لا توجد مجموعات - أنشئ مجموعة جديدة</Text>
                </View>
              ) : (
                groups.map((group: any) => (
                  <View key={group.id} style={{ marginBottom: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                    {/* Group Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.accent + '10', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
                      <Text style={{ fontSize: 14, fontFamily: FONTS.bold, color: colors.text }}>{group.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: colors.accent + '20', width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => {
                            setSelectedGroup(group);
                            setShowGroupTeamsModal(true);
                          }}
                        >
                          <Ionicons name="person-add" size={14} color={colors.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ backgroundColor: '#EF444420', width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => handleDeleteGroup(group.id)}
                        >
                          <Ionicons name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Group Teams */}
                    {group.teams?.length > 0 ? (
                      group.teams.map((gt: any) => (
                        <View key={gt.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: colors.border }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                            <TeamLogo team={gt.team} size="small" />
                            <Text style={{ fontSize: 13, fontFamily: FONTS.medium, color: colors.text }}>{gt.team?.name || gt.team?.shortName}</Text>
                          </View>
                          <TouchableOpacity onPress={() => { setSelectedGroup(group); handleRemoveTeamFromGroup(gt.teamId || gt.team?.id); }}>
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={{ padding: SPACING.md, color: colors.textTertiary, fontSize: 12, textAlign: 'center', fontFamily: FONTS.regular }}>لا توجد فرق - اضغط + لإضافة فرق</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── Knockout Tab ── */}
          {detailTab === 'knockout' && selectedCompetition?.format === 'GROUPS' && (
            <View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: FONTS.regular, marginBottom: SPACING.md, textAlign: 'center' }}>
                أنشئ مباريات الأدوار الإقصائية من تبويب "إنشاء مباراة"
              </Text>
              {knockoutLoading ? (
                <ActivityIndicator color={colors.accent} style={{ paddingVertical: 20 }} />
              ) : (
                ['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].map((stage) => {
                  const stageMatches = knockout[stage] || [];
                  return (
                    <View key={stage} style={{ marginBottom: SPACING.lg }}>
                      <Text style={{ fontSize: 14, fontFamily: FONTS.bold, color: colors.accent, marginBottom: SPACING.sm }}>
                        {STAGE_LABELS[stage]}
                      </Text>
                      {stageMatches.length > 0 ? (
                        stageMatches.map((m: any) => (
                          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 6, borderWidth: 1, borderColor: colors.border }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                              <TeamLogo team={m.homeTeam} size="small" />
                              <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: colors.text }} numberOfLines={1}>{m.homeTeam?.shortName}</Text>
                            </View>
                            <Text style={{ fontSize: 13, fontFamily: FONTS.bold, color: colors.accent, paddingHorizontal: 8 }}>
                              {m.status === 'finished' ? `${m.homeScore} - ${m.awayScore}` : 'vs'}
                            </Text>
                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 }}>
                              <TeamLogo team={m.awayTeam} size="small" />
                              <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: colors.text }} numberOfLines={1}>{m.awayTeam?.shortName}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', fontFamily: FONTS.regular }}>لا توجد مباريات</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ── Create Match Tab ── */}
          {detailTab === 'matches' && (
            <View>
              {/* Stage selector */}
              {selectedCompetition?.format === 'GROUPS' && (
                <View style={{ marginBottom: SPACING.md }}>
                  <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: colors.textSecondary, marginBottom: 6 }}>المرحلة</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.typeOption, { backgroundColor: matchStage === s ? colors.accent : colors.surface, borderColor: matchStage === s ? colors.accent : colors.border }]}
                          onPress={() => setMatchStage(s)}
                        >
                          <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: matchStage === s ? '#fff' : colors.text }}>{STAGE_LABELS[s]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Group selector (if GROUP stage) */}
              {matchStage === 'GROUP' && selectedCompetition?.format === 'GROUPS' && groups.length > 0 && (
                <View style={{ marginBottom: SPACING.md }}>
                  <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: colors.textSecondary, marginBottom: 6 }}>المجموعة</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {groups.map((g: any) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[styles.typeOption, { backgroundColor: matchGroupId === g.id ? colors.accent : colors.surface, borderColor: matchGroupId === g.id ? colors.accent : colors.border }]}
                          onPress={() => setMatchGroupId(g.id)}
                        >
                          <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: matchGroupId === g.id ? '#fff' : colors.text }}>{g.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Home Team */}
              <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: colors.textSecondary, marginBottom: 6 }}>الفريق المضيف</Text>
              {selectedCompetition?.format === 'GROUPS' && groups.length > 0 ? (
                <View style={{ marginBottom: SPACING.md }}>
                  {groups.map((g: any) => (
                    <View key={g.id} style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: FONTS.bold, color: colors.accent, marginBottom: 4 }}>{g.name}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {(g.teams || []).map((gt: any) => {
                            const team = gt.team;
                            if (!team) return null;
                            return (
                              <TouchableOpacity
                                key={team.id}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: matchHomeTeamId === team.id ? colors.accent : colors.border, backgroundColor: matchHomeTeamId === team.id ? colors.accent + '15' : colors.surface }}
                                onPress={() => setMatchHomeTeamId(team.id)}
                              >
                                <TeamLogo team={team} size="small" />
                                <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: colors.text }}>{team.shortName || team.name}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  ))}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {allTeams.map((team) => (
                      <TouchableOpacity
                        key={team.id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: matchHomeTeamId === team.id ? colors.accent : colors.border, backgroundColor: matchHomeTeamId === team.id ? colors.accent + '15' : colors.surface }}
                        onPress={() => setMatchHomeTeamId(team.id)}
                      >
                        <TeamLogo team={team} size="small" />
                        <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: colors.text }}>{team.shortName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* Away Team */}
              <Text style={{ fontSize: 13, fontFamily: FONTS.semiBold, color: colors.textSecondary, marginBottom: 6 }}>الفريق الضيف</Text>
              {selectedCompetition?.format === 'GROUPS' && groups.length > 0 ? (
                <View style={{ marginBottom: SPACING.lg }}>
                  {groups.map((g: any) => (
                    <View key={g.id} style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: FONTS.bold, color: colors.accent, marginBottom: 4 }}>{g.name}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {(g.teams || []).map((gt: any) => {
                            const team = gt.team;
                            if (!team) return null;
                            return (
                              <TouchableOpacity
                                key={team.id}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: matchAwayTeamId === team.id ? colors.accent : colors.border, backgroundColor: matchAwayTeamId === team.id ? colors.accent + '15' : colors.surface }}
                                onPress={() => setMatchAwayTeamId(team.id)}
                              >
                                <TeamLogo team={team} size="small" />
                                <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: colors.text }}>{team.shortName || team.name}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  ))}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {allTeams.map((team) => (
                      <TouchableOpacity
                        key={team.id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: matchAwayTeamId === team.id ? colors.accent : colors.border, backgroundColor: matchAwayTeamId === team.id ? colors.accent + '15' : colors.surface }}
                        onPress={() => setMatchAwayTeamId(team.id)}
                      >
                        <TeamLogo team={team} size="small" />
                        <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: colors.text }}>{team.shortName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* Create Button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.accent, margin: 0, opacity: saving ? 0.6 : 1 }]}
                onPress={handleCreateCompMatch}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.saveButtonText}>إنشاء المباراة</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Standings Tab ── */}
          {detailTab === 'standings' && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="podium-outline" size={40} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8, fontFamily: FONTS.regular, textAlign: 'center' }}>
                اضغط على "الترتيب" في البطاقة لعرض جدول الترتيب الكامل
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </AppModal>

      {/* ── Add Teams to Group Modal ── */}
      <AppModal
        visible={showGroupTeamsModal}
        onClose={() => setShowGroupTeamsModal(false)}
        title={`إضافة فرق - ${selectedGroup?.name || ''}`}
        icon="person-add"
        maxHeight="70%"
      >
        <ScrollView style={{ padding: SPACING.md }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: FONTS.regular, marginBottom: SPACING.md }}>
            اختر الفرق لإضافتها للمجموعة
          </Text>
          {allTeams.map((team) => {
            const isInGroup = selectedGroup?.teams?.some((gt: any) => (gt.teamId || gt.team?.id) === team.id);
            return (
              <TouchableOpacity
                key={team.id}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: SPACING.md, marginBottom: 6, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: isInGroup ? colors.accent : colors.border, backgroundColor: isInGroup ? colors.accent + '10' : colors.surface }}
                onPress={() => {
                  if (isInGroup) {
                    handleRemoveTeamFromGroup(team.id);
                  } else {
                    handleAddTeamToGroup(team.id);
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <TeamLogo team={team} size="small" />
                  <Text style={{ fontSize: 14, fontFamily: FONTS.medium, color: colors.text }}>{team.name}</Text>
                </View>
                <Ionicons name={isInGroup ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={isInGroup ? colors.accent : colors.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </AppModal>

      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={t('admin.ok')}
        showCancel={dialogConfig.showCancel}
        onConfirm={() => {
          if (dialogConfig.onConfirm) dialogConfig.onConfirm();
          else setDialogVisible(false);
        }}
        onCancel={() => setDialogVisible(false)}
      />
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
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    gap: 6,
    ...SHADOWS.sm,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  competitionCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  competitionHeader: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  competitionInfo: {
    alignItems: 'center',
    flex: 1,
  },
  competitionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
    ...SHADOWS.sm,
  },
  competitionDetails: {
    flex: 1,
  },
  competitionName: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  competitionMeta: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 3,
    opacity: 0.7,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  statusText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  competitionActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    gap: 0,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  cardActionText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    flex: 1,
  },
  teamCount: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontFamily: FONTS.extraBold,
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
    fontFamily: FONTS.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalBody: {
    padding: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  input: {
    height: 52,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  typePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    gap: 6,
  },
  typeOptionText: {
    ...TYPOGRAPHY.labelMedium,
    fontWeight: '600',
  },
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconOption: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
  },
  switchLabel: {
    ...TYPOGRAPHY.bodyLarge,
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
    margin: SPACING.xl,
    height: 54,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: FONTS.extraBold,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: SPACING.md,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  teamLogoText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONTS.extraBold,
  },
  teamItemDetails: {
    flex: 1,
  },
  teamItemName: {
    ...TYPOGRAPHY.titleSmall,
    fontWeight: '700',
  },
  teamItemShort: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 2,
    opacity: 0.6,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minHeight: 40,
  },
  standingsHeader: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    marginHorizontal: SPACING.xs,
  },
  standingsHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  standingsRank: {
    width: 24,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  standingsTeam: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  standingsTeamName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    flex: 1,
  },
  standingsCell: {
    width: 28,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONTS.medium,
    fontVariant: ['tabular-nums'],
  },
  standingsPts: {
    width: 32,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontVariant: ['tabular-nums'],
  },
});
