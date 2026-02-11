import { Router } from 'express';
import { authenticate, isAdmin, isOperator, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// Helper: compute live minute from timestamps
function computeCurrentMinute(match: any): number | null {
  if (!match) return null;
  const now = Date.now();

  if (match.status === 'live') {
    if (match.secondHalfStartedAt) {
      const elapsed = Math.floor((now - new Date(match.secondHalfStartedAt).getTime()) / 60000);
      return Math.max(46, 46 + elapsed);
    }
    if (match.liveStartedAt) {
      const elapsed = Math.floor((now - new Date(match.liveStartedAt).getTime()) / 60000);
      return Math.max(1, 1 + elapsed);
    }
  }

  if (match.status === 'extra_time') {
    const base = match.currentMinute || 91;
    const elapsed = Math.floor((now - new Date(match.updatedAt).getTime()) / 60000);
    return Math.max(base, base + elapsed);
  }

  return match.currentMinute;
}

// Match status enum (matching Prisma schema)
const MatchStatus = {
  scheduled: 'scheduled',
  live: 'live',
  halftime: 'halftime',
  finished: 'finished',
} as const;
type MatchStatusType = typeof MatchStatus[keyof typeof MatchStatus];

// Available formations
const FORMATIONS = [
  '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3',
  '4-5-1', '5-3-2', '5-4-1', '4-1-4-1', '4-4-1-1',
] as const;

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { status, date, featured, days } = req.query;

    const where: any = {};
    
    if (status) {
      where.status = status as string;
    }
    
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    } else {
      // Default: Today and 7 days ahead
      const futureDays = parseInt(days as string) || 7;
      const from = new Date();
      from.setHours(0, 0, 0, 0); // Start of today
      const to = new Date();
      to.setDate(to.getDate() + futureDays);
      to.setHours(23, 59, 59, 999);
      where.startTime = { gte: from, lte: to };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: { select: { id: true, name: true, nameAr: true, nameKu: true, shortName: true, logo: true, category: true } },
        awayTeam: { select: { id: true, name: true, nameAr: true, nameKu: true, shortName: true, logo: true, category: true } },
        competition: { select: { id: true, name: true, nameAr: true, nameKu: true, shortName: true, logo: true, icon: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Compute live minutes for active matches
    const enrichedMatches = matches.map((m: any) => {
      const liveMinute = computeCurrentMinute(m);
      return liveMinute != null ? { ...m, currentMinute: liveMinute } : m;
    });

    res.json({
      success: true,
      data: enrichedMatches,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get matches',
    });
  }
});

// Get live matches
router.get('/live', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: {
          in: [MatchStatus.live, MatchStatus.halftime],
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        events: {
          orderBy: { minute: 'desc' },
          take: 5,
          include: {
            player: true,
            team: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Compute live minutes
    const enrichedMatches = matches.map((m: any) => {
      const liveMinute = computeCurrentMinute(m);
      return liveMinute != null ? { ...m, currentMinute: liveMinute } : m;
    });

    res.json({
      success: true,
      data: enrichedMatches,
    });
  } catch (error) {
    console.error('Get live matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get live matches',
    });
  }
});

// Get featured match
router.get('/featured', async (req, res) => {
  try {
    const match = await prisma.match.findFirst({
      where: { isFeatured: true, status: { not: 'finished' } },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        events: {
          orderBy: { minute: 'desc' },
          include: {
            player: true,
            secondaryPlayer: true,
            team: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Get featured match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured match',
    });
  }
});

// Get match by ID with events
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: {
          include: { players: true },
        },
        awayTeam: {
          include: { players: true },
        },
        competition: true,
        events: {
          orderBy: [{ minute: 'desc' }, { createdAt: 'desc' }],
          include: {
            player: true,
            secondaryPlayer: true,
            team: true,
          },
        },
        lineups: {
          include: {
            team: true,
            players: {
              include: {
                player: true,
              },
              orderBy: { isStarter: 'desc' },
            },
          },
        },
        stats: true,
      },
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // Compute live minute dynamically
    const liveMinute = computeCurrentMinute(match);

    res.json({
      success: true,
      data: {
        ...match,
        currentMinute: liveMinute ?? match.currentMinute,
      },
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get match',
    });
  }
});

// Get match events
router.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;

    const events = await prisma.event.findMany({
      where: { matchId: id },
      include: {
        player: true,
        secondaryPlayer: true,
        team: true,
      },
      orderBy: [{ minute: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
    });
  }
});

// Create match (Admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const {
      competitionId,
      homeTeamId,
      awayTeamId,
      startTime,
      venue,
      isFeatured,
      referee,
      matchday,
      season,
      operatorId,
    } = req.body;

    const match = await prisma.match.create({
      data: {
        competitionId,
        homeTeamId,
        awayTeamId,
        startTime: new Date(startTime),
        venue,
        isFeatured: isFeatured || false,
        referee,
        matchday,
        season,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    // If operator specified, assign them to the match
    if (operatorId) {
      await prisma.matchOperator.create({
        data: {
          matchId: match.id,
          operatorId,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Match created',
      data: match,
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create match',
    });
  }
});

// Update match (Admin only)
router.put('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      competitionId,
      homeTeamId,
      awayTeamId,
      startTime,
      venue,
      isFeatured,
      referee,
      matchday,
      season,
      attendance,
      weather,
    } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        competitionId,
        homeTeamId,
        awayTeamId,
        startTime: startTime ? new Date(startTime) : undefined,
        venue,
        isFeatured,
        referee,
        matchday,
        season,
        attendance,
        weather,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    res.json({
      success: true,
      message: 'Match updated',
      data: match,
    });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update match',
    });
  }
});

// Update match status
router.patch('/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentMinute } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        status,
        currentMinute,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${id}`).emit('match:status', {
      matchId: id,
      status,
      currentMinute,
    });

    res.json({
      success: true,
      message: 'Match status updated',
      data: match,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
    });
  }
});

// Delete match (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.match.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Match deleted',
    });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete match',
    });
  }
});

// ==================== LINEUP MANAGEMENT ====================

// Get available formations (optionally filtered by category)
router.get('/formations/list', async (req, res) => {
  const { category } = req.query;
  if (category && typeof category === 'string') {
    const { getCategoryRules } = require('../utils/categoryRules');
    const rules = getCategoryRules(category);
    return res.json({
      success: true,
      data: rules.formations,
      category: rules.category,
      maxStarters: rules.maxStarters,
      maxSubs: rules.maxSubs,
      fieldType: rules.fieldType,
    });
  }
  res.json({
    success: true,
    data: FORMATIONS,
  });
});

// Get match lineup
router.get('/:id/lineup', async (req, res) => {
  try {
    const { id } = req.params;

    const lineups = await prisma.matchLineup.findMany({
      where: { matchId: id },
      include: {
        team: true,
        players: {
          include: {
            player: true,
          },
          orderBy: [
            { isStarter: 'desc' },
            { position: 'asc' },
          ],
        },
      },
    });

    res.json({
      success: true,
      data: lineups,
    });
  } catch (error) {
    console.error('Get lineup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lineup',
    });
  }
});

// Create/Update lineup for a team (Admin/Operator)
router.post('/:matchId/lineup/:teamId', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId, teamId } = req.params;
    const { formation, coach, players } = req.body;
    // players: [{ playerId, position, positionX, positionY, isStarter, isCaptain }]

    // Validate starters count based on team category
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { category: true } });
    if (team) {
      const { getCategoryRules } = require('../utils/categoryRules');
      const rules = getCategoryRules(team.category);
      const starterCount = players.filter((p: any) => p.isStarter).length;
      if (starterCount > rules.maxStarters) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${rules.maxStarters} starters allowed for ${team.category}`,
        });
      }
    }

    // Check if lineup exists
    const existingLineup = await prisma.matchLineup.findFirst({
      where: { matchId, teamId },
    });

    let lineup;

    if (existingLineup) {
      // Delete existing players
      await prisma.lineupPlayer.deleteMany({
        where: { lineupId: existingLineup.id },
      });

      // Update lineup
      lineup = await prisma.matchLineup.update({
        where: { id: existingLineup.id },
        data: {
          formation,
          coach,
          players: {
            create: players.map((p: any) => ({
              playerId: p.playerId,
              position: p.position,
              positionX: p.positionX,
              positionY: p.positionY,
              isStarter: p.isStarter ?? true,
              isCaptain: p.isCaptain ?? false,
            })),
          },
        },
        include: {
          team: true,
          players: {
            include: { player: true },
          },
        },
      });
    } else {
      // Create new lineup
      lineup = await prisma.matchLineup.create({
        data: {
          matchId,
          teamId,
          formation,
          coach,
          players: {
            create: players.map((p: any) => ({
              playerId: p.playerId,
              position: p.position,
              positionX: p.positionX,
              positionY: p.positionY,
              isStarter: p.isStarter ?? true,
              isCaptain: p.isCaptain ?? false,
            })),
          },
        },
        include: {
          team: true,
          players: {
            include: { player: true },
          },
        },
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:lineup', {
      matchId,
      teamId,
      lineup,
    });

    res.json({
      success: true,
      message: 'Lineup saved successfully',
      data: lineup,
    });
  } catch (error) {
    console.error('Save lineup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save lineup',
    });
  }
});

// Update player position in lineup
router.patch('/:matchId/lineup/player/:lineupPlayerId', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId, lineupPlayerId } = req.params;
    const { position, positionX, positionY, isStarter, isCaptain } = req.body;

    const lineupPlayer = await prisma.lineupPlayer.update({
      where: { id: lineupPlayerId },
      data: {
        position,
        positionX,
        positionY,
        isStarter,
        isCaptain,
      },
      include: {
        player: true,
      },
    });

    res.json({
      success: true,
      data: lineupPlayer,
    });
  } catch (error) {
    console.error('Update lineup player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lineup player',
    });
  }
});

// Make substitution
router.post('/:matchId/substitution', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { playerOutId, playerInId, minute: clientMinute, teamId } = req.body;

    // Server-authoritative minute: compute from match timestamps
    const matchForMinute = await prisma.match.findUnique({
      where: { id: matchId },
      select: { status: true, liveStartedAt: true, secondHalfStartedAt: true, currentMinute: true, updatedAt: true },
    });
    const serverMinute = matchForMinute ? (computeCurrentMinute(matchForMinute) ?? clientMinute) : (clientMinute || 1);

    // Get lineup
    const lineup = await prisma.matchLineup.findFirst({
      where: { matchId, teamId },
      include: { players: true },
    });

    if (!lineup) {
      return res.status(404).json({
        success: false,
        message: 'Lineup not found',
      });
    }

    // Update players - player out becomes sub, player in becomes starter
    await prisma.lineupPlayer.updateMany({
      where: { lineupId: lineup.id, playerId: playerOutId },
      data: { isStarter: false },
    });

    await prisma.lineupPlayer.updateMany({
      where: { lineupId: lineup.id, playerId: playerInId },
      data: { isStarter: true },
    });

    // Create substitution event
    const event = await prisma.event.create({
      data: {
        matchId,
        teamId,
        playerId: playerInId,
        secondaryPlayerId: playerOutId,
        type: 'substitution',
        minute: serverMinute,
        createdById: req.user!.id,
      },
      include: {
        player: true,
        secondaryPlayer: true,
        team: true,
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:event', event);
    io.to(`match:${matchId}`).emit('match:substitution', {
      matchId,
      teamId,
      playerOut: playerOutId,
      playerIn: playerInId,
      minute: serverMinute,
    });

    res.json({
      success: true,
      message: 'Substitution made',
      data: event,
    });
  } catch (error) {
    console.error('Substitution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make substitution',
    });
  }
});

// ==================== MATCH STATISTICS ====================

// Get match stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await prisma.matchStats.findUnique({
      where: { matchId: id },
    });

    if (!stats) {
      // Return default stats
      return res.json({
        success: true,
        data: {
          matchId: id,
          homePossession: 50,
          awayPossession: 50,
          homeShots: 0,
          awayShots: 0,
          homeShotsOnTarget: 0,
          awayShotsOnTarget: 0,
          homeCorners: 0,
          awayCorners: 0,
          homeFouls: 0,
          awayFouls: 0,
          homeYellowCards: 0,
          awayYellowCards: 0,
          homeRedCards: 0,
          awayRedCards: 0,
          homeOffsides: 0,
          awayOffsides: 0,
          homePasses: 0,
          awayPasses: 0,
          homePassAccuracy: 0,
          awayPassAccuracy: 0,
          homeSaves: 0,
          awaySaves: 0,
        },
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
    });
  }
});

// Update match stats (Admin/Operator)
router.put('/:matchId/stats', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const statsData = req.body;

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
    io.to(`match:${matchId}`).emit('match:stats', {
      matchId,
      stats,
    });

    res.json({
      success: true,
      message: 'Stats updated',
      data: stats,
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stats',
    });
  }
});

// Update specific stat (increment/decrement)
router.patch('/:matchId/stats/:statName', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId, statName } = req.params;
    const { team, action } = req.body; // team: 'home' | 'away', action: 'increment' | 'decrement' | value

    const fieldName = `${team}${statName.charAt(0).toUpperCase() + statName.slice(1)}`;
    
    // Get current stats
    let stats = await prisma.matchStats.findUnique({
      where: { matchId },
    });

    if (!stats) {
      // Create default stats
      stats = await prisma.matchStats.create({
        data: { matchId },
      });
    }

    const currentValue = (stats as any)[fieldName] || 0;
    let newValue: number;

    if (typeof action === 'number') {
      newValue = action;
    } else if (action === 'increment') {
      newValue = currentValue + 1;
    } else if (action === 'decrement') {
      newValue = Math.max(0, currentValue - 1);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
      });
    }

    const updatedStats = await prisma.matchStats.update({
      where: { matchId },
      data: {
        [fieldName]: newValue,
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:stat-update', {
      matchId,
      statName,
      team,
      value: newValue,
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

// ==================== HEAD TO HEAD ====================

// Get head-to-head statistics for a match
router.get('/:id/head-to-head', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the match to find teams
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // Get all previous matches between these teams
    const previousMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
          { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId },
        ],
        status: 'finished',
        id: { not: id }, // Exclude current match
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        stats: true,
      },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    // Calculate stats
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let homeGoals = 0;
    let awayGoals = 0;

    previousMatches.forEach((m) => {
      const isHomeTeamHome = m.homeTeamId === match.homeTeamId;
      const currentHomeScore = isHomeTeamHome ? m.homeScore : m.awayScore;
      const currentAwayScore = isHomeTeamHome ? m.awayScore : m.homeScore;

      homeGoals += currentHomeScore;
      awayGoals += currentAwayScore;

      if (currentHomeScore > currentAwayScore) homeWins++;
      else if (currentAwayScore > currentHomeScore) awayWins++;
      else draws++;
    });

    res.json({
      success: true,
      data: {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        totalMatches: previousMatches.length,
        homeWins,
        awayWins,
        draws,
        homeGoals,
        awayGoals,
        recentMatches: previousMatches.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Get H2H error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get head-to-head stats',
    });
  }
});

export default router;
