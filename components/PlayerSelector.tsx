import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Team, Player } from '@/types';

interface PlayerSelectorProps {
  homeTeam: Team;
  awayTeam: Team;
  selectedTeamId: string | null;
  onSelect: (player: Player) => void;
}

export default function PlayerSelector({
  homeTeam,
  awayTeam,
  selectedTeamId,
  onSelect,
}: PlayerSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [activeTeam, setActiveTeam] = useState<string>(selectedTeamId || homeTeam.id);
  const [search, setSearch] = useState('');

  const currentTeam = activeTeam === homeTeam.id ? homeTeam : awayTeam;
  const players = currentTeam.players || [];

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    teamTabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    teamTab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
    },
    teamTabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    teamTabText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    teamTabTextActive: {
      color: colors.accent,
      fontWeight: '600',
    },
    searchContainer: {
      padding: 12,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    playerList: {
      padding: 12,
    },
    playerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
    },
    playerNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    playerNumberText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.accent,
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    playerPosition: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      {/* Team Tabs */}
      <View style={styles.teamTabs}>
        <TouchableOpacity
          style={[styles.teamTab, activeTeam === homeTeam.id && styles.teamTabActive]}
          onPress={() => setActiveTeam(homeTeam.id)}
        >
          <Text
            style={[
              styles.teamTabText,
              activeTeam === homeTeam.id && styles.teamTabTextActive,
            ]}
          >
            {homeTeam.shortName || homeTeam.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.teamTab, activeTeam === awayTeam.id && styles.teamTabActive]}
          onPress={() => setActiveTeam(awayTeam.id)}
        >
          <Text
            style={[
              styles.teamTabText,
              activeTeam === awayTeam.id && styles.teamTabTextActive,
            ]}
          >
            {awayTeam.shortName || awayTeam.name}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search player..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Player List */}
      <ScrollView style={styles.playerList}>
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={styles.playerItem}
              onPress={() => onSelect(player)}
            >
              <View style={styles.playerNumber}>
                <Text style={styles.playerNumberText}>
                  {player.shirtNumber || '-'}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerPosition}>
                  {player.position || 'Player'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search ? 'No players found' : 'No players available'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
