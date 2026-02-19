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
function resolveMemberImages(member: any) {
  if (!member) return member;
  const BASE_URL = process.env.BASE_URL || '';
  if (member.imageUrl && !member.imageUrl.startsWith('http')) {
    member.imageUrl = `${BASE_URL}${member.imageUrl}`;
  }
  return member;
}

// ══════ PUBLIC ROUTES ══════

// Get all active about members + text (public)
router.get('/', async (req, res) => {
  try {
    const members = await prisma.aboutMember.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const texts = await prisma.aboutText.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    res.json({
      success: true,
      data: {
        members: members.map(resolveMemberImages),
        text: texts[0]?.content || '',
      },
    });
  } catch (error) {
    console.error('Get about data error:', error);
    res.status(500).json({ success: false, message: 'Failed to get about data' });
  }
});

// ══════ ADMIN ROUTES ══════

// Get all members (admin - includes inactive)
router.get('/members', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const members = await prisma.aboutMember.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: members.map(resolveMemberImages) });
  } catch (error) {
    console.error('Get about members error:', error);
    res.status(500).json({ success: false, message: 'Failed to get members' });
  }
});

// Create member (Admin only)
router.post('/members', authenticate, isAdmin, imageUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { name, title, sortOrder } = req.body;

    if (!name || !title) {
      return res.status(400).json({ success: false, message: 'Name and title are required' });
    }

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = (await uploadToImgBB(req.file.buffer, `about-member-${Date.now()}`)) || undefined;
    }

    const member = await prisma.aboutMember.create({
      data: {
        name,
        title,
        imageUrl,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    });

    res.status(201).json({ success: true, message: 'Member created', data: resolveMemberImages(member) });
  } catch (error) {
    console.error('Create about member error:', error);
    res.status(500).json({ success: false, message: 'Failed to create member' });
  }
});

// Update member (Admin only)
router.put('/members/:id', authenticate, isAdmin, imageUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, title, sortOrder, isActive } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (title !== undefined) data.title = title;
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder);
    if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      data.imageUrl = await uploadToImgBB(req.file.buffer, `about-member-${Date.now()}`);
    }

    const member = await prisma.aboutMember.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Member updated', data: resolveMemberImages(member) });
  } catch (error) {
    console.error('Update about member error:', error);
    res.status(500).json({ success: false, message: 'Failed to update member' });
  }
});

// Delete member (Admin only)
router.delete('/members/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.aboutMember.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    console.error('Delete about member error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete member' });
  }
});

// Update about text (Admin only)
router.put('/text', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;

    // Upsert - update existing or create new
    const existing = await prisma.aboutText.findFirst({ where: { isActive: true } });

    let text;
    if (existing) {
      text = await prisma.aboutText.update({
        where: { id: existing.id },
        data: { content },
      });
    } else {
      text = await prisma.aboutText.create({
        data: { content },
      });
    }

    res.json({ success: true, message: 'Text updated', data: text });
  } catch (error) {
    console.error('Update about text error:', error);
    res.status(500).json({ success: false, message: 'Failed to update text' });
  }
});

export default router;
