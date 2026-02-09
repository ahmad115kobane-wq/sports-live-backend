import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

// Setup multer for slider image uploads
const sliderStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const dir = path.join(__dirname, '../../public/sliders');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    cb(null, `slider-${Date.now()}${ext}`);
  },
});
const uploadSlider = multer({ storage: sliderStorage });

const router = Router();

// ==================== PUBLIC ====================

// Get active sliders
router.get('/', async (req, res) => {
  try {
    const sliders = await prisma.homeSlider.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: sliders });
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

    const imageUrl = `/sliders/${file.filename}`;

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
      // Delete old image
      const old = await prisma.homeSlider.findUnique({ where: { id } });
      if (old?.imageUrl) {
        const oldPath = path.join(__dirname, '../../public', old.imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.imageUrl = `/sliders/${file.filename}`;
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

    // Delete image file
    const slider = await prisma.homeSlider.findUnique({ where: { id } });
    if (slider?.imageUrl) {
      const imgPath = path.join(__dirname, '../../public', slider.imageUrl);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await prisma.homeSlider.delete({ where: { id } });
    res.json({ success: true, message: 'Slider deleted' });
  } catch (error) {
    console.error('Delete slider error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete slider' });
  }
});

export default router;
