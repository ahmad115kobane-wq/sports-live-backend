import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// Get all players
router.get('/', async (req, res) => {
  try {
    const { teamId, search, position, nationality } = req.query;

    const where: any = {};
    if (teamId) where.teamId = teamId;
    if (position) where.position = position;
    if (nationality) where.nationality = nationality;
    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const players = await prisma.player.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: players,
    });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get players',
    });
  }
});

// Get player by ID with statistics
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        primaryEvents: {
          where: {
            type: { in: ['goal', 'yellow_card', 'red_card', 'assist'] },
          },
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
                competition: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        lineupPlayers: {
          include: {
            lineup: {
              include: {
                match: {
                  include: {
                    homeTeam: true,
                    awayTeam: true,
                    competition: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found',
      });
    }

    // Calculate statistics
    const goals = player.primaryEvents.filter((e: any) => e.type === 'goal').length;
    const assists = player.primaryEvents.filter((e: any) => e.type === 'assist').length;
    const yellowCards = player.primaryEvents.filter((e: any) => e.type === 'yellow_card').length;
    const redCards = player.primaryEvents.filter((e: any) => e.type === 'red_card').length;
    const appearances = player.lineupPlayers.filter((lp: any) => lp.isStarter).length;

    res.json({
      success: true,
      data: {
        ...player,
        statistics: {
          goals,
          assists,
          yellowCards,
          redCards,
          appearances,
        },
        recentGoals: player.primaryEvents
          .filter((e: any) => e.type === 'goal')
          .slice(0, 5)
          .map((e: any) => ({
            matchId: e.matchId,
            match: e.match,
            minute: e.minute,
          })),
      },
    });
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get player',
    });
  }
});

// Get player statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { season, competitionId } = req.query;

    const eventWhere: any = { playerId: id };
    if (season || competitionId) {
      eventWhere.match = {};
      if (season) eventWhere.match.season = season;
      if (competitionId) eventWhere.match.competitionId = competitionId;
    }

    const events = await prisma.event.findMany({
      where: eventWhere,
      include: {
        match: {
          include: { competition: true },
        },
      },
    });

    const lineupAppearances = await prisma.lineupPlayer.findMany({
      where: {
        playerId: id,
        isStarter: true,
      },
      include: {
        lineup: {
          include: {
            match: true,
          },
        },
      },
    });

    // Group by competition
    const byCompetition: Record<string, any> = {};
    
    events.forEach((event: any) => {
      const compId = event.match?.competitionId;
      if (!compId) return;
      
      if (!byCompetition[compId]) {
        byCompetition[compId] = {
          competition: event.match.competition,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 0,
        };
      }
      
      if (event.type === 'goal') byCompetition[compId].goals++;
      if (event.type === 'assist') byCompetition[compId].assists++;
      if (event.type === 'yellow_card') byCompetition[compId].yellowCards++;
      if (event.type === 'red_card') byCompetition[compId].redCards++;
    });

    lineupAppearances.forEach((lp: any) => {
      const compId = lp.lineup?.match?.competitionId;
      if (compId && byCompetition[compId]) {
        byCompetition[compId].appearances++;
      }
    });

    res.json({
      success: true,
      data: {
        total: {
          goals: events.filter((e: any) => e.type === 'goal').length,
          assists: events.filter((e: any) => e.type === 'assist').length,
          yellowCards: events.filter((e: any) => e.type === 'yellow_card').length,
          redCards: events.filter((e: any) => e.type === 'red_card').length,
          appearances: lineupAppearances.length,
        },
        byCompetition: Object.values(byCompetition),
      },
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get player statistics',
    });
  }
});

// Create player (Admin only)
router.post('/', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      teamId,
      name,
      shirtNumber,
      position,
      imageUrl,
      nationality,
      dateOfBirth,
      height,
      weight,
      preferredFoot,
    } = req.body;

    const player = await prisma.player.create({
      data: {
        teamId,
        name,
        shirtNumber,
        position,
        imageUrl,
        nationality,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        height,
        weight,
        preferredFoot,
      },
      include: {
        team: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Player created',
      data: player,
    });
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create player',
    });
  }
});

// Update player (Admin only)
router.put('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      teamId,
      name,
      shirtNumber,
      position,
      imageUrl,
      nationality,
      dateOfBirth,
      height,
      weight,
      preferredFoot,
    } = req.body;

    const player = await prisma.player.update({
      where: { id },
      data: {
        teamId,
        name,
        shirtNumber,
        position,
        imageUrl,
        nationality,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        height,
        weight,
        preferredFoot,
      },
      include: {
        team: true,
      },
    });

    res.json({
      success: true,
      message: 'Player updated',
      data: player,
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update player',
    });
  }
});

// Transfer player to another team
router.patch('/:id/transfer', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newTeamId, newShirtNumber } = req.body;

    const player = await prisma.player.update({
      where: { id },
      data: {
        teamId: newTeamId,
        shirtNumber: newShirtNumber,
      },
      include: {
        team: true,
      },
    });

    res.json({
      success: true,
      message: 'Player transferred',
      data: player,
    });
  } catch (error) {
    console.error('Transfer player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer player',
    });
  }
});

// Delete player (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.player.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Player deleted',
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete player',
    });
  }
});

export default router;
