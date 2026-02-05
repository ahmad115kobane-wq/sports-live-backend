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
  Image,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRTL } from '@/contexts/RTLContext';
import { teamApi, competitionApi } from '@/services/api';

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
  logoUrl?: string;
  primaryColor?: string;
  coach?: string;
  stadium?: string;
  city?: string;
  country?: string;
  players?: Player[];
}

export default function TeamsManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { t, isRTL, flexDirection } = useRTL();
  const { user, isAuthenticated } = useAuthStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showCompetitionsModal, setShowCompetitionsModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState<Team | null>(null);
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

  // Player form
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [playerNationality, setPlayerNationality] = useState('العراق');

  // Colors palette
  const colorOptions = [
    '#1E3A8A', '#166534', '#DC2626', '#7C3AED', 
    '#EA580C', '#0891B2', '#4F46E5', '#BE185D',
    '#059669', '#D97706', '#6366F1', '#EC4899'
  ];

  // Positions
  const positions = [
    { value: 'goalkeeper', label: 'حارس مرمى' },
    { value: 'defender', label: 'مدافع' },
    { value: 'midfielder', label: 'وسط' },
    { value: 'forward', label: 'مهاجم' },
  ];

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      Alert.alert('غير مصرح', 'يجب أن تكون مديراً للوصول إلى هذه الصفحة', [
        { text: 'حسناً', onPress: () => router.back() }
      ]);
      return;
    }
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamApi.getAll();
      const teamsData = response.data?.data || response.data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('خطأ', 'فشل في تحميل الفرق');
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
    setShowTeamModal(true);
  };

  const openAddPlayerModal = (team: Team) => {
    setSelectedTeamForPlayer(team);
    setPlayerName('');
    setPlayerNumber('');
    setPlayerPosition('midfielder');
    setPlayerNationality('العراق');
    setShowPlayerModal(true);
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
      Alert.alert('خطأ', 'فشل في تحميل البطولات');
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
      Alert.alert('خطأ', 'يرجى إدخال اسم النادي والاسم المختصر');
      return;
    }

    try {
      setSaving(true);
      const teamData = {
        name: teamName.trim(),
        shortName: teamShortName.trim().toUpperCase(),
        logoUrl: teamLogo || undefined,
        primaryColor: teamColor,
        coach: teamCoach.trim() || undefined,
        stadium: teamStadium.trim() || undefined,
        city: teamCity.trim() || undefined,
        country: 'العراق',
      };

      if (editingTeam) {
        await teamApi.update(editingTeam.id, teamData);
        Alert.alert('نجاح', 'تم تحديث النادي بنجاح');
      } else {
        await teamApi.create(teamData);
        Alert.alert('نجاح', 'تم إنشاء النادي بنجاح');
      }

      setShowTeamModal(false);
      loadTeams();
    } catch (error: any) {
      console.error('Error saving team:', error);
      Alert.alert('خطأ', error.response?.data?.message || 'فشل في حفظ النادي');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!playerName.trim() || !playerNumber) {
      Alert.alert('خطأ', 'يرجى إدخال اسم اللاعب ورقمه');
      return;
    }

    if (!selectedTeamForPlayer) return;

    try {
      setSaving(true);
      const playerData = {
        name: playerName.trim(),
        shirtNumber: parseInt(playerNumber),
        position: playerPosition || 'midfielder',
        nationality: playerNationality.trim() || 'العراق',
      };

      await teamApi.addPlayer(selectedTeamForPlayer.id, playerData);
      Alert.alert('نجاح', 'تم إضافة اللاعب بنجاح');
      setShowPlayerModal(false);
      loadTeams();
    } catch (error: any) {
      console.error('Error adding player:', error);
      Alert.alert('خطأ', error.response?.data?.message || 'فشل في إضافة اللاعب');
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
      
      Alert.alert('نجاح', 'تم تحديث البطولات بنجاح');
      setShowCompetitionsModal(false);
      loadTeams();
    } catch (error: any) {
      console.error('Error saving competitions:', error);
      Alert.alert('خطأ', error.response?.data?.message || 'فشل في حفظ البطولات');
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
    Alert.alert(
      'حذف النادي',
      `هل أنت متأكد من حذف "${team.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamApi.delete(team.id);
              Alert.alert('نجاح', 'تم حذف النادي');
              loadTeams();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف النادي');
            }
          },
        },
      ]
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
            <Text style={[styles.teamShortName, { color: colors.textSecondary }]}>{team.shortName}</Text>
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
            onPress={() => openAddPlayerModal(team)}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addPlayerButtonText}>إضافة لاعب</Text>
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
      <Modal
        visible={showTeamModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTeamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingTeam ? 'تعديل النادي' : 'إضافة نادي جديد'}
              </Text>
              <TouchableOpacity onPress={() => setShowTeamModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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
          </View>
        </View>
      </Modal>

      {/* Add Player Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '70%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                إضافة لاعب - {selectedTeamForPlayer?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Player Name */}
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

              {/* Player Number */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>رقم القميص *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={playerNumber}
                  onChangeText={setPlayerNumber}
                  placeholder="مثال: 10"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={2}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              {/* Position */}
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
                      <Text
                        style={[
                          styles.positionOptionText,
                          { color: playerPosition === pos.value ? '#fff' : colors.text },
                        ]}
                      >
                        {pos.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Nationality */}
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

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleAddPlayer}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>إضافة اللاعب</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manage Competitions Modal */}
      <Modal
        visible={showCompetitionsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompetitionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: '70%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                إدارة البطولات - {selectedTeamForCompetitions?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowCompetitionsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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
});
