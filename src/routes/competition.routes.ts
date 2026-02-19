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

// Helper to compute standings from matches and teams
function computeStandings(matches: any[], teamsList: any[]) {
  const standingsMap: Record<string, any> = {};
  for (const t of teamsList) {
    standingsMap[t.id || t.teamId] = {
      teamId: t.id || t.teamId,
      team: t.team || t,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    };
  }
  for (const m of matches) {
    const home = standingsMap[m.homeTeamId];
    const away = standingsMap[m.awayTeamId];
    if (home) {
      home.played++;
      home.goalsFor += m.homeScore;
      home.goalsAgainst += m.awayScore;
      if (m.homeScore > m.awayScore) { home.won++; home.points += 3; }
      else if (m.homeScore === m.awayScore) { home.drawn++; home.points += 1; }
      else { home.lost++; }
      home.goalDifference = home.goalsFor - home.goalsAgainst;
    }
    if (away) {
      away.played++;
      away.goalsFor += m.awayScore;
      away.goalsAgainst += m.homeScore;
      if (m.awayScore > m.homeScore) { away.won++; away.points += 3; }
      else if (m.awayScore === m.homeScore) { away.drawn++; away.points += 1; }
      else { away.lost++; }
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }
  }
  return Object.values(standingsMap).sort((a: any, b: any) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  }).map((s: any, i: number) => ({ ...s, rank: i + 1, team: resolveTeamImages(s.team) }));
}

// Get competition standings (computed from finished matches)
router.get('/:id/standings', async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId } = req.query;

    // Check competition format
    const competition = await prisma.competition.findUnique({ where: { id }, select: { format: true } });
    if (!competition) return res.status(404).json({ success: false, message: 'Competition not found' });

    if (competition.format === 'GROUPS') {
      // If groupId specified, return standings for that group only
      if (groupId) {
        const groupMatches = await prisma.match.findMany({
          where: { competitionId: id, groupId: groupId as string, status: 'finished' },
          select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
        });
        const groupTeams = await prisma.competitionGroupTeam.findMany({
          where: { groupId: groupId as string },
          include: { team: { select: { id: true, name: true, shortName: true, logoUrl: true, primaryColor: true } } },
        });
        const standings = computeStandings(groupMatches, groupTeams);
        return res.json({ success: true, data: standings });
      }

      // Return standings grouped by group
      const groups = await prisma.competitionGroup.findMany({
        where: { competitionId: id },
        include: {
          teams: { include: { team: { select: { id: true, name: true, shortName: true, logoUrl: true, primaryColor: true } } } },
        },
        orderBy: { sortOrder: 'asc' },
      });

      const allGroupMatches = await prisma.match.findMany({
        where: { competitionId: id, stage: 'GROUP', status: 'finished' },
        select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true, groupId: true },
      });

      const groupStandings = groups.map((g: any) => {
        const gMatches = allGroupMatches.filter((m: any) => m.groupId === g.id);
        const standings = computeStandings(gMatches, g.teams);
        return { groupId: g.id, groupName: g.name, standings };
      });

      return res.json({ success: true, data: groupStandings, format: 'GROUPS' });
    }

    // LEAGUE format - original logic
    const matches = await prisma.match.findMany({
      where: { competitionId: id, status: 'finished' },
      select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
    });
    const teamComps = await prisma.teamCompetition.findMany({
      where: { competitionId: id },
      include: { team: { select: { id: true, name: true, shortName: true, logoUrl: true, primaryColor: true } } },
    });
    const standings = computeStandings(matches, teamComps);
    res.json({ success: true, data: standings, format: 'LEAGUE' });
  } catch (error) {
    console.error('Get standings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get standings' });
  }
});

// ── Competition Groups Management ──

// Get groups for a competition
router.get('/:id/groups', async (req, res) => {
  try {
    const { id } = req.params;
    const groups = await prisma.competitionGroup.findMany({
      where: { competitionId: id },
      include: {
        teams: {
          include: { team: { select: { id: true, name: true, shortName: true, logoUrl: true, primaryColor: true } } },
        },
        _count: { select: { matches: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const resolved = groups.map((g: any) => ({
      ...g,
      teams: g.teams.map((gt: any) => ({ ...gt, team: resolveTeamImages(gt.team) })),
    }));

    res.json({ success: true, data: resolved });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: 'Failed to get groups' });
  }
});

// Create group
router.post('/:id/groups', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    const group = await prisma.competitionGroup.create({
      data: { competitionId: id, name, sortOrder: sortOrder || 0 },
    });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
});

// Update group
router.put('/:id/groups/:groupId', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const { name, sortOrder } = req.body;
    const group = await prisma.competitionGroup.update({
      where: { id: groupId },
      data: { name, sortOrder },
    });
    res.json({ success: true, data: group });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ success: false, message: 'Failed to update group' });
  }
});

// Delete group
router.delete('/:id/groups/:groupId', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    await prisma.competitionGroup.delete({ where: { id: groupId } });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
});

// Add team to group
router.post('/:id/groups/:groupId/teams', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const { teamId } = req.body;
    const entry = await prisma.competitionGroupTeam.create({
      data: { groupId, teamId },
      include: { team: { select: { id: true, name: true, shortName: true, logoUrl: true, primaryColor: true } } },
    });
    res.status(201).json({ success: true, data: { ...entry, team: resolveTeamImages(entry.team) } });
  } catch (error) {
    console.error('Add team to group error:', error);
    res.status(500).json({ success: false, message: 'Failed to add team to group' });
  }
});

// Remove team from group
router.delete('/:id/groups/:groupId/teams/:teamId', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { groupId, teamId } = req.params;
    await prisma.competitionGroupTeam.deleteMany({ where: { groupId, teamId } });
    res.json({ success: true, message: 'Team removed from group' });
  } catch (error) {
    console.error('Remove team from group error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove team from group' });
  }
});

// Get knockout matches for competition (quarter/semi/final)
router.get('/:id/knockout', async (req, res) => {
  try {
    const { id } = req.params;
    const matches = await prisma.match.findMany({
      where: {
        competitionId: id,
        stage: { in: ['QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'] },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [{ stage: 'asc' }, { startTime: 'asc' }],
    });

    const resolved = matches.map((m: any) => {
      const rm = resolveMatchImages(m);
      return rm;
    });

    // Group by stage
    const knockout: any = {
      QUARTER_FINAL: resolved.filter((m: any) => m.stage === 'QUARTER_FINAL'),
      SEMI_FINAL: resolved.filter((m: any) => m.stage === 'SEMI_FINAL'),
      FINAL: resolved.filter((m: any) => m.stage === 'FINAL'),
    };

    res.json({ success: true, data: knockout });
  } catch (error) {
    console.error('Get knockout error:', error);
    res.status(500).json({ success: false, message: 'Failed to get knockout matches' });
  }
});

// Get top scorers for a competition
router.get('/:id/top-scorers', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get all goal events for matches in this competition
    const goalEvents = await prisma.event.findMany({
      where: {
        type: 'goal',
        playerId: { not: null },
        match: { competitionId: id },
      },
      select: {
        playerId: true,
      },
    });

    // Count goals per player
    const goalCounts: Record<string, number> = {};
    for (const e of goalEvents) {
      if (e.playerId) {
        goalCounts[e.playerId] = (goalCounts[e.playerId] || 0) + 1;
      }
    }

    // Sort by goals desc and take top N
    const topPlayerIds = Object.entries(goalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    if (topPlayerIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch player details with team
    const players = await prisma.player.findMany({
      where: { id: { in: topPlayerIds.map(([pid]) => pid) } },
      select: {
        id: true,
        name: true,
        shirtNumber: true,
        position: true,
        imageUrl: true,
        team: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
      },
    });

    const playerMap: Record<string, any> = {};
    for (const p of players) {
      playerMap[p.id] = p;
    }

    // Build result with rank
    const scorers = topPlayerIds.map(([pid, goals], idx) => {
      const player = playerMap[pid];
      return {
        rank: idx + 1,
        goals,
        player: player ? {
          ...player,
          team: player.team ? resolveTeamImages(player.team) : null,
        } : null,
      };
    }).filter(s => s.player !== null);

    res.json({ success: true, data: scorers });
  } catch (error) {
    console.error('Get top scorers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get top scorers' });
  }
});

// Admin: Create competition
router.post('/', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, shortName, logoUrl, country, season, type, icon, sortOrder, format } = req.body;

    const competition = await prisma.competition.create({
      data: {
        name,
        shortName,
        logoUrl,
        country,
        season,
        type: type || 'futsal',
        format: format || 'LEAGUE',
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
    const { name, shortName, logoUrl, country, season, type, icon, isActive, sortOrder, format } = req.body;

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        name,
        shortName,
        logoUrl,
        country,
        season,
        type,
        format,
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
