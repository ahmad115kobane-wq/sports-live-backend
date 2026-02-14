import { Router } from 'express';
import { authenticate, isOperator, AuthRequest } from '../middleware/auth.middleware';
import { sendMatchEventNotification } from '../services/notification.service.firebase';
import prisma from '../utils/prisma';
import { resolveMatchImages } from '../utils/imageUrl';

const router = Router();

// Helper: compute live minute from timestamps
function computeCurrentMinute(match: any): number | null {
  if (!match) return null;
  const now = Date.now();

  if (match.status === 'live') {
    // Second half
    if (match.secondHalfStartedAt) {
      const elapsed = Math.floor((now - new Date(match.secondHalfStartedAt).getTime()) / 60000);
      return Math.max(46, 46 + elapsed);
    }
    // First half
    if (match.liveStartedAt) {
      const elapsed = Math.floor((now - new Date(match.liveStartedAt).getTime()) / 60000);
      return Math.max(1, 1 + elapsed);
    }
  }

  if (match.status === 'extra_time') {
    // Use currentMinute as base (91 or 106) and compute from updatedAt
    const base = match.currentMinute || 91;
    const elapsed = Math.floor((now - new Date(match.updatedAt).getTime()) / 60000);
    return Math.max(base, base + elapsed);
  }

  // For halftime, finished, etc. return stored value
  return match.currentMinute;
}

// Get operator's assigned matches
router.get('/matches', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const assignments = await prisma.matchOperator.findMany({
      where: { operatorId: req.user!.id },
      include: {
        match: {
          include: {
            homeTeam: {
              include: { players: true },
            },
            awayTeam: {
              include: { players: true },
            },
            competition: true,
            events: {
              orderBy: { minute: 'desc' },
              take: 10,
              include: {
                player: true,
                team: true,
              },
            },
          },
        },
      },
      orderBy: {
        match: { startTime: 'asc' },
      },
    });

    const matches = assignments.map((a: any) => a.match);

    res.json({
      success: true,
      data: matches.map(resolveMatchImages),
    });
  } catch (error) {
    console.error('Get operator matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get matches',
    });
  }
});

// Get specific match for operator (with full details)
router.get('/matches/:matchId', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    // Verify operator is assigned to this match
    const assignment = await prisma.matchOperator.findFirst({
      where: {
        matchId,
        operatorId: req.user!.id,
      },
    });

    if (!assignment && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this match',
      });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          include: {
            players: {
              orderBy: { shirtNumber: 'asc' },
            },
          },
        },
        awayTeam: {
          include: {
            players: {
              orderBy: { shirtNumber: 'asc' },
            },
          },
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
              include: { player: true },
              orderBy: [{ isStarter: 'desc' }, { position: 'asc' }],
            },
          },
        },
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
      data: resolveMatchImages({
        ...match,
        currentMinute: liveMinute ?? match.currentMinute,
      }),
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get match',
    });
  }
});

// Update match referees (operator can set before match)
router.patch('/matches/:matchId/referee', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { referee, assistantReferee1, assistantReferee2, fourthReferee } = req.body;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        referee,
        assistantReferee1,
        assistantReferee2,
        fourthReferee,
      },
    });

    res.json({
      success: true,
      message: 'Referees updated',
      data: match,
    });
  } catch (error) {
    console.error('Update referees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update referees',
    });
  }
});

// Update match minute (for live tracking)
router.patch('/matches/:matchId/minute', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { currentMinute } = req.body;

    // Verify operator is assigned
    const assignment = await prisma.matchOperator.findFirst({
      where: {
        matchId,
        operatorId: req.user!.id,
      },
    });

    if (!assignment && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this match',
      });
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: { currentMinute },
    });

    // Emit socket event
    const io = req.app.get('io');
    console.log(`📡 Emitting match:minute to room match:${matchId}`, { currentMinute });
    io.to(`match:${matchId}`).emit('match:minute', {
      matchId,
      currentMinute,
    });

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Update minute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update minute',
    });
  }
});

// Start match (change status to live)
router.post('/matches/:matchId/start', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const assignment = await prisma.matchOperator.findFirst({
      where: {
        matchId,
        operatorId: req.user!.id,
      },
    });

    if (!assignment && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this match',
      });
    }

    const now = new Date();
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'live',
        currentMinute: 1,
        liveStartedAt: now,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // Create start event
    await prisma.event.create({
      data: {
        matchId,
        minute: 1,
        type: 'start_half',
        description: 'First half started',
        createdById: req.user!.id,
      },
    });

    const io = req.app.get('io');
    console.log(`📡 Emitting match:status (live) to room match:${matchId}`);
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'live',
      currentMinute: 1,
      liveStartedAt: now.toISOString(),
    });
    io.emit('global:match:started', match);

    // Send match start notification
    await sendMatchEventNotification(matchId, 'match_start', {
      id: matchId,
    });

    res.json({
      success: true,
      message: 'Match started',
      data: match,
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start match',
    });
  }
});

// Half time
router.post('/matches/:matchId/halftime', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'halftime',
        currentMinute: 45,
      },
    });

    await prisma.event.create({
      data: {
        matchId,
        minute: 45,
        type: 'end_half',
        description: 'Half time',
        createdById: req.user!.id,
      },
    });

    const io = req.app.get('io');
    console.log(`📡 Emitting match:status (halftime) to room match:${matchId}`);
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'halftime',
    });

    // Send halftime notification
    await sendMatchEventNotification(matchId, 'end_half', {
      id: matchId,
      minute: 45,
    });

    res.json({
      success: true,
      message: 'Half time',
      data: match,
    });
  } catch (error) {
    console.error('Halftime error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set halftime',
    });
  }
});

// Start second half
router.post('/matches/:matchId/second-half', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const now = new Date();
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'live',
        currentMinute: 46,
        secondHalfStartedAt: now,
      },
    });

    await prisma.event.create({
      data: {
        matchId,
        minute: 46,
        type: 'start_half',
        description: 'Second half started',
        createdById: req.user!.id,
      },
    });

    const io = req.app.get('io');
    console.log(`📡 Emitting match:status (live - second half) to room match:${matchId}`);
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'live',
      currentMinute: 46,
      secondHalfStartedAt: now.toISOString(),
    });

    // Send second half start notification
    await sendMatchEventNotification(matchId, 'start_half', {
      id: matchId,
      minute: 46,
    });

    res.json({
      success: true,
      message: 'Second half started',
      data: match,
    });
  } catch (error) {
    console.error('Second half error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start second half',
    });
  }
});

// Set stoppage/injury time
router.post('/matches/:matchId/stoppage-time', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { stoppageMinutes } = req.body;

    if (!stoppageMinutes || stoppageMinutes < 1) {
      return res.status(400).json({ success: false, message: 'Invalid stoppage time' });
    }

    const currentMatch = await prisma.match.findUnique({ where: { id: matchId } });
    if (!currentMatch) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:stoppageTime', {
      matchId,
      stoppageMinutes,
      currentMinute: currentMatch.currentMinute,
    });

    res.json({
      success: true,
      message: `Stoppage time: +${stoppageMinutes} minutes`,
      data: { stoppageMinutes },
    });
  } catch (error) {
    console.error('Stoppage time error:', error);
    res.status(500).json({ success: false, message: 'Failed to set stoppage time' });
  }
});

// Start Extra Time - First Half (ET1)
router.post('/matches/:matchId/extra-time-start', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'extra_time',
        currentMinute: 91,
      },
    });

    await prisma.event.create({
      data: {
        matchId,
        minute: 91,
        type: 'start_half',
        description: 'Extra time first half started',
        createdById: req.user!.id,
      },
    });

    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'extra_time',
      currentMinute: 91,
    });

    res.json({ success: true, message: 'Extra time started', data: match });
  } catch (error) {
    console.error('Extra time start error:', error);
    res.status(500).json({ success: false, message: 'Failed to start extra time' });
  }
});

// Extra Time - Halftime (between ET1 and ET2)
router.post('/matches/:matchId/extra-time-halftime', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'extra_time_halftime',
        currentMinute: 105,
      },
    });

    await prisma.event.create({
      data: {
        matchId,
        minute: 105,
        type: 'end_half',
        description: 'Extra time first half ended',
        createdById: req.user!.id,
      },
    });

    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'extra_time_halftime',
      currentMinute: 105,
    });

    res.json({ success: true, message: 'Extra time halftime', data: match });
  } catch (error) {
    console.error('Extra time halftime error:', error);
    res.status(500).json({ success: false, message: 'Failed to set extra time halftime' });
  }
});

// Start Extra Time - Second Half (ET2)
router.post('/matches/:matchId/extra-time-second', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'extra_time',
        currentMinute: 106,
      },
    });

    await prisma.event.create({
      data: {
        matchId,
        minute: 106,
        type: 'start_half',
        description: 'Extra time second half started',
        createdById: req.user!.id,
      },
    });

    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'extra_time',
      currentMinute: 106,
    });

    res.json({ success: true, message: 'Extra time second half started', data: match });
  } catch (error) {
    console.error('Extra time second half error:', error);
    res.status(500).json({ success: false, message: 'Failed to start extra time second half' });
  }
});

// Start Penalty Shootout
router.post('/matches/:matchId/penalties', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'penalties',
        currentMinute: 120,
      },
    });

    await prisma.event.create({
      data: {
        matchId,
        minute: 120,
        type: 'start_half',
        description: 'Penalty shootout started',
        createdById: req.user!.id,
      },
    });

    const io = req.app.get('io');
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'penalties',
      currentMinute: 120,
    });

    res.json({ success: true, message: 'Penalty shootout started', data: match });
  } catch (error) {
    console.error('Penalties start error:', error);
    res.status(500).json({ success: false, message: 'Failed to start penalties' });
  }
});

// End match
router.post('/matches/:matchId/end', authenticate, isOperator, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const currentMatch = await prisma.match.findUnique({ where: { id: matchId } });
    const endMinute = currentMatch?.currentMinute || 90;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'finished',
        currentMinute: endMinute,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    await prisma.event.create({
      data: {
        matchId,
        minute: endMinute,
        type: 'end_match',
        description: 'Full time',
        createdById: req.user!.id,
      },
    });

    // Update team stats (wins/losses/draws/goals)
    try {
      const homeScore = match.homeScore;
      const awayScore = match.awayScore;

      if (homeScore > awayScore) {
        // Home wins
        await prisma.team.update({ where: { id: match.homeTeamId }, data: { wins: { increment: 1 }, goalsFor: { increment: homeScore }, goalsAgainst: { increment: awayScore } } });
        await prisma.team.update({ where: { id: match.awayTeamId }, data: { losses: { increment: 1 }, goalsFor: { increment: awayScore }, goalsAgainst: { increment: homeScore } } });
      } else if (awayScore > homeScore) {
        // Away wins
        await prisma.team.update({ where: { id: match.homeTeamId }, data: { losses: { increment: 1 }, goalsFor: { increment: homeScore }, goalsAgainst: { increment: awayScore } } });
        await prisma.team.update({ where: { id: match.awayTeamId }, data: { wins: { increment: 1 }, goalsFor: { increment: awayScore }, goalsAgainst: { increment: homeScore } } });
      } else {
        // Draw
        await prisma.team.update({ where: { id: match.homeTeamId }, data: { draws: { increment: 1 }, goalsFor: { increment: homeScore }, goalsAgainst: { increment: awayScore } } });
        await prisma.team.update({ where: { id: match.awayTeamId }, data: { draws: { increment: 1 }, goalsFor: { increment: awayScore }, goalsAgainst: { increment: homeScore } } });
      }
    } catch (statsError) {
      console.error('Failed to update team stats:', statsError);
    }

    const io = req.app.get('io');
    console.log(`\uD83D\uDCE1 Emitting match:status (finished) to room match:${matchId}`);
    io.to(`match:${matchId}`).emit('match:status', {
      matchId,
      status: 'finished',
    });
    io.emit('global:match:ended', match);

    // Send match end notification
    await sendMatchEventNotification(matchId, 'match_end', {
      id: matchId,
    });

    res.json({
      success: true,
      message: 'Match ended',
      data: match,
    });
  } catch (error) {
    console.error('End match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end match',
    });
  }
});

export default router;
