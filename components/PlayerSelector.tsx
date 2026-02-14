import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FONTS } from '@/constants/Theme';
import { Team, Player } from '@/types';

interface PlayerSelectorProps {
  homeTeam: Team;
  awayTeam: Team;
  selectedTeamId: string | null;
  onSelect: (player: Player) => void;
  disabledPlayerIds?: Set<string>;
}

export default function PlayerSelector({
  homeTeam,
  awayTeam,
  selectedTeamId,
  onSelect,
  disabledPlayerIds,
}: PlayerSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
      fontFamily: FONTS.regular,
    },
    teamTabTextActive: {
      color: colors.accent,
      fontWeight: '600',
      fontFamily: FONTS.semiBold,
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
      fontFamily: FONTS.regular,
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
      fontFamily: FONTS.bold,
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontFamily: FONTS.semiBold,
    },
    playerPosition: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: FONTS.regular,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontFamily: FONTS.regular,
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
          filteredPlayers.map((player) => {
            const isDisabled = disabledPlayerIds?.has(player.id) ?? false;
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerItem, isDisabled && { opacity: 0.35 }]}
                onPress={() => !isDisabled && onSelect(player)}
                disabled={isDisabled}
                activeOpacity={isDisabled ? 1 : 0.7}
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
                {isDisabled && (
                  <View style={{ marginLeft: 8 }}>
                    <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>🟥</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
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
