import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { resolveCompetitionImages, resolveMatchImages, resolveTeamImages } from '../utils/imageUrl';

const router = Router();

// Get all competitions
router.get('/', async (req, res) => {
  try {
    const { type, active } = req.query;

    const where: any = {};
    
    if (type) {
      where.type = type as string;
    }
    
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const competitions = await prisma.competition.findMany({
      where,
      include: {
        _count: {
          select: { matches: true }
        }
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: competitions.map(resolveCompetitionImages),
    });
  } catch (error) {
    console.error('Get competitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get competitions',
    });
  }
});

// Get active competitions for home screen
router.get('/active', async (req, res) => {
  try {
    const competitions = await prisma.competition.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: { matches: true }
        }
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: competitions.map(resolveCompetitionImages),
    });
  } catch (error) {
    console.error('Get active competitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active competitions',
    });
  }
});

// Get competition by ID with matches
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit } = req.query;

    const matchWhere: any = {};
    if (status) {
      matchWhere.status = status as string;
    }

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        matches: {
          where: matchWhere,
          include: {
            homeTeam: true,
            awayTeam: true,
          },
          orderBy: { startTime: 'desc' },
          take: limit ? parseInt(limit as string) : undefined,
        },
        _count: {
          select: { matches: true }
        }
      },
    });

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found',
      });
    }

    const resolved: any = resolveCompetitionImages(competition);
    if (resolved.matches) {
      resolved.matches = resolved.matches.map((m: any) => {
        const rm: any = { ...m };
        if (rm.homeTeam) rm.homeTeam = resolveTeamImages(rm.homeTeam);
        if (rm.awayTeam) rm.awayTeam = resolveTeamImages(rm.awayTeam);
        return rm;
      });
    }
    res.json({
      success: true,
      data: resolved,
    });
  } catch (error) {
    console.error('Get competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get competition',
    });
  }
});

// Get matches by competition
router.get('/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, page = '1', limit = '20' } = req.query;

    const where: any = { competitionId: id };
    
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
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: true,
          awayTeam: true,
          competition: true,
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.match.count({ where }),
    ]);

    res.json({
      success: true,
      data: matches.map(resolveMatchImages),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get competition matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get competition matches',
    });
  }
});

// Admin: Create competition
router.post('/', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, shortName, logoUrl, country, season, type, icon, sortOrder } = req.body;

    const competition = await prisma.competition.create({
      data: {
        name,
        shortName,
        logoUrl,
        country,
        season,
        type: type || 'football',
        icon,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json({
      success: true,
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

// Admin: Update competition
router.put('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, shortName, logoUrl, country, season, type, icon, isActive, sortOrder } = req.body;

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        name,
        shortName,
        logoUrl,
        country,
        season,
        type,
        icon,
        isActive,
        sortOrder,
      },
    });

    res.json({
      success: true,
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

// Admin: Delete competition
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.competition.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Competition deleted successfully',
    });
  } catch (error) {
    console.error('Delete competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete competition',
    });
  }
});

export default router;
