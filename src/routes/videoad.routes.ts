import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { uploadToImgBB } from '../services/imgbb.service';
import { resolveImageUrl } from '../utils/imageUrl';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

const router = Router();

// Multer for video uploads (max 50MB)
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed'));
    }
  },
});

// ==================== PUBLIC ====================

// Get a random active video ad (called on app open)
router.get('/random', async (req, res) => {
  try {
    const ads = await (prisma as any).videoAd.findMany({
      where: { isActive: true },
    });

    if (ads.length === 0) {
      return res.json({ success: true, data: null });
    }

    // Pick random ad
    const ad = ads[Math.floor(Math.random() * ads.length)];

    // Increment views (non-blocking)
    (prisma as any).videoAd.update({
      where: { id: ad.id },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    res.json({
      success: true,
      data: {
        ...ad,
        videoUrl: resolveImageUrl(ad.videoUrl),
        thumbnailUrl: resolveImageUrl(ad.thumbnailUrl),
      },
    });
  } catch (error) {
    console.error('Get random video ad error:', error);
    res.status(500).json({ success: false, message: 'Failed to get video ad' });
  }
});

// ==================== ADMIN ====================

// Get all video ads (admin)
router.get('/admin', authenticate, isAdmin, async (req, res) => {
  try {
    const ads = await (prisma as any).videoAd.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Admin get video ads error:', error);
    res.status(500).json({ success: false, message: 'Failed to get video ads' });
  }
});

// Create video ad (admin)
router.post('/admin', authenticate, isAdmin, videoUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req: AuthRequest, res) => {
  try {
    const { title, mandatorySeconds, isActive, clickUrl } = req.body;
    const files = req.files as any;

    if (!files?.video?.[0]) {
      return res.status(400).json({ success: false, message: 'Video file is required' });
    }

    const videoFile = files.video[0];
    const videoUrl = await uploadToImgBB(videoFile.buffer, `videoad-${Date.now()}`, videoFile.mimetype);
    if (!videoUrl) {
      return res.status(500).json({ success: false, message: 'Failed to upload video to R2' });
    }

    let thumbnailUrl: string | null = null;
    if (files?.thumbnail?.[0]) {
      const thumbFile = files.thumbnail[0];
      thumbnailUrl = await uploadToImgBB(thumbFile.buffer, `videoad-thumb-${Date.now()}`, thumbFile.mimetype);
    }

    const ad = await (prisma as any).videoAd.create({
      data: {
        title: title || 'Untitled Ad',
        videoUrl,
        thumbnailUrl,
        mandatorySeconds: mandatorySeconds ? parseInt(mandatorySeconds) : 5,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
        clickUrl: clickUrl || null,
      },
    });

    res.json({ success: true, data: ad });
  } catch (error) {
    console.error('Create video ad error:', error);
    res.status(500).json({ success: false, message: 'Failed to create video ad' });
  }
});

// Update video ad (admin)
router.put('/admin/:id', authenticate, isAdmin, videoUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, mandatorySeconds, isActive, clickUrl } = req.body;
    const files = req.files as any;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (mandatorySeconds !== undefined) data.mandatorySeconds = parseInt(mandatorySeconds);
    if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;
    if (clickUrl !== undefined) data.clickUrl = clickUrl || null;

    if (files?.video?.[0]) {
      const videoFile = files.video[0];
      const videoUrl = await uploadToImgBB(videoFile.buffer, `videoad-${Date.now()}`, videoFile.mimetype);
      if (videoUrl) data.videoUrl = videoUrl;
    }

    if (files?.thumbnail?.[0]) {
      const thumbFile = files.thumbnail[0];
      const thumbnailUrl = await uploadToImgBB(thumbFile.buffer, `videoad-thumb-${Date.now()}`, thumbFile.mimetype);
      if (thumbnailUrl) data.thumbnailUrl = thumbnailUrl;
    }

    const ad = await (prisma as any).videoAd.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: ad });
  } catch (error) {
    console.error('Update video ad error:', error);
    res.status(500).json({ success: false, message: 'Failed to update video ad' });
  }
});

// Delete video ad (admin)
router.delete('/admin/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await (prisma as any).videoAd.delete({ where: { id } });
    res.json({ success: true, message: 'Video ad deleted' });
  } catch (error) {
    console.error('Delete video ad error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete video ad' });
  }
});

export default router;
