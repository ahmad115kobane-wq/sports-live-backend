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
function resolveSupervisorImages(supervisor: any) {
  if (!supervisor) return supervisor;
  const BASE_URL = process.env.BASE_URL || '';
  if (supervisor.imageUrl && !supervisor.imageUrl.startsWith('http')) {
    supervisor.imageUrl = `${BASE_URL}${supervisor.imageUrl}`;
  }
  return supervisor;
}

// Get all supervisors
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

    const supervisors = await prisma.supervisor.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: supervisors.map(resolveSupervisorImages),
    });
  } catch (error) {
    console.error('Get supervisors error:', error);
    res.status(500).json({ success: false, message: 'Failed to get supervisors' });
  }
});

// Get supervisor by ID
router.get('/:id', async (req, res) => {
  try {
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: req.params.id },
    });

    if (!supervisor) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }

    res.json({ success: true, data: resolveSupervisorImages(supervisor) });
  } catch (error) {
    console.error('Get supervisor error:', error);
    res.status(500).json({ success: false, message: 'Failed to get supervisor' });
  }
});

// Create supervisor (Admin only)
router.post('/', authenticate, isAdmin, imageUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { name, nationality } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = (await uploadToImgBB(req.file.buffer, `supervisor-${Date.now()}`)) || undefined;
    }

    const supervisor = await prisma.supervisor.create({
      data: {
        name,
        nationality: nationality || undefined,
        imageUrl,
      },
    });

    res.status(201).json({ success: true, message: 'Supervisor created', data: resolveSupervisorImages(supervisor) });
  } catch (error) {
    console.error('Create supervisor error:', error);
    res.status(500).json({ success: false, message: 'Failed to create supervisor' });
  }
});

// Update supervisor (Admin only)
router.put('/:id', authenticate, isAdmin, imageUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, nationality, isActive } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (nationality !== undefined) data.nationality = nationality;
    if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      data.imageUrl = await uploadToImgBB(req.file.buffer, `supervisor-${Date.now()}`);
    }

    const supervisor = await prisma.supervisor.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Supervisor updated', data: resolveSupervisorImages(supervisor) });
  } catch (error) {
    console.error('Update supervisor error:', error);
    res.status(500).json({ success: false, message: 'Failed to update supervisor' });
  }
});

// Delete supervisor (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.supervisor.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Supervisor deleted' });
  } catch (error) {
    console.error('Delete supervisor error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete supervisor' });
  }
});

export default router;
