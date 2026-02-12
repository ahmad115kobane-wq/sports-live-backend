import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { uploadToImgBB } from '../services/imgbb.service';
import { resolveImageUrl } from '../utils/imageUrl';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

// Setup multer with memory storage for ImgBB upload
const uploadSlider = multer({
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

// Ensure sliders directory exists
const SLIDER_DIR = path.join(process.cwd(), 'public/sliders');
fs.mkdirSync(SLIDER_DIR, { recursive: true });

// ==================== PUBLIC ====================

// Get active sliders
router.get('/', async (req, res) => {
  try {
    const sliders = await prisma.homeSlider.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: sliders.map((s: any) => ({ ...s, imageUrl: resolveImageUrl(s.imageUrl) })) });
  } catch (error) {
    console.error('Get sliders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sliders' });
  }
});

// ==================== ADMIN ====================

// Get all sliders (admin)
router.get('/admin', authenticate, isAdmin, async (req, res) => {
  try {
    const sliders = await prisma.homeSlider.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: sliders });
  } catch (error) {
    console.error('Admin get sliders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sliders' });
  }
});

// Create slider (admin)
router.post('/admin', authenticate, isAdmin, uploadSlider.single('image'), async (req: AuthRequest, res) => {
  try {
    const { title, linkUrl, isActive, sortOrder } = req.body;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    // Save locally (primary)
    const mimeExt: Record<string, string> = { 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/jpeg': 'jpg', 'image/jpg': 'jpg' };
    const ext = mimeExt[file.mimetype] || 'jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(SLIDER_DIR, filename), file.buffer);
    const imageUrl = `/sliders/${filename}`;

    // R2 backup (non-blocking)
    uploadToImgBB(file.buffer, `slider-${Date.now()}`, file.mimetype).catch(() => {});

    const slider = await prisma.homeSlider.create({
      data: {
        title: title || null,
        imageUrl,
        linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    });

    res.json({ success: true, data: slider });
  } catch (error) {
    console.error('Create slider error:', error);
    res.status(500).json({ success: false, message: 'Failed to create slider' });
  }
});

// Update slider (admin)
router.put('/admin/:id', authenticate, isAdmin, uploadSlider.single('image'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, linkUrl, isActive, sortOrder } = req.body;
    const file = (req as any).file;

    const data: any = {};
    if (title !== undefined) data.title = title || null;
    if (linkUrl !== undefined) data.linkUrl = linkUrl || null;
    if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder);

    if (file) {
      // Save locally (primary)
      const mimeExt: Record<string, string> = { 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/jpeg': 'jpg', 'image/jpg': 'jpg' };
      const ext = mimeExt[file.mimetype] || 'jpg';
      const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(SLIDER_DIR, filename), file.buffer);
      data.imageUrl = `/sliders/${filename}`;
      // R2 backup (non-blocking)
      uploadToImgBB(file.buffer, `slider-${Date.now()}`, file.mimetype).catch(() => {});
    }

    const slider = await prisma.homeSlider.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: slider });
  } catch (error) {
    console.error('Update slider error:', error);
    res.status(500).json({ success: false, message: 'Failed to update slider' });
  }
});

// Delete slider (admin)
router.delete('/admin/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // ImgBB images are cloud-hosted, no local file to delete

    await prisma.homeSlider.delete({ where: { id } });
    res.json({ success: true, message: 'Slider deleted' });
  } catch (error) {
    console.error('Delete slider error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete slider' });
  }
});

export default router;
