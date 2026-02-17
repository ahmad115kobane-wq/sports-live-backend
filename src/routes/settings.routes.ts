import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// Get all public settings (for the app)
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany();
    const result: Record<string, string> = {};
    settings.forEach((s: any) => {
      result[s.key] = s.value;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

// Admin: Get all settings
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Admin get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

// Admin: Update settings (batch upsert)
router.put('/admin', authenticate, isAdmin, async (req, res) => {
  try {
    const { settings } = req.body; // { key: value, key: value, ... }
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings data' });
    }

    const upserts = Object.entries(settings).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await prisma.$transaction(upserts);

    const allSettings = await prisma.appSetting.findMany();
    const result: Record<string, string> = {};
    allSettings.forEach((s: any) => {
      result[s.key] = s.value;
    });

    res.json({ success: true, message: 'Settings updated', data: result });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

export default router;
