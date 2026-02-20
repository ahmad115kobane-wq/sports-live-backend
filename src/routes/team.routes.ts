import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { uploadToImgBB } from '../services/imgbb.service';
import { resolveTeamImages, resolveMatchImages } from '../utils/imageUrl';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

// Setup multer with memory storage for team logo upload
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Get all teams
router.get('/', async (req, res) => {
  try {
    const { search, country, category, includePlayers, competitionId } = req.query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { shortName: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (country) where.country = String(country);
    if (category) where.category = String(category);

    // If competitionId is provided, filter by competition
    if (competitionId) {
      where.competitions = {
        some: {
          competitionId: String(competitionId),
        },
      };
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        players: includePlayers === 'true' ? {
          orderBy: { shirtNumber: 'asc' },
        } : false,
        competitions: {
          include: {
            competition: true,
          },
        },
        _count: {
          select: { players: true, homeMatches: true, awayMatches: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: teams.map(resolveTeamImages),
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teams',
    });
  }
});

// Get team by ID with players
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          orderBy: [
            { position: 'asc' },
            { shirtNumber: 'asc' },
          ],
        },
        _count: {
          select: { homeMatches: true, awayMatches: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.json({
      success: true,
      data: resolveTeamImages(team),
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team',
    });
  }
});

// Get team players
router.get('/:id/players', async (req, res) => {
  try {
    const { id } = req.params;

    const players = await prisma.player.findMany({
      where: { teamId: id },
      orderBy: [
        { position: 'asc' },
        { shirtNumber: 'asc' },
      ],
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

// Get team matches
router.get('/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 20 } = req.query;

    const where: any = {
      OR: [{ homeTeamId: id }, { awayTeamId: id }],
    };
    if (status) where.status = String(status);

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
      orderBy: { startTime: 'desc' },
      take: Number(limit),
    });

    res.json({
      success: true,
      data: matches.map(resolveMatchImages),
    });
  } catch (error) {
    console.error('Get team matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team matches',
    });
  }
});

// Get head-to-head stats between two teams
router.get('/:teamAId/vs/:teamBId', async (req, res) => {
  try {
    const { teamAId, teamBId } = req.params;

    // Get all matches between the two teams
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
        events: {
          where: { type: 'goal' },
          include: { player: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Calculate stats
    let teamAWins = 0;
    let teamBWins = 0;
    let draws = 0;
    let teamAGoals = 0;
    let teamBGoals = 0;

    matches.forEach((match) => {
      const isTeamAHome = match.homeTeamId === teamAId;
      const teamAScore = isTeamAHome ? match.homeScore : match.awayScore;
      const teamBScore = isTeamAHome ? match.awayScore : match.homeScore;

      teamAGoals += teamAScore;
      teamBGoals += teamBScore;

      if (teamAScore > teamBScore) teamAWins++;
      else if (teamBScore > teamAScore) teamBWins++;
      else draws++;
    });

    // Get both teams info
    const [teamA, teamB] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamAId } }),
      prisma.team.findUnique({ where: { id: teamBId } }),
    ]);

    res.json({
      success: true,
      data: {
        teamA: resolveTeamImages({
          ...teamA,
          wins: teamAWins,
          goals: teamAGoals,
        }),
        teamB: resolveTeamImages({
          ...teamB,
          wins: teamBWins,
          goals: teamBGoals,
        }),
        draws,
        totalMatches: matches.length,
        recentMatches: matches.slice(0, 5).map(resolveMatchImages),
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

// ==================== ADMIN ROUTES ====================

// Add team to competition
router.post('/:teamId/competitions/:competitionId', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { teamId, competitionId } = req.params;
    const { season = '2025-2026' } = req.body;

    // Check if already exists
    const existing = await prisma.teamCompetition.findFirst({
      where: { teamId, competitionId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Team is already in this competition',
      });
    }

    const teamCompetition = await prisma.teamCompetition.create({
      data: {
        teamId,
        competitionId,
        season,
      },
      include: {
        team: true,
        competition: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team added to competition successfully',
      data: teamCompetition,
    });
  } catch (error) {
    console.error('Add team to competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add team to competition',
    });
  }
});

// Remove team from competition
router.delete('/:teamId/competitions/:competitionId', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { teamId, competitionId } = req.params;

    await prisma.teamCompetition.deleteMany({
      where: { teamId, competitionId },
    });

    res.json({
      success: true,
      message: 'Team removed from competition successfully',
    });
  } catch (error) {
    console.error('Remove team from competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove team from competition',
    });
  }
});

// Create team with players
router.post('/', authenticate, isAdmin, logoUpload.single('logo'), async (req: AuthRequest, res) => {
  try {
    const {
      name,
      shortName,
      category,
      logoUrl,
      primaryColor,
      country,
      city,
      stadium,
      coach,
      founded,
      players,
    } = req.body;

    // Upload logo to R2 if a file was provided
    let finalLogoUrl = logoUrl;
    const file = (req as any).file;
    if (file) {
      const uploaded = await uploadToImgBB(file.buffer, `team-${Date.now()}`, file.mimetype);
      if (uploaded) {
        finalLogoUrl = uploaded;
      }
    }

    // Parse players if sent as JSON string (from FormData)
    let parsedPlayers = players;
    if (typeof players === 'string') {
      try { parsedPlayers = JSON.parse(players); } catch { parsedPlayers = undefined; }
    }

    const team = await prisma.team.create({
      data: {
        name,
        shortName,
        category: category || 'FOOTBALL',
        logoUrl: finalLogoUrl,
        primaryColor,
        country,
        city,
        stadium,
        coach,
        founded,
        players: parsedPlayers ? {
          create: parsedPlayers.map((p: any) => ({
            name: p.name,
            shirtNumber: p.shirtNumber,
            position: p.position,
            imageUrl: p.imageUrl,
            nationality: p.nationality,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
            height: p.height,
            weight: p.weight,
            preferredFoot: p.preferredFoot,
          })),
        } : undefined,
      },
      include: {
        players: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: resolveTeamImages(team),
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team',
    });
  }
});

// Update team
router.put('/:id', authenticate, isAdmin, logoUpload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coachImage', maxCount: 1 },
  { name: 'assistantCoach1Image', maxCount: 1 },
  { name: 'assistantCoach2Image', maxCount: 1 },
  { name: 'goalkeeperCoachImage', maxCount: 1 },
  { name: 'physioImage', maxCount: 1 },
]), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      shortName,
      category,
      logoUrl,
      primaryColor,
      country,
      city,
      stadium,
      coach,
      assistantCoach1,
      assistantCoach2,
      goalkeeperCoach,
      physio,
      founded,
    } = req.body;

    const files = (req as any).files || {};

    // Helper to upload a staff image
    const uploadStaffImage = async (fieldName: string, label: string): Promise<string | undefined> => {
      const file = files[fieldName]?.[0];
      if (!file) return undefined;
      const uploaded = await uploadToImgBB(file.buffer, `${label}-${Date.now()}`, file.mimetype);
      return uploaded || undefined;
    };

    // Upload logo if a new file was provided
    let finalLogoUrl = logoUrl;
    const logoFile = files.logo?.[0];
    if (logoFile) {
      const uploaded = await uploadToImgBB(logoFile.buffer, `team-${Date.now()}`, logoFile.mimetype);
      if (uploaded) {
        finalLogoUrl = uploaded;
      }
    }

    // Upload all staff images
    const finalCoachImageUrl = await uploadStaffImage('coachImage', 'coach');
    const finalAC1Image = await uploadStaffImage('assistantCoach1Image', 'ac1');
    const finalAC2Image = await uploadStaffImage('assistantCoach2Image', 'ac2');
    const finalGKCoachImage = await uploadStaffImage('goalkeeperCoachImage', 'gkcoach');
    const finalPhysioImage = await uploadStaffImage('physioImage', 'physio');

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        shortName,
        category,
        ...(finalLogoUrl !== undefined && { logoUrl: finalLogoUrl }),
        ...(finalCoachImageUrl && { coachImageUrl: finalCoachImageUrl }),
        ...(finalAC1Image && { assistantCoach1Image: finalAC1Image }),
        ...(finalAC2Image && { assistantCoach2Image: finalAC2Image }),
        ...(finalGKCoachImage && { goalkeeperCoachImage: finalGKCoachImage }),
        ...(finalPhysioImage && { physioImage: finalPhysioImage }),
        primaryColor,
        country,
        city,
        stadium,
        coach,
        ...(assistantCoach1 !== undefined && { assistantCoach1 }),
        ...(assistantCoach2 !== undefined && { assistantCoach2 }),
        ...(goalkeeperCoach !== undefined && { goalkeeperCoach }),
        ...(physio !== undefined && { physio }),
        founded,
      },
      include: {
        players: true,
      },
    });

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: resolveTeamImages(team),
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team',
    });
  }
});

// Delete team
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.team.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team',
    });
  }
});

// ==================== PLAYER MANAGEMENT ====================

// Add player to team
router.post('/:teamId/players', authenticate, isAdmin, logoUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const {
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

    // Squad size check removed – unlimited players allowed

    let finalImageUrl = imageUrl;
    const file = (req as any).file;
    if (file) {
      const uploaded = await uploadToImgBB(file.buffer, `player-${Date.now()}`, file.mimetype);
      if (uploaded) finalImageUrl = uploaded;
    }

    const player = await prisma.player.create({
      data: {
        teamId,
        name,
        shirtNumber: shirtNumber ? parseInt(shirtNumber) : undefined,
        position,
        imageUrl: finalImageUrl,
        nationality,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        preferredFoot,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Player added successfully',
      data: player,
    });
  } catch (error) {
    console.error('Add player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add player',
    });
  }
});

// Update player
router.put('/:teamId/players/:playerId', authenticate, isAdmin, logoUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { playerId } = req.params;
    const {
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

    let finalImageUrl = imageUrl;
    const file = (req as any).file;
    if (file) {
      const uploaded = await uploadToImgBB(file.buffer, `player-${Date.now()}`, file.mimetype);
      if (uploaded) finalImageUrl = uploaded;
    }

    const player = await prisma.player.update({
      where: { id: playerId },
      data: {
        name,
        shirtNumber: shirtNumber !== undefined ? parseInt(shirtNumber) : undefined,
        position,
        imageUrl: finalImageUrl,
        nationality,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        preferredFoot,
      },
    });

    res.json({
      success: true,
      message: 'Player updated successfully',
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

// Delete player
router.delete('/:teamId/players/:playerId', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { playerId } = req.params;

    await prisma.player.delete({
      where: { id: playerId },
    });

    res.json({
      success: true,
      message: 'Player deleted successfully',
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete player',
    });
  }
});

// Bulk add players to team
router.post('/:teamId/players/bulk', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const { players } = req.body;

    const createdPlayers = await prisma.player.createMany({
      data: players.map((p: any) => ({
        teamId,
        name: p.name,
        shirtNumber: p.shirtNumber,
        position: p.position,
        imageUrl: p.imageUrl,
        nationality: p.nationality,
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
        height: p.height,
        weight: p.weight,
        preferredFoot: p.preferredFoot,
      })),
    });

    res.status(201).json({
      success: true,
      message: `${createdPlayers.count} players added successfully`,
      data: { count: createdPlayers.count },
    });
  } catch (error) {
    console.error('Bulk add players error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add players',
    });
  }
});

export default router;
