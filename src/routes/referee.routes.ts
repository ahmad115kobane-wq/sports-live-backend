import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { uploadToImgBB } from '../services/imgbb.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

// Helper to resolve image URLs
function resolveRefereeImages(referee: any) {
  if (!referee) return referee;
  const BASE_URL = process.env.BASE_URL || '';
  if (referee.imageUrl && !referee.imageUrl.startsWith('http')) {
    referee.imageUrl = `${BASE_URL}${referee.imageUrl}`;
  }
  return referee;
}

// Get all referees
router.get('/', async (req, res) => {
  try {
    const { search, active } = req.query;
    const where: any = {};

    if (search) {
      where.name = { contains: String(search), mode: 'insensitive' };
    }
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const referees = await prisma.referee.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: referees.map(resolveRefereeImages),
    });
  } catch (error) {
    console.error('Get referees error:', error);
    res.status(500).json({ success: false, message: 'Failed to get referees' });
  }
});

// Get referee by ID
router.get('/:id', async (req, res) => {
  try {
    const referee = await prisma.referee.findUnique({
      where: { id: req.params.id },
    });

    if (!referee) {
      return res.status(404).json({ success: false, message: 'Referee not found' });
    }

    res.json({ success: true, data: resolveRefereeImages(referee) });
  } catch (error) {
    console.error('Get referee error:', error);
    res.status(500).json({ success: false, message: 'Failed to get referee' });
  }
});

// Create referee (Admin only)
router.post('/', authenticate, isAdmin, imageUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { name, nationality } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await uploadToImgBB(req.file.buffer, `referee-${Date.now()}`);
    }

    const referee = await prisma.referee.create({
      data: {
        name,
        nationality: nationality || undefined,
        imageUrl,
      },
    });

    res.status(201).json({ success: true, message: 'Referee created', data: resolveRefereeImages(referee) });
  } catch (error) {
    console.error('Create referee error:', error);
    res.status(500).json({ success: false, message: 'Failed to create referee' });
  }
});

// Update referee (Admin only)
router.put('/:id', authenticate, isAdmin, imageUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, nationality, isActive } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (nationality !== undefined) data.nationality = nationality;
    if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      data.imageUrl = await uploadToImgBB(req.file.buffer, `referee-${Date.now()}`);
    }

    const referee = await prisma.referee.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Referee updated', data: resolveRefereeImages(referee) });
  } catch (error) {
    console.error('Update referee error:', error);
    res.status(500).json({ success: false, message: 'Failed to update referee' });
  }
});

// Delete referee (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.referee.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Referee deleted' });
  } catch (error) {
    console.error('Delete referee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete referee' });
  }
});

export default router;
