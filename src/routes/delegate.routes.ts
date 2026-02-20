import { Router } from 'express';
import { authenticate, isAdmin, isDelegate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// ==================== ADMIN: Manage Delegates ====================

// Get all delegates with their competitions
router.get('/admin/all', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const delegates = await prisma.competitionDelegate.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        competition: { select: { id: true, name: true, shortName: true, logoUrl: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: delegates });
  } catch (error) {
    console.error('Get delegates error:', error);
    res.status(500).json({ success: false, message: 'Failed to get delegates' });
  }
});

// Assign a user as delegate to a competition
router.post('/admin/assign', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId, competitionId } = req.body;

    if (!userId || !competitionId) {
      return res.status(400).json({ success: false, message: 'userId and competitionId are required' });
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check competition exists
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    // Check if already assigned
    const existing = await prisma.competitionDelegate.findUnique({
      where: { userId_competitionId: { userId, competitionId } },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User is already assigned to this competition' });
    }

    // Update user role to delegate if not admin
    if (user.role !== 'admin') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'delegate' },
      });
    }

    const delegate = await prisma.competitionDelegate.create({
      data: { userId, competitionId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        competition: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Delegate assigned', data: delegate });
  } catch (error) {
    console.error('Assign delegate error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign delegate' });
  }
});

// Remove delegate assignment
router.delete('/admin/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const delegation = await prisma.competitionDelegate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!delegation) {
      return res.status(404).json({ success: false, message: 'Delegation not found' });
    }

    await prisma.competitionDelegate.delete({ where: { id } });

    // Check if user has other delegations, if not, reset role to user
    const otherDelegations = await prisma.competitionDelegate.findMany({
      where: { userId: delegation.userId },
    });

    if (otherDelegations.length === 0 && delegation.user.role === 'delegate') {
      await prisma.user.update({
        where: { id: delegation.userId },
        data: { role: 'user' },
      });
    }

    res.json({ success: true, message: 'Delegate removed' });
  } catch (error) {
    console.error('Remove delegate error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove delegate' });
  }
});

// ==================== DELEGATE: Own Dashboard API ====================

// Get my delegated competitions
router.get('/my/competitions', authenticate, isDelegate, async (req: AuthRequest, res) => {
  try {
    const delegations = await prisma.competitionDelegate.findMany({
      where: { userId: req.user!.id },
      include: {
        competition: {
          include: {
            matches: { select: { id: true } },
            teams: { include: { team: { select: { id: true, name: true, shortName: true, logoUrl: true } } } },
          },
        },
      },
    });

    const competitions = delegations.map((d) => ({
      ...d.competition,
      matchCount: d.competition.matches.length,
      teamCount: d.competition.teams.length,
      teams: d.competition.teams.map((t) => t.team),
    }));

    res.json({ success: true, data: competitions });
  } catch (error) {
    console.error('Get my competitions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get competitions' });
  }
});

// Get matches for delegate's competition
router.get('/my/competitions/:competitionId/matches', authenticate, isDelegate, async (req: AuthRequest, res) => {
  try {
    const { competitionId } = req.params;

    // Verify delegate has access to this competition (skip for admin)
    if (req.user!.role !== 'admin') {
      const delegation = await prisma.competitionDelegate.findUnique({
        where: { userId_competitionId: { userId: req.user!.id, competitionId } },
      });
      if (!delegation) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this competition' });
      }
    }

    const matches = await prisma.match.findMany({
      where: { competitionId },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        refereeRef: true,
        assistantReferee1Ref: true,
        assistantReferee2Ref: true,
        fourthRefereeRef: true,
        supervisorRef: true,
        operators: { include: { operator: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Get delegate matches error:', error);
    res.status(500).json({ success: false, message: 'Failed to get matches' });
  }
});

// Create match in delegate's competition
router.post('/my/competitions/:competitionId/matches', authenticate, isDelegate, async (req: AuthRequest, res) => {
  try {
    const { competitionId } = req.params;

    // Verify access
    if (req.user!.role !== 'admin') {
      const delegation = await prisma.competitionDelegate.findUnique({
        where: { userId_competitionId: { userId: req.user!.id, competitionId } },
      });
      if (!delegation) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this competition' });
      }
    }

    const { homeTeamId, awayTeamId, startTime, venue, groupId, stage, isFeatured } = req.body;

    if (!homeTeamId || !awayTeamId || !startTime) {
      return res.status(400).json({ success: false, message: 'homeTeamId, awayTeamId, and startTime are required' });
    }

    const match = await prisma.match.create({
      data: {
        competitionId,
        homeTeamId,
        awayTeamId,
        startTime: new Date(startTime),
        venue: venue || undefined,
        groupId: groupId || undefined,
        stage: stage || undefined,
        isFeatured: isFeatured || false,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    res.status(201).json({ success: true, message: 'Match created', data: match });
  } catch (error) {
    console.error('Create delegate match error:', error);
    res.status(500).json({ success: false, message: 'Failed to create match' });
  }
});

// Update match in delegate's competition (referees, venue, operators, supervisor)
router.put('/my/matches/:matchId', authenticate, isDelegate, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Verify access
    if (req.user!.role !== 'admin' && match.competitionId) {
      const delegation = await prisma.competitionDelegate.findUnique({
        where: { userId_competitionId: { userId: req.user!.id, competitionId: match.competitionId } },
      });
      if (!delegation) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this competition' });
      }
    }

    const { venue, startTime, refereeId, assistant1Id, assistant2Id, fourthId, supervisorId, operatorId, isFeatured } = req.body;

    const updateData: any = {};
    if (venue !== undefined) updateData.venue = venue || null;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (refereeId !== undefined) updateData.refereeId = refereeId || null;
    if (assistant1Id !== undefined) updateData.assistant1Id = assistant1Id || null;
    if (assistant2Id !== undefined) updateData.assistant2Id = assistant2Id || null;
    if (fourthId !== undefined) updateData.fourthId = fourthId || null;
    if (supervisorId !== undefined) updateData.supervisorId = supervisorId || null;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        refereeRef: true,
        assistantReferee1Ref: true,
        assistantReferee2Ref: true,
        fourthRefereeRef: true,
        supervisorRef: true,
      },
    });

    // Handle operator assignment
    if (operatorId !== undefined) {
      await prisma.matchOperator.deleteMany({ where: { matchId } });
      if (operatorId) {
        await prisma.matchOperator.create({
          data: { matchId, operatorId },
        });
      }
    }

    res.json({ success: true, message: 'Match updated', data: updated });
  } catch (error) {
    console.error('Update delegate match error:', error);
    res.status(500).json({ success: false, message: 'Failed to update match' });
  }
});

// Delete match in delegate's competition
router.delete('/my/matches/:matchId', authenticate, isDelegate, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Verify access
    if (req.user!.role !== 'admin' && match.competitionId) {
      const delegation = await prisma.competitionDelegate.findUnique({
        where: { userId_competitionId: { userId: req.user!.id, competitionId: match.competitionId } },
      });
      if (!delegation) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this competition' });
      }
    }

    await prisma.$transaction([
      prisma.event.deleteMany({ where: { matchId } }),
      prisma.matchOperator.deleteMany({ where: { matchId } }),
      prisma.favorite.deleteMany({ where: { matchId } }),
      prisma.notification.deleteMany({ where: { matchId } }),
      prisma.lineupPlayer.deleteMany({ where: { lineup: { matchId } } }),
      prisma.matchLineup.deleteMany({ where: { matchId } }),
      prisma.matchStats.deleteMany({ where: { matchId } }),
      prisma.match.delete({ where: { id: matchId } }),
    ]);

    res.json({ success: true, message: 'Match deleted' });
  } catch (error) {
    console.error('Delete delegate match error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete match' });
  }
});

export default router;
