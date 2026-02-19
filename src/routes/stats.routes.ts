import { Router } from 'express';
import { authenticate, isOperator, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// ---- In-memory possession tracking ----
// Stores: { matchId: { currentTeam: 'home'|'away'|null, lastSwitch: timestamp, homeSeconds: number, awaySeconds: number } }
const possessionStore: Record<string, {
  currentTeam: 'home' | 'away' | null;
  lastSwitch: number;
  homeSeconds: number;
  awaySeconds: number;
}> = {};

function getPossessionData(matchId: string) {
  if (!possessionStore[matchId]) {
    possessionStore[matchId] = { currentTeam: null, lastSwitch: Date.now(), homeSeconds: 0, awaySeconds: 0 };
  }
  const data = possessionStore[matchId];
  // Calculate current elapsed time for active team
  let homeTotal = data.homeSeconds;
  let awayTotal = data.awaySeconds;
  if (data.currentTeam) {
    const elapsed = (Date.now() - data.lastSwitch) / 1000;
    if (data.currentTeam === 'home') homeTotal += elapsed;
    else awayTotal += elapsed;
  }
  const total = homeTotal + awayTotal;
  if (total === 0) return { homePossession: 50, awayPossession: 50, currentTeam: data.currentTeam };
  const homePct = Math.round((homeTotal / total) * 100);
  return { homePossession: homePct, awayPossession: 100 - homePct, currentTeam: data.currentTeam };
}

// Get match statistics - computed from events in real-time
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    // Get match with teams to know homeTeamId/awayTeamId
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Get all events for this match
    const events = await prisma.event.findMany({
      where: { matchId },
      select: { type: true, teamId: true },
    });

    // Compute stats from events
    let homeCorners = 0, awayCorners = 0;
    let homeFouls = 0, awayFouls = 0;
    let homeYellowCards = 0, awayYellowCards = 0;
    let homeRedCards = 0, awayRedCards = 0;
    let homeOffsides = 0, awayOffsides = 0;
    let homeGoals = 0, awayGoals = 0;
    let homePenalties = 0, awayPenalties = 0;
    let homeSubstitutions = 0, awaySubstitutions = 0;
    let homeInjuries = 0, awayInjuries = 0;
    let homeShotsOnTarget = 0, awayShotsOnTarget = 0;
    let homeShotsOffTarget = 0, awayShotsOffTarget = 0;
    let homeThrowIns = 0, awayThrowIns = 0;

    for (const event of events) {
      const isHome = event.teamId === match.homeTeamId;
      switch (event.type) {
        case 'corner':
          if (isHome) homeCorners++; else awayCorners++;
          break;
        case 'foul':
          if (isHome) homeFouls++; else awayFouls++;
          break;
        case 'yellow_card':
          if (isHome) homeYellowCards++; else awayYellowCards++;
          break;
        case 'red_card':
          if (isHome) homeRedCards++; else awayRedCards++;
          break;
        case 'offside':
          if (isHome) homeOffsides++; else awayOffsides++;
          break;
        case 'goal':
          if (isHome) homeGoals++; else awayGoals++;
          break;
        case 'penalty':
          if (isHome) homePenalties++; else awayPenalties++;
          break;
        case 'substitution':
          if (isHome) homeSubstitutions++; else awaySubstitutions++;
          break;
        case 'injury':
          if (isHome) homeInjuries++; else awayInjuries++;
          break;
        case 'shot_on_target':
          if (isHome) homeShotsOnTarget++; else awayShotsOnTarget++;
          break;
        case 'shot_off_target':
          if (isHome) homeShotsOffTarget++; else awayShotsOffTarget++;
          break;
        case 'throw_in':
          if (isHome) homeThrowIns++; else awayThrowIns++;
          break;
      }
    }

    // Get possession from in-memory store
    const possession = getPossessionData(matchId);

    // Also check if there are manually stored stats (for shots, passes, etc.)
    const manualStats = await prisma.matchStats.findUnique({ where: { matchId } });

    res.json({
      success: true,
      data: {
        matchId,
        // Possession from tracking
        homePossession: possession.homePossession,
        awayPossession: possession.awayPossession,
        possessionTeam: possession.currentTeam,
        // From events
        homeCorners,
        awayCorners,
        homeFouls,
        awayFouls,
        homeYellowCards,
        awayYellowCards,
        homeRedCards,
        awayRedCards,
        homeOffsides,
        awayOffsides,
        homeGoals,
        awayGoals,
        homePenalties,
        awayPenalties,
        homeSubstitutions,
        awaySubstitutions,
        homeInjuries,
        awayInjuries,
        // Shots computed from events (shot_on_target + shot_off_target), fallback to manual
        homeShots: (homeShotsOnTarget + homeShotsOffTarget) || manualStats?.homeShots || 0,
        awayShots: (awayShotsOnTarget + awayShotsOffTarget) || manualStats?.awayShots || 0,
        homeShotsOnTarget: homeShotsOnTarget || manualStats?.homeShotsOnTarget || 0,
        awayShotsOnTarget: awayShotsOnTarget || manualStats?.awayShotsOnTarget || 0,
        homeThrowIns,
        awayThrowIns,
        homePasses: manualStats?.homePasses || 0,
        awayPasses: manualStats?.awayPasses || 0,
        homePassAccuracy: manualStats?.homePassAccuracy || 0,
        awayPassAccuracy: manualStats?.awayPassAccuracy || 0,
        homeSaves: manualStats?.homeSaves || 0,
        awaySaves: manualStats?.awaySaves || 0,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get match statistics',
    });
  }
});

// Toggle possession - operator presses button for team that has the ball
router.post('/match/:matchId/possession', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { team } = req.body; // 'home' | 'away'

    if (!['home', 'away'].includes(team)) {
      return res.status(400).json({ success: false, message: 'Team must be "home" or "away"' });
    }

    if (!possessionStore[matchId]) {
      possessionStore[matchId] = { currentTeam: null, lastSwitch: Date.now(), homeSeconds: 0, awaySeconds: 0 };
    }

    const data = possessionStore[matchId];

    // If same team already active, ignore
    if (data.currentTeam === team) {
      const possession = getPossessionData(matchId);
      return res.json({ success: true, data: possession });
    }

    // Calculate elapsed time for previous team
    if (data.currentTeam) {
      const elapsed = (Date.now() - data.lastSwitch) / 1000;
      if (data.currentTeam === 'home') data.homeSeconds += elapsed;
      else data.awaySeconds += elapsed;
    }

    // Switch to new team
    data.currentTeam = team as 'home' | 'away';
    data.lastSwitch = Date.now();

    const possession = getPossessionData(matchId);

    // Emit via socket
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:possession', {
      matchId,
      ...possession,
    });

    res.json({ success: true, data: possession });
  } catch (error) {
    console.error('Possession toggle error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle possession' });
  }
});

// Reset possession tracking for a match
router.post('/match/:matchId/possession/reset', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    possessionStore[matchId] = { currentTeam: null, lastSwitch: Date.now(), homeSeconds: 0, awaySeconds: 0 };

    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:possession', {
      matchId,
      homePossession: 50,
      awayPossession: 50,
      currentTeam: null,
    });

    res.json({ success: true, data: { homePossession: 50, awayPossession: 50, currentTeam: null } });
  } catch (error) {
    console.error('Possession reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset possession' });
  }
});

// Create or update match statistics
router.put('/match/:matchId', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const statsData = req.body;

    // Validate possession adds up to 100
    if (statsData.homePossession && statsData.awayPossession) {
      if (statsData.homePossession + statsData.awayPossession !== 100) {
        return res.status(400).json({
          success: false,
          message: 'Possession must add up to 100%',
        });
      }
    }

    const stats = await prisma.matchStats.upsert({
      where: { matchId },
      create: {
        matchId,
        ...statsData,
      },
      update: statsData,
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:stats-updated', {
      matchId,
      stats,
    });

    res.json({
      success: true,
      message: 'Statistics updated',
      data: stats,
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update statistics',
    });
  }
});

// Update single stat
router.patch('/match/:matchId/:statType', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId, statType } = req.params;
    const { team, value, action } = req.body; // team: 'home' | 'away'

    const validStats = [
      'possession', 'shots', 'shotsOnTarget', 'corners', 'fouls',
      'yellowCards', 'redCards', 'offsides', 'passes', 'passAccuracy', 'saves'
    ];

    if (!validStats.includes(statType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stat type',
      });
    }

    if (!['home', 'away'].includes(team)) {
      return res.status(400).json({
        success: false,
        message: 'Team must be "home" or "away"',
      });
    }

    const fieldName = `${team}${statType.charAt(0).toUpperCase() + statType.slice(1)}`;

    // Get or create stats
    let stats = await prisma.matchStats.findUnique({
      where: { matchId },
    });

    if (!stats) {
      stats = await prisma.matchStats.create({
        data: { matchId },
      });
    }

    const currentValue = (stats as any)[fieldName] || 0;
    let newValue: number;

    if (value !== undefined) {
      newValue = value;
    } else if (action === 'increment') {
      newValue = currentValue + 1;
    } else if (action === 'decrement') {
      newValue = Math.max(0, currentValue - 1);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Must provide value or action (increment/decrement)',
      });
    }

    // Special handling for possession (auto-update opposite team)
    const updateData: any = { [fieldName]: newValue };
    if (statType === 'possession') {
      const oppositeTeam = team === 'home' ? 'away' : 'home';
      const oppositeField = `${oppositeTeam}Possession`;
      updateData[oppositeField] = 100 - newValue;
    }

    const updatedStats = await prisma.matchStats.update({
      where: { matchId },
      data: updateData,
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:stat-update', {
      matchId,
      statType,
      team,
      value: newValue,
      stats: updatedStats,
    });

    res.json({
      success: true,
      data: updatedStats,
    });
  } catch (error) {
    console.error('Update stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stat',
    });
  }
});

// Reset all stats for a match
router.delete('/match/:matchId', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    await prisma.matchStats.delete({
      where: { matchId },
    }).catch(() => {
      // Ignore if stats don't exist
    });

    res.json({
      success: true,
      message: 'Statistics reset',
    });
  } catch (error) {
    console.error('Reset stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset statistics',
    });
  }
});

// Get comparison stats for head-to-head
router.get('/head-to-head/:teamAId/:teamBId', async (req, res) => {
  try {
    const { teamAId, teamBId } = req.params;
    const { limit = 10 } = req.query;

    // Get all finished matches between teams with stats
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: teamAId, awayTeamId: teamBId },
          { homeTeamId: teamBId, awayTeamId: teamAId },
        ],
        status: 'finished',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        stats: true,
      },
      orderBy: { startTime: 'desc' },
      take: Number(limit),
    });

    // Calculate aggregate stats
    let teamAWins = 0, teamBWins = 0, draws = 0;
    let teamAGoals = 0, teamBGoals = 0;
    let teamAAvgPossession = 0, teamBAvgPossession = 0;
    let teamAAvgShots = 0, teamBAvgShots = 0;
    let teamATotalCards = 0, teamBTotalCards = 0;
    let matchesWithStats = 0;

    matches.forEach(match => {
      const isTeamAHome = match.homeTeamId === teamAId;
      const teamAScore = isTeamAHome ? match.homeScore : match.awayScore;
      const teamBScore = isTeamAHome ? match.awayScore : match.homeScore;

      teamAGoals += teamAScore;
      teamBGoals += teamBScore;

      if (teamAScore > teamBScore) teamAWins++;
      else if (teamBScore > teamAScore) teamBWins++;
      else draws++;

      if (match.stats) {
        matchesWithStats++;
        const stats = match.stats;
        
        if (isTeamAHome) {
          teamAAvgPossession += stats.homePossession || 0;
          teamBAvgPossession += stats.awayPossession || 0;
          teamAAvgShots += stats.homeShots || 0;
          teamBAvgShots += stats.awayShots || 0;
          teamATotalCards += (stats.homeYellowCards || 0) + (stats.homeRedCards || 0);
          teamBTotalCards += (stats.awayYellowCards || 0) + (stats.awayRedCards || 0);
        } else {
          teamAAvgPossession += stats.awayPossession || 0;
          teamBAvgPossession += stats.homePossession || 0;
          teamAAvgShots += stats.awayShots || 0;
          teamBAvgShots += stats.homeShots || 0;
          teamATotalCards += (stats.awayYellowCards || 0) + (stats.awayRedCards || 0);
          teamBTotalCards += (stats.homeYellowCards || 0) + (stats.homeRedCards || 0);
        }
      }
    });

    // Calculate averages
    if (matchesWithStats > 0) {
      teamAAvgPossession = Math.round(teamAAvgPossession / matchesWithStats);
      teamBAvgPossession = Math.round(teamBAvgPossession / matchesWithStats);
      teamAAvgShots = Math.round((teamAAvgShots / matchesWithStats) * 10) / 10;
      teamBAvgShots = Math.round((teamBAvgShots / matchesWithStats) * 10) / 10;
    }

    // Get team info
    const [teamA, teamB] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamAId } }),
      prisma.team.findUnique({ where: { id: teamBId } }),
    ]);

    res.json({
      success: true,
      data: {
        teamA: {
          ...teamA,
          wins: teamAWins,
          goals: teamAGoals,
          avgPossession: teamAAvgPossession,
          avgShots: teamAAvgShots,
          totalCards: teamATotalCards,
        },
        teamB: {
          ...teamB,
          wins: teamBWins,
          goals: teamBGoals,
          avgPossession: teamBAvgPossession,
          avgShots: teamBAvgShots,
          totalCards: teamBTotalCards,
        },
        totalMatches: matches.length,
        draws,
        recentMatches: matches.slice(0, 5).map(m => ({
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          date: m.startTime,
          competition: m.competition,
        })),
      },
    });
  } catch (error) {
    console.error('Get H2H stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get head-to-head statistics',
    });
  }
});

// Get team form (last N matches)
router.get('/team/:teamId/form', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 5 } = req.query;

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'finished',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
      orderBy: { startTime: 'desc' },
      take: Number(limit),
    });

    const form = matches.map(match => {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;
      
      let result: 'W' | 'D' | 'L';
      if (teamScore > opponentScore) result = 'W';
      else if (teamScore < opponentScore) result = 'L';
      else result = 'D';

      return {
        matchId: match.id,
        result,
        score: `${teamScore}-${opponentScore}`,
        opponent: isHome ? match.awayTeam : match.homeTeam,
        date: match.startTime,
        isHome,
      };
    });

    // Calculate points
    const wins = form.filter(f => f.result === 'W').length;
    const draws = form.filter(f => f.result === 'D').length;
    const losses = form.filter(f => f.result === 'L').length;
    const points = wins * 3 + draws;

    res.json({
      success: true,
      data: {
        form,
        summary: {
          wins,
          draws,
          losses,
          points,
          formString: form.map(f => f.result).join(''),
        },
      },
    });
  } catch (error) {
    console.error('Get team form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team form',
    });
  }
});

export default router;
