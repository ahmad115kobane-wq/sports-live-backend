import { Router } from 'express';
import { authenticate, isAdmin, isOperator, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// Formation positions for each formation type
const FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 },
    { position: 'CB', x: 35, y: 75 },
    { position: 'CB', x: 65, y: 75 },
    { position: 'RB', x: 85, y: 70 },
    { position: 'LM', x: 15, y: 45 },
    { position: 'CM', x: 35, y: 50 },
    { position: 'CM', x: 65, y: 50 },
    { position: 'RM', x: 85, y: 45 },
    { position: 'ST', x: 35, y: 20 },
    { position: 'ST', x: 65, y: 20 },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 },
    { position: 'CB', x: 35, y: 75 },
    { position: 'CB', x: 65, y: 75 },
    { position: 'RB', x: 85, y: 70 },
    { position: 'CDM', x: 50, y: 55 },
    { position: 'CM', x: 30, y: 45 },
    { position: 'CM', x: 70, y: 45 },
    { position: 'LW', x: 20, y: 20 },
    { position: 'ST', x: 50, y: 15 },
    { position: 'RW', x: 80, y: 20 },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 },
    { position: 'CB', x: 35, y: 75 },
    { position: 'CB', x: 65, y: 75 },
    { position: 'RB', x: 85, y: 70 },
    { position: 'CDM', x: 35, y: 55 },
    { position: 'CDM', x: 65, y: 55 },
    { position: 'LW', x: 20, y: 35 },
    { position: 'CAM', x: 50, y: 35 },
    { position: 'RW', x: 80, y: 35 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'CB', x: 25, y: 75 },
    { position: 'CB', x: 50, y: 75 },
    { position: 'CB', x: 75, y: 75 },
    { position: 'LWB', x: 10, y: 50 },
    { position: 'CM', x: 30, y: 50 },
    { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 70, y: 50 },
    { position: 'RWB', x: 90, y: 50 },
    { position: 'ST', x: 35, y: 20 },
    { position: 'ST', x: 65, y: 20 },
  ],
  '3-4-3': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'CB', x: 25, y: 75 },
    { position: 'CB', x: 50, y: 75 },
    { position: 'CB', x: 75, y: 75 },
    { position: 'LM', x: 15, y: 50 },
    { position: 'CM', x: 35, y: 50 },
    { position: 'CM', x: 65, y: 50 },
    { position: 'RM', x: 85, y: 50 },
    { position: 'LW', x: 20, y: 20 },
    { position: 'ST', x: 50, y: 15 },
    { position: 'RW', x: 80, y: 20 },
  ],
  '4-5-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 },
    { position: 'CB', x: 35, y: 75 },
    { position: 'CB', x: 65, y: 75 },
    { position: 'RB', x: 85, y: 70 },
    { position: 'LM', x: 15, y: 45 },
    { position: 'CM', x: 35, y: 50 },
    { position: 'CDM', x: 50, y: 55 },
    { position: 'CM', x: 65, y: 50 },
    { position: 'RM', x: 85, y: 45 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '5-3-2': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LWB', x: 10, y: 65 },
    { position: 'CB', x: 30, y: 75 },
    { position: 'CB', x: 50, y: 75 },
    { position: 'CB', x: 70, y: 75 },
    { position: 'RWB', x: 90, y: 65 },
    { position: 'CM', x: 30, y: 45 },
    { position: 'CM', x: 50, y: 50 },
    { position: 'CM', x: 70, y: 45 },
    { position: 'ST', x: 35, y: 20 },
    { position: 'ST', x: 65, y: 20 },
  ],
  '5-4-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LWB', x: 10, y: 65 },
    { position: 'CB', x: 30, y: 75 },
    { position: 'CB', x: 50, y: 75 },
    { position: 'CB', x: 70, y: 75 },
    { position: 'RWB', x: 90, y: 65 },
    { position: 'LM', x: 20, y: 45 },
    { position: 'CM', x: 40, y: 50 },
    { position: 'CM', x: 60, y: 50 },
    { position: 'RM', x: 80, y: 45 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '4-1-4-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 },
    { position: 'CB', x: 35, y: 75 },
    { position: 'CB', x: 65, y: 75 },
    { position: 'RB', x: 85, y: 70 },
    { position: 'CDM', x: 50, y: 60 },
    { position: 'LM', x: 15, y: 40 },
    { position: 'CM', x: 35, y: 45 },
    { position: 'CM', x: 65, y: 45 },
    { position: 'RM', x: 85, y: 40 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '4-4-1-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 },
    { position: 'CB', x: 35, y: 75 },
    { position: 'CB', x: 65, y: 75 },
    { position: 'RB', x: 85, y: 70 },
    { position: 'LM', x: 15, y: 50 },
    { position: 'CM', x: 35, y: 55 },
    { position: 'CM', x: 65, y: 55 },
    { position: 'RM', x: 85, y: 50 },
    { position: 'CAM', x: 50, y: 30 },
    { position: 'ST', x: 50, y: 15 },
  ],
};

// Get all formations with positions
router.get('/formations', async (req, res) => {
  res.json({
    success: true,
    data: Object.keys(FORMATION_POSITIONS).map(f => ({
      name: f,
      positions: FORMATION_POSITIONS[f],
    })),
  });
});

// Get formation positions
router.get('/formations/:formation', async (req, res) => {
  const { formation } = req.params;
  const positions = FORMATION_POSITIONS[formation];

  if (!positions) {
    return res.status(404).json({
      success: false,
      message: 'Formation not found',
    });
  }

  res.json({
    success: true,
    data: {
      name: formation,
      positions,
    },
  });
});

// Get all lineups for a match
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    const lineups = await prisma.matchLineup.findMany({
      where: { matchId },
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

    // Format for frontend
    const formattedLineups = lineups.map(lineup => ({
      id: lineup.id,
      teamId: lineup.teamId,
      team: lineup.team,
      formation: lineup.formation,
      coach: lineup.coach,
      starters: lineup.players.filter(p => p.isStarter),
      substitutes: lineup.players.filter(p => !p.isStarter),
      captain: lineup.players.find(p => p.isCaptain),
    }));

    res.json({
      success: true,
      data: formattedLineups,
    });
  } catch (error) {
    console.error('Get lineups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lineups',
    });
  }
});

// Get team lineup for a match
router.get('/match/:matchId/team/:teamId', async (req, res) => {
  try {
    const { matchId, teamId } = req.params;

    const lineup = await prisma.matchLineup.findFirst({
      where: { matchId, teamId },
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

    if (!lineup) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        ...lineup,
        starters: lineup.players.filter(p => p.isStarter),
        substitutes: lineup.players.filter(p => !p.isStarter),
        captain: lineup.players.find(p => p.isCaptain),
      },
    });
  } catch (error) {
    console.error('Get team lineup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team lineup',
    });
  }
});

// Create or update lineup (Admin/Operator)
router.post('/match/:matchId/team/:teamId', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId, teamId } = req.params;
    const { formation, coach, starters, substitutes } = req.body;
    // starters: [{ playerId, position, positionX, positionY, isCaptain }]
    // substitutes: [{ playerId, position }]

    // Delete existing lineup if any
    const existingLineup = await prisma.matchLineup.findFirst({
      where: { matchId, teamId },
    });

    if (existingLineup) {
      await prisma.lineupPlayer.deleteMany({
        where: { lineupId: existingLineup.id },
      });
      await prisma.matchLineup.delete({
        where: { id: existingLineup.id },
      });
    }

    // Get formation positions if not provided
    const formationPositions = FORMATION_POSITIONS[formation] || [];

    // Create new lineup
    const lineup = await prisma.matchLineup.create({
      data: {
        matchId,
        teamId,
        formation,
        coach,
        players: {
          create: [
            ...starters.map((p: any, index: number) => ({
              playerId: p.playerId,
              position: p.position || formationPositions[index]?.position || 'SUB',
              positionX: p.positionX ?? formationPositions[index]?.x ?? 50,
              positionY: p.positionY ?? formationPositions[index]?.y ?? 50,
              isStarter: true,
              isCaptain: p.isCaptain ?? false,
            })),
            ...(substitutes || []).map((p: any) => ({
              playerId: p.playerId,
              position: p.position || 'SUB',
              positionX: 0,
              positionY: 0,
              isStarter: false,
              isCaptain: false,
            })),
          ],
        },
      },
      include: {
        team: true,
        players: {
          include: { player: true },
          orderBy: [
            { isStarter: 'desc' },
            { position: 'asc' },
          ],
        },
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:lineup-updated', {
      matchId,
      teamId,
      lineup: {
        ...lineup,
        starters: lineup.players.filter(p => p.isStarter),
        substitutes: lineup.players.filter(p => !p.isStarter),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lineup created successfully',
      data: {
        ...lineup,
        starters: lineup.players.filter(p => p.isStarter),
        substitutes: lineup.players.filter(p => !p.isStarter),
      },
    });
  } catch (error) {
    console.error('Create lineup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lineup',
    });
  }
});

// Update formation only
router.patch('/match/:matchId/team/:teamId/formation', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId, teamId } = req.params;
    const { formation } = req.body;

    const lineup = await prisma.matchLineup.findFirst({
      where: { matchId, teamId },
    });

    if (!lineup) {
      return res.status(404).json({
        success: false,
        message: 'Lineup not found',
      });
    }

    // Get new formation positions
    const newPositions = FORMATION_POSITIONS[formation] || [];

    // Update formation
    await prisma.matchLineup.update({
      where: { id: lineup.id },
      data: { formation },
    });

    // Update starter positions based on new formation
    const starters = await prisma.lineupPlayer.findMany({
      where: { lineupId: lineup.id, isStarter: true },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < starters.length && i < newPositions.length; i++) {
      await prisma.lineupPlayer.update({
        where: { id: starters[i].id },
        data: {
          position: newPositions[i].position,
          positionX: newPositions[i].x,
          positionY: newPositions[i].y,
        },
      });
    }

    // Get updated lineup
    const updatedLineup = await prisma.matchLineup.findFirst({
      where: { matchId, teamId },
      include: {
        team: true,
        players: {
          include: { player: true },
        },
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:formation-changed', {
      matchId,
      teamId,
      formation,
    });

    res.json({
      success: true,
      message: 'Formation updated',
      data: updatedLineup,
    });
  } catch (error) {
    console.error('Update formation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update formation',
    });
  }
});

// Delete lineup
router.delete('/match/:matchId/team/:teamId', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { matchId, teamId } = req.params;

    const lineup = await prisma.matchLineup.findFirst({
      where: { matchId, teamId },
    });

    if (!lineup) {
      return res.status(404).json({
        success: false,
        message: 'Lineup not found',
      });
    }

    await prisma.lineupPlayer.deleteMany({
      where: { lineupId: lineup.id },
    });

    await prisma.matchLineup.delete({
      where: { id: lineup.id },
    });

    res.json({
      success: true,
      message: 'Lineup deleted',
    });
  } catch (error) {
    console.error('Delete lineup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lineup',
    });
  }
});

export default router;
