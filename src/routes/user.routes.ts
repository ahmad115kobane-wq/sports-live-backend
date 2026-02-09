import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

// Setup multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const dir = path.join(__dirname, '../../public/avatars');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

// Register/Update push token
router.post('/push-token', authenticate, async (req: AuthRequest, res) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required',
      });
    }

    // FCM tokens are longer than 100 characters
    if (pushToken.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FCM push token',
      });
    }

    // Clear this token from any other user first (prevents duplicates)
    await prisma.user.updateMany({
      where: {
        pushToken,
        id: { not: req.user!.id },
      },
      data: { pushToken: null },
    });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { pushToken },
    });

    console.log(`📱 Push token registered for user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Push token registered successfully',
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register push token',
    });
  }
});

// Delete push token (logout)
router.delete('/push-token', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { pushToken: null },
    });

    console.log(`📱 Push token removed for user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Push token removed successfully',
    });
  } catch (error) {
    console.error('Remove push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push token',
    });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
});

// Get user favorites
router.get('/favorites', authenticate, async (req: AuthRequest, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            competition: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favorites',
    });
  }
});

// Add match to favorites
router.post('/favorites/:matchId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const existing = await prisma.favorite.findFirst({
      where: { userId: req.user!.id, matchId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Match already in favorites',
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        matchId,
      },
      include: {
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
      message: 'Match added to favorites',
      data: favorite,
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favorite',
    });
  }
});

// Remove match from favorites
router.delete('/favorites/:matchId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user!.id,
        matchId,
      },
    });

    res.json({
      success: true,
      message: 'Match removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favorite',
    });
  }
});

// Get user preferences
router.get('/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    });

    const preferences = user?.preferences ? JSON.parse(user.preferences) : {
      favoriteTeams: [],
      favoriteCompetitions: [],
      notifications: {
        enabled: true,
        preMatch: true,
        matchStart: true,
        goals: true,
        redCards: true,
        penalties: true,
        matchEnd: true,
      },
    };

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
    });
  }
});

// Update user preferences
router.put('/preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const { notifications, favoriteTeams, favoriteCompetitions, language } = req.body;

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    });

    const currentPreferences = user?.preferences ? JSON.parse(user.preferences) : {};

    // Merge with new preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...(notifications && { notifications }),
      ...(favoriteTeams && { favoriteTeams }),
      ...(favoriteCompetitions && { favoriteCompetitions }),
      ...(language && { language }),
    };

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { preferences: JSON.stringify(updatedPreferences) },
    });

    console.log(`⚙️ Preferences updated for user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
    });
  }
});

// Update profile (name and/or password)
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const updateData: any = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { passwordHash: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
        });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// Upload avatar (publisher and admin only)
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    // Only publisher and admin can set avatar
    if (req.user!.role !== 'publisher' && req.user!.role !== 'admin') {
      // Delete uploaded file if unauthorized
      if ((req as any).file) {
        fs.unlinkSync((req as any).file.path);
      }
      return res.status(403).json({
        success: false,
        message: 'Only publishers and admins can set an avatar',
      });
    }

    if (!(req as any).file) {
      return res.status(400).json({
        success: false,
        message: 'Avatar image is required',
      });
    }

    const avatarPath = `/avatars/${(req as any).file.filename}`;

    // Delete old avatar file if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { avatar: true },
    });

    if (currentUser?.avatar) {
      const oldPath = path.join(__dirname, '../../public', currentUser.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarPath },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
    });
  }
});

export default router;
