import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// Get dashboard stats
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalOperators,
      totalMatches,
      liveMatches,
      totalTeams,
      totalPlayers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.user.count({ where: { role: 'operator' } }),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'live' } }),
      prisma.team.count(),
      prisma.player.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOperators,
        totalMatches,
        liveMatches,
        totalTeams,
        totalPlayers,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
    });
  }
});

// Create operator
router.post('/operators', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const operator = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'operator',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Operator created',
      data: operator,
    });
  } catch (error) {
    console.error('Create operator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create operator',
    });
  }
});

// Get all operators
router.get('/operators', authenticate, isAdmin, async (req, res) => {
  try {
    const operators = await prisma.user.findMany({
      where: { role: 'operator' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        operatorMatches: {
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: operators,
    });
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operators',
    });
  }
});

// Assign operator to match
router.post('/matches/:matchId/operators', authenticate, isAdmin, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { operatorId } = req.body;

    // Verify operator exists and has correct role
    const operator = await prisma.user.findUnique({
      where: { id: operatorId },
    });

    if (!operator || operator.role !== 'operator') {
      return res.status(400).json({
        success: false,
        message: 'Invalid operator',
      });
    }

    const assignment = await prisma.matchOperator.create({
      data: {
        matchId,
        operatorId,
      },
      include: {
        operator: {
          select: { id: true, name: true, email: true },
        },
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Operator assigned to match',
      data: assignment,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Operator already assigned to this match',
      });
    }
    console.error('Assign operator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign operator',
    });
  }
});

// Remove operator from match
router.delete('/matches/:matchId/operators/:operatorId', authenticate, isAdmin, async (req, res) => {
  try {
    const { matchId, operatorId } = req.params;

    await prisma.matchOperator.deleteMany({
      where: {
        matchId,
        operatorId,
      },
    });

    res.json({
      success: true,
      message: 'Operator removed from match',
    });
  } catch (error) {
    console.error('Remove operator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove operator',
    });
  }
});

// Get all competitions
router.get('/competitions', authenticate, isAdmin, async (req, res) => {
  try {
    const competitions = await prisma.competition.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: competitions,
    });
  } catch (error) {
    console.error('Get competitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get competitions',
    });
  }
});

// Create competition
router.post('/competitions', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, shortName, logoUrl, country, season, type, icon, isActive, sortOrder } = req.body;

    const competition = await prisma.competition.create({
      data: {
        name,
        ...(shortName !== undefined && { shortName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(country !== undefined && { country }),
        ...(season !== undefined && { season }),
        ...(type !== undefined && { type }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Competition created',
      data: competition,
    });
  } catch (error) {
    console.error('Create competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create competition',
    });
  }
});

// Update competition
router.put('/competitions/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, shortName, logoUrl, country, season, type, icon, isActive, sortOrder } = req.body;

    const competition = await prisma.competition.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(country !== undefined && { country }),
        ...(season !== undefined && { season }),
        ...(type !== undefined && { type }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.json({
      success: true,
      message: 'Competition updated',
      data: competition,
    });
  } catch (error) {
    console.error('Update competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update competition',
    });
  }
});

// Delete competition
router.delete('/competitions/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await prisma.competition.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Competition deleted',
    });
  } catch (error) {
    console.error('Delete competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete competition',
    });
  }
});

// Get event logs
router.get('/events/logs', authenticate, isAdmin, async (req, res) => {
  try {
    const { matchId, limit = 50 } = req.query;

    const where: any = {};
    if (matchId) where.matchId = matchId;

    const events = await prisma.event.findMany({
      where,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
        player: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get event logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event logs',
    });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users (with pagination)
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const { search, role, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit))));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' as const } },
        { email: { contains: String(search), mode: 'insensitive' as const } },
      ];
    }
    if (role && role !== 'all') {
      where.role = String(role);
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isBanned: true,
          createdAt: true,
          _count: {
            select: { favorites: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + users.length < total,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
    });
  }
});

// Get user by ID
router.get('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: { favorites: true },
        },
        favorites: {
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
    });
  }
});

// Toggle user ban status
router.post('/users/:id/toggle-ban', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent banning admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban an admin',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    res.json({
      success: true,
      message: updatedUser.isBanned ? 'User banned' : 'User unbanned',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle ban status',
    });
  }
});

// Update user role
router.patch('/users/:id/role', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'operator', 'admin', 'publisher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent changing own role
    if (id === req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Generate new token with updated role for the user
    const newToken = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'User role updated',
      data: {
        user: updatedUser,
        token: newToken,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
    });
  }
});

// Delete user
router.delete('/users/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete an admin',
      });
    }

    // Prevent self-delete
    if (id === req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself',
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

export default router;
