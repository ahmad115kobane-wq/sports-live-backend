import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  FlatList,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { teamApi, competitionApi, playerApi } from '@/services/api';
import AppDialog from '@/components/ui/AppDialog';
import AppModal from '@/components/ui/AppModal';

interface Player {
  id: string;
  name: string;
  shirtNumber: number;
  position?: string;
  nationality?: string;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  category?: string;
  logoUrl?: string;
  primaryColor?: string;
  coach?: string;
  stadium?: string;
  city?: string;
  country?: string;
  players?: Player[];
  competitions?: any[];
}

const TEAM_CATEGORIES = [
  { value: 'FOOTBALL', label: 'كرة قدم', icon: 'football' },
  { value: 'HANDBALL', label: 'كرة يد', icon: 'hand-left' },
  { value: 'BASKETBALL', label: 'كرة سلة', icon: 'basketball' },
  { value: 'FUTSAL', label: 'كرة قدم مصغرة', icon: 'fitness' },
  { value: 'NATIONAL', label: 'منتخب', icon: 'flag' },
];

export default function TeamsManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { user, isAuthenticated } = useAuthStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showCompetitionsModal, setShowCompetitionsModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForCompetitions, setSelectedTeamForCompetitions] = useState<Team | null>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([]);

  // Team form
  const [teamName, setTeamName] = useState('');
  const [teamShortName, setTeamShortName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamColor, setTeamColor] = useState('#1E3A8A');
  const [teamCoach, setTeamCoach] = useState('');
  const [teamStadium, setTeamStadium] = useState('');
  const [teamCity, setTeamCity] = useState('');
  const [teamCategory, setTeamCategory] = useState('FOOTBALL');

  // Players management
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState<Team | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editCoachMode, setEditCoachMode] = useState(false);
  const [coachName, setCoachName] = useState('');

  // Player form
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [playerNationality, setPlayerNationality] = useState('العراق');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ type: 'error' | 'warning' | 'confirm'; title: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({
    type: 'error', title: '', message: '',
  });
  const showError = (title: string, message: string) => {
    setDialogConfig({ type: 'error', title, message });
    setDialogVisible(true);
  };
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialogConfig({ type: 'warning', title, message, showCancel: true, onConfirm });
    setDialogVisible(true);
  };

  // Colors palette
  const colorOptions = [
    '#1E3A8A', '#166534', '#DC2626', '#7C3AED', 
    '#EA580C', '#0891B2', '#4F46E5', '#BE185D',
    '#059669', '#D97706', '#6366F1', '#EC4899'
  ];

  // Positions per category
  const POSITIONS_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
    FOOTBALL: [
      { value: 'Goalkeeper', label: 'حارس مرمى' },
      { value: 'Defender', label: 'مدافع' },
      { value: 'Midfielder', label: 'وسط' },
      { value: 'Forward', label: 'مهاجم' },
    ],
    FUTSAL: [
      { value: 'Goalkeeper', label: 'حارس مرمى' },
      { value: 'Fixo', label: 'فيكسو (مدافع)' },
      { value: 'Ala', label: 'آلا (جناح)' },
      { value: 'Pivot', label: 'بيفوت (محور)' },
    ],
    HANDBALL: [
      { value: 'Goalkeeper', label: 'حارس مرمى' },
      { value: 'Left Wing', label: 'جناح أيسر' },
      { value: 'Right Wing', label: 'جناح أيمن' },
      { value: 'Left Back', label: 'ظهير أيسر' },
      { value: 'Right Back', label: 'ظهير أيمن' },
      { value: 'Center Back', label: 'وسط' },
      { value: 'Pivot', label: 'محور' },
    ],
    BASKETBALL: [
      { value: 'Point Guard', label: 'صانع ألعاب' },
      { value: 'Shooting Guard', label: 'حارس هجومي' },
      { value: 'Small Forward', label: 'جناح صغير' },
      { value: 'Power Forward', label: 'جناح قوي' },
      { value: 'Center', label: 'مركز' },
    ],
    NATIONAL: [
      { value: 'Goalkeeper', label: 'حارس مرمى' },
      { value: 'Defender', label: 'مدافع' },
      { value: 'Midfielder', label: 'وسط' },
      { value: 'Forward', label: 'مهاجم' },
    ],
  };
  const getPositionsForTeam = (team?: Team | null) => {
    const cat = team?.category || 'FOOTBALL';
    return POSITIONS_BY_CATEGORY[cat] || POSITIONS_BY_CATEGORY['FOOTBALL'];
  };
  const positions = getPositionsForTeam(selectedTeamForPlayers);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      showError(t('admin.unauthorized'), t('admin.unauthorizedDesc'));
      return;
    }
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamApi.getAllWithPlayers();
      const teamsData = response.data?.data || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Error loading teams:', error);
      showError(t('admin.error'), t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const openAddTeamModal = () => {
    setEditingTeam(null);
    setTeamName('');
    setTeamShortName('');
    setTeamLogo('');
    setTeamColor('#1E3A8A');
    setTeamCoach('');
    setTeamStadium('');
    setTeamCity('');
    setTeamCategory('FOOTBALL');
    setShowTeamModal(true);
  };

  const openEditTeamModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamShortName(team.shortName);
    setTeamLogo(team.logoUrl || '');
    setTeamColor(team.primaryColor || '#1E3A8A');
    setTeamCoach(team.coach || '');
    setTeamStadium(team.stadium || '');
    setTeamCity(team.city || '');
    setTeamCategory(team.category || 'FOOTBALL');
    setShowTeamModal(true);
  };

  const openPlayersModal = (team: Team) => {
    setSelectedTeamForPlayers(team);
    setEditingPlayer(null);
    setShowPlayerForm(false);
    setEditCoachMode(false);
    setCoachName(team.coach || '');
    setShowPlayersModal(true);
  };

  const openPlayerForm = (player?: Player) => {
    if (player) {
      setEditingPlayer(player);
      setPlayerName(player.name);
      setPlayerNumber(String(player.shirtNumber));
      setPlayerPosition(player.position || 'midfielder');
      setPlayerNationality(player.nationality || 'العراق');
    } else {
      setEditingPlayer(null);
      setPlayerName('');
      setPlayerNumber('');
      setPlayerPosition('midfielder');
      setPlayerNationality('العراق');
    }
    setShowPlayerForm(true);
  };

  const openCompetitionsModal = async (team: Team) => {
    setSelectedTeamForCompetitions(team);
    
    // Load all competitions
    try {
      const response = await competitionApi.getAll();
      setCompetitions(response.data?.data || []);
      
      // Get team's current competitions
      const teamCompIds = team.competitions?.map((tc: any) => tc.competitionId) || [];
      setSelectedCompetitions(teamCompIds);
      
      setShowCompetitionsModal(true);
    } catch (error) {
      console.error('Error loading competitions:', error);
      showError(t('admin.error'), t('admin.loadCompsFailed'));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setTeamLogo(result.assets[0].uri);
    }
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim() || !teamShortName.trim()) {
      showError(t('admin.error'), t('admin.fillTeamRequired'));
      return;
    }

    try {
      setSaving(true);
      const teamData = {
        name: teamName.trim(),
        shortName: teamShortName.trim().toUpperCase(),
        category: teamCategory,
        logoUrl: teamLogo || undefined,
        primaryColor: teamColor,
        coach: teamCoach.trim() || undefined,
        stadium: teamStadium.trim() || undefined,
        city: teamCity.trim() || undefined,
        country: 'العراق',
      };

      if (editingTeam) {
        await teamApi.update(editingTeam.id, teamData);
      } else {
        await teamApi.create(teamData);
      }

      setShowTeamModal(false);
      loadTeams();
    } catch (error: any) {
      console.error('Error saving team:', error);
      showError(t('admin.error'), t('admin.createTeamFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlayer = async () => {
    if (!playerName.trim() || !playerNumber) {
      showError(t('admin.error'), t('admin.fillPlayerRequired'));
      return;
    }

    if (!selectedTeamForPlayers) return;

    try {
      setSaving(true);
      const playerData = {
        name: playerName.trim(),
        shirtNumber: parseInt(playerNumber),
        position: playerPosition || 'midfielder',
        nationality: playerNationality.trim() || 'العراق',
      };

      if (editingPlayer) {
        await playerApi.update(editingPlayer.id, playerData);
      } else {
        await teamApi.addPlayer(selectedTeamForPlayers.id, playerData);
      }

      setShowPlayerForm(false);
      setEditingPlayer(null);
      // Reload teams to refresh player list
      const response = await teamApi.getAllWithPlayers();
      const teamsData = response.data?.data || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      // Update the selected team reference
      const updated = teamsData.find((t: Team) => t.id === selectedTeamForPlayers.id);
      if (updated) setSelectedTeamForPlayers(updated);
    } catch (error: any) {
      console.error('Error saving player:', error);
      showError(t('admin.error'), t('admin.addPlayerFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    showConfirm(
      'حذف اللاعب',
      `هل أنت متأكد من حذف "${player.name}"؟`,
      async () => {
        setDialogVisible(false);
        try {
          await playerApi.delete(player.id);
          const response = await teamApi.getAllWithPlayers();
          const teamsData = response.data?.data || response.data || [];
          setTeams(Array.isArray(teamsData) ? teamsData : []);
          const updated = teamsData.find((t: Team) => t.id === selectedTeamForPlayers?.id);
          if (updated) setSelectedTeamForPlayers(updated);
        } catch (error) {
          showError(t('admin.error'), t('admin.addPlayerFailed'));
        }
      }
    );
  };

  const handleSaveCoach = async () => {
    if (!selectedTeamForPlayers) return;
    try {
      setSaving(true);
      await teamApi.update(selectedTeamForPlayers.id, { coach: coachName.trim() || null });
      setEditCoachMode(false);
      const response = await teamApi.getAllWithPlayers();
      const teamsData = response.data?.data || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      const updated = teamsData.find((t: Team) => t.id === selectedTeamForPlayers.id);
      if (updated) setSelectedTeamForPlayers(updated);
    } catch (error) {
      showError(t('admin.error'), t('admin.createTeamFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompetitions = async () => {
    if (!selectedTeamForCompetitions) return;

    try {
      setSaving(true);
      
      // Get current competitions
      const currentCompIds = selectedTeamForCompetitions.competitions?.map((tc: any) => tc.competitionId) || [];
      
      // Find competitions to add
      const toAdd = selectedCompetitions.filter(id => !currentCompIds.includes(id));
      
      // Find competitions to remove
      const toRemove = currentCompIds.filter((id: string) => !selectedCompetitions.includes(id));
      
      // Add new competitions
      for (const compId of toAdd) {
        await teamApi.addToCompetition(selectedTeamForCompetitions.id, compId);
      }
      
      // Remove competitions
      for (const compId of toRemove) {
        await teamApi.removeFromCompetition(selectedTeamForCompetitions.id, compId);
      }
      
      setShowCompetitionsModal(false);
      loadTeams();
    } catch (error: any) {
      console.error('Error saving competitions:', error);
      showError(t('admin.error'), t('admin.saveCompFailed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleCompetition = (competitionId: string) => {
    setSelectedCompetitions(prev => 
      prev.includes(competitionId) 
        ? prev.filter(id => id !== competitionId)
        : [...prev, competitionId]
    );
  };

  const handleDeleteTeam = (team: Team) => {
    showConfirm(
      t('admin.deleteTeamTitle'),
      t('admin.deleteTeamConfirm'),
      async () => {
        setDialogVisible(false);
        try {
          await teamApi.delete(team.id);
          loadTeams();
        } catch (error) {
          showError(t('admin.error'), t('admin.deleteTeamFailed'));
        }
      }
    );
  };

  const renderTeamCard = ({ item: team }: { item: Team }) => (
    <View style={[styles.teamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.teamCardHeader, { flexDirection }]}>
        <View style={[styles.teamInfo, { flexDirection }]}>
          <View style={[styles.teamLogoContainer, { backgroundColor: team.primaryColor || colors.accent }]}>
            {team.logoUrl ? (
              <Image source={{ uri: team.logoUrl }} style={styles.teamLogoImage} />
            ) : (
              <Text style={styles.teamLogoText}>{team.shortName?.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.teamDetails}>
            <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 2 }}>
              <Text style={[styles.teamShortName, { color: colors.textSecondary }]}>{team.shortName}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: colors.accent }]}>
                  {TEAM_CATEGORIES.find(c => c.value === team.category)?.label || 'كرة قدم'}
                </Text>
              </View>
            </View>
            {team.coach && (
              <Text style={[styles.teamCoach, { color: colors.textSecondary }]}>
                المدرب: {team.coach}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.teamActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
            onPress={() => openEditTeamModal(team)}
          >
            <Ionicons name="pencil" size={18} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#DC262620' }]}
            onPress={() => handleDeleteTeam(team)}
          >
            <Ionicons name="trash" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Players Section */}
      <View style={styles.playersSection}>
        <View style={[styles.playersSectionHeader, { flexDirection }]}>
          <Text style={[styles.playersSectionTitle, { color: colors.text }]}>
            اللاعبون ({team.players?.length || 0})
          </Text>
          <TouchableOpacity
            style={[styles.addPlayerButton, { backgroundColor: colors.accent }]}
            onPress={() => openPlayersModal(team)}
          >
            <Ionicons name="people" size={16} color="#fff" />
            <Text style={styles.addPlayerButtonText}>تعديل اللاعبين</Text>
          </TouchableOpacity>
        </View>

        {team.players && team.players.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersList}>
            {team.players.slice(0, 5).map((player) => (
              <View key={player.id} style={[styles.playerChip, { backgroundColor: colors.background }]}>
                <View style={[styles.playerNumber, { backgroundColor: team.primaryColor || colors.accent }]}>
                  <Text style={styles.playerNumberText}>{player.shirtNumber}</Text>
                </View>
                <Text style={[styles.playerChipName, { color: colors.text }]} numberOfLines={1}>
                  {player.name}
                </Text>
              </View>
            ))}
            {team.players.length > 5 && (
              <View style={[styles.playerChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.morePlayersText, { color: colors.accent }]}>
                  +{team.players.length - 5}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <Text style={[styles.noPlayersText, { color: colors.textSecondary }]}>
            لا يوجد لاعبون مضافون
          </Text>
        )}
      </View>

      {/* Competitions Section */}
      <View style={styles.competitionsSection}>
        <TouchableOpacity
          style={[styles.manageCompetitionsButton, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}
          onPress={() => openCompetitionsModal(team)}
        >
          <Ionicons name="trophy" size={18} color={colors.accent} />
          <Text style={[styles.manageCompetitionsText, { color: colors.accent }]}>
            إدارة البطولات ({team.competitions?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>
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
      {/* Search & Add Button */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={[styles.addTeamButton, { backgroundColor: colors.accent }]}
          onPress={openAddTeamModal}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addTeamButtonText}>إضافة نادي</Text>
        </TouchableOpacity>
      </View>

      {/* Teams List */}
      <FlatList
        data={teams}
        renderItem={renderTeamCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد أندية
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.accent }]}
              onPress={openAddTeamModal}
            >
              <Text style={styles.emptyButtonText}>إضافة نادي جديد</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Team Modal */}
      <AppModal
        visible={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title={editingTeam ? 'تعديل النادي' : 'إضافة نادي جديد'}
        icon="shield"
        maxHeight="85%"
      >
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Logo Picker */}
              <TouchableOpacity style={styles.logoPicker} onPress={pickImage}>
                {teamLogo ? (
                  <Image source={{ uri: teamLogo }} style={styles.logoPreview} />
                ) : (
                  <View style={[styles.logoPlaceholder, { backgroundColor: teamColor }]}>
                    <Ionicons name="camera" size={32} color="#fff" />
                    <Text style={styles.logoPlaceholderText}>اختر شعار</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Team Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>اسم النادي *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={teamName}
                  onChangeText={setTeamName}
                  placeholder="مثال: نادي الشرطة"
                  placeholderTextColor={colors.textSecondary}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Short Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>الاسم المختصر *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={teamShortName}
                  onChangeText={setTeamShortName}
                  placeholder="مثال: SHR"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={5}
                  autoCapitalize="characters"
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Category Picker */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>الفئة *</Text>
                <View style={styles.categoryPicker}>
                  {TEAM_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryOption,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        teamCategory === cat.value && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setTeamCategory(cat.value)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={teamCategory === cat.value ? '#fff' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryOptionText,
                          { color: teamCategory === cat.value ? '#fff' : colors.text },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Picker */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>لون النادي</Text>
                <View style={styles.colorPicker}>
                  {colorOptions.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        teamColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setTeamColor(color)}
                    >
                      {teamColor === color && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Coach */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>المدرب</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={teamCoach}
                  onChangeText={setTeamCoach}
                  placeholder="اسم المدرب"
                  placeholderTextColor={colors.textSecondary}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Stadium */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>الملعب</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={teamStadium}
                  onChangeText={setTeamStadium}
                  placeholder="اسم الملعب"
                  placeholderTextColor={colors.textSecondary}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>المدينة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={teamCity}
                  onChangeText={setTeamCity}
                  placeholder="بغداد"
                  placeholderTextColor={colors.textSecondary}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveTeam}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingTeam ? 'حفظ التغييرات' : 'إضافة النادي'}
                </Text>
              )}
            </TouchableOpacity>
      </AppModal>

      {/* Players Management Modal */}
      <AppModal
        visible={showPlayersModal}
        onClose={() => { setShowPlayersModal(false); setShowPlayerForm(false); }}
        title={showPlayerForm
          ? (editingPlayer ? 'تعديل اللاعب' : 'إضافة لاعب')
          : `اللاعبون`}
        subtitle={selectedTeamForPlayers?.name}
        icon="people"
        maxHeight="85%"
      >
            {showPlayerForm ? (
              <>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>اسم اللاعب *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      value={playerName}
                      onChangeText={setPlayerName}
                      placeholder="الاسم الكامل للاعب"
                      placeholderTextColor={colors.textSecondary}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>رقم القميص *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      value={playerNumber}
                      onChangeText={setPlayerNumber}
                      placeholder="10"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={2}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>المركز</Text>
                    <View style={styles.positionPicker}>
                      {positions.map((pos) => (
                        <TouchableOpacity
                          key={pos.value}
                          style={[
                            styles.positionOption,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            playerPosition === pos.value && { backgroundColor: colors.accent, borderColor: colors.accent },
                          ]}
                          onPress={() => setPlayerPosition(pos.value)}
                        >
                          <Text style={[styles.positionOptionText, { color: playerPosition === pos.value ? '#fff' : colors.text }]}>
                            {pos.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>الجنسية</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      value={playerNationality}
                      onChangeText={setPlayerNationality}
                      placeholder="العراق"
                      placeholderTextColor={colors.textSecondary}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.accent }]}
                  onPress={handleSavePlayer}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.saveButtonText}>{editingPlayer ? 'حفظ التغييرات' : 'إضافة اللاعب'}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Coach Section */}
                  <View style={[styles.pmCoachSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.pmCoachRow, { flexDirection }]}>
                      <View style={[styles.pmCoachInfo, { flexDirection }]}>
                        <View style={[styles.pmCoachIcon, { backgroundColor: colors.accent + '20' }]}>
                          <Ionicons name="person" size={18} color={colors.accent} />
                        </View>
                        {editCoachMode ? (
                          <TextInput
                            style={[styles.pmCoachInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                            value={coachName}
                            onChangeText={setCoachName}
                            placeholder="اسم المدرب"
                            placeholderTextColor={colors.textSecondary}
                            textAlign={isRTL ? 'right' : 'left'}
                            autoFocus
                          />
                        ) : (
                          <View>
                            <Text style={[styles.pmCoachLabel, { color: colors.textSecondary }]}>المدرب</Text>
                            <Text style={[styles.pmCoachName, { color: colors.text }]}>
                              {selectedTeamForPlayers?.coach || 'غير محدد'}
                            </Text>
                          </View>
                        )}
                      </View>
                      {editCoachMode ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity onPress={() => setEditCoachMode(false)}>
                            <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handleSaveCoach}>
                            {saving ? <ActivityIndicator size="small" color={colors.accent} /> : (
                              <Ionicons name="checkmark-circle" size={28} color={colors.accent} />
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setEditCoachMode(true)}>
                          <Ionicons name="pencil" size={18} color={colors.accent} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Players List */}
                  <View style={[styles.pmPlayersHeader, { flexDirection }]}>
                    <Text style={[styles.pmPlayersTitle, { color: colors.text }]}>
                      اللاعبون ({selectedTeamForPlayers?.players?.length || 0})
                    </Text>
                    <TouchableOpacity
                      style={[styles.pmAddBtn, { backgroundColor: colors.accent }]}
                      onPress={() => openPlayerForm()}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={styles.pmAddBtnText}>إضافة</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedTeamForPlayers?.players && selectedTeamForPlayers.players.length > 0 ? (
                    selectedTeamForPlayers.players.map((player) => (
                      <View key={player.id} style={[styles.pmPlayerRow, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection }]}>
                        <View style={[styles.pmPlayerInfo, { flexDirection }]}>
                          <View style={[styles.pmPlayerNum, { backgroundColor: selectedTeamForPlayers.primaryColor || colors.accent }]}>
                            <Text style={styles.pmPlayerNumText}>{player.shirtNumber}</Text>
                          </View>
                          <View>
                            <Text style={[styles.pmPlayerName, { color: colors.text }]}>{player.name}</Text>
                            <Text style={[styles.pmPlayerMeta, { color: colors.textSecondary }]}>
                              {positions.find(p => p.value === player.position)?.label || player.position || '—'}
                              {player.nationality ? ` • ${player.nationality}` : ''}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={[styles.pmActionBtn, { backgroundColor: colors.accent + '20' }]}
                            onPress={() => openPlayerForm(player)}
                          >
                            <Ionicons name="pencil" size={16} color={colors.accent} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.pmActionBtn, { backgroundColor: '#DC262620' }]}
                            onPress={() => handleDeletePlayer(player)}
                          >
                            <Ionicons name="trash" size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.pmEmpty}>
                      <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
                      <Text style={[styles.pmEmptyText, { color: colors.textSecondary }]}>لا يوجد لاعبون</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
      </AppModal>

      {/* Manage Competitions Modal */}
      <AppModal
        visible={showCompetitionsModal}
        onClose={() => setShowCompetitionsModal(false)}
        title="إدارة البطولات"
        subtitle={selectedTeamForCompetitions?.name}
        icon="trophy"
        maxHeight="70%"
      >
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                اختر البطولات التي يشارك فيها هذا النادي
              </Text>

              {competitions.map((competition) => (
                <TouchableOpacity
                  key={competition.id}
                  style={[
                    styles.competitionItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedCompetitions.includes(competition.id) && { 
                      backgroundColor: colors.accent + '20', 
                      borderColor: colors.accent 
                    },
                  ]}
                  onPress={() => toggleCompetition(competition.id)}
                >
                  <View style={[styles.competitionInfo, { flexDirection }]}>
                    <View style={[styles.competitionIcon, { backgroundColor: colors.accent }]}>
                      <Ionicons name="trophy" size={20} color="#fff" />
                    </View>
                    <View style={styles.competitionDetails}>
                      <Text style={[styles.competitionName, { color: colors.text }]}>
                        {competition.name}
                      </Text>
                      <Text style={[styles.competitionType, { color: colors.textSecondary }]}>
                        {competition.season}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    selectedCompetitions.includes(competition.id) && { 
                      backgroundColor: colors.accent,
                      borderColor: colors.accent 
                    },
                  ]}>
                    {selectedCompetitions.includes(competition.id) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleSaveCompetitions}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
              )}
            </TouchableOpacity>
      </AppModal>

      <AppDialog
        visible={dialogVisible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.showCancel ? t('admin.confirm') : t('admin.ok')}
        cancelText={t('admin.cancel')}
        showCancel={dialogConfig.showCancel}
        onConfirm={dialogConfig.onConfirm || (() => setDialogVisible(false))}
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
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  topBar: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  addTeamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  teamCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  teamCardHeader: {
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  teamLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  teamLogoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamShortName: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  teamCoach: {
    fontSize: 12,
    marginTop: 4,
  },
  teamActions: {
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
  playersSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.md,
  },
  playersSectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  playersSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  addPlayerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playersList: {
    flexDirection: 'row',
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.sm,
    borderRadius: RADIUS.md,
    marginRight: SPACING.xs,
    overflow: 'hidden',
  },
  playerNumber: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  playerNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerChipName: {
    fontSize: 12,
    maxWidth: 80,
  },
  morePlayersText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: SPACING.sm,
  },
  noPlayersText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.sm,
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
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  logoPicker: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
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
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  positionPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  positionOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  positionOptionText: {
    fontSize: 14,
    fontWeight: '500',
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
  competitionsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.md,
  },
  manageCompetitionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  manageCompetitionsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  competitionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  competitionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  competitionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  competitionDetails: {
    flex: 1,
  },
  competitionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  competitionType: {
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
  // Players Management Modal styles
  pmCoachSection: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  pmCoachRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pmCoachInfo: {
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  pmCoachIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmCoachLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  pmCoachName: {
    fontSize: 15,
    fontWeight: '600',
  },
  pmCoachInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    fontSize: 14,
  },
  pmPlayersHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  pmPlayersTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pmAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  pmAddBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  pmPlayerRow: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pmPlayerInfo: {
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  pmPlayerNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmPlayerNumText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  pmPlayerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pmPlayerMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  pmActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  pmEmptyText: {
    fontSize: 14,
  },
});
