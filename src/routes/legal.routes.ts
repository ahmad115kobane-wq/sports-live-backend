import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

const router = Router();

// ── Public: Get all active legal pages (list only, no content) ──
router.get('/', async (req, res) => {
  try {
    const pages = await prisma.legalPage.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        title: true,
        titleAr: true,
        titleKu: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Get legal pages error:', error);
    res.status(500).json({ success: false, message: 'Failed to get legal pages' });
  }
});

// ── Public: Get single legal page by slug ──
router.get('/:slug', async (req, res) => {
  try {
    const page = await prisma.legalPage.findUnique({
      where: { slug: req.params.slug },
    });
    if (!page || !page.isActive) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Get legal page error:', error);
    res.status(500).json({ success: false, message: 'Failed to get legal page' });
  }
});

// ── Admin: Get all legal pages (including inactive) ──
router.get('/admin/all', authenticate, isAdmin, async (req, res) => {
  try {
    const pages = await prisma.legalPage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Admin get legal pages error:', error);
    res.status(500).json({ success: false, message: 'Failed to get legal pages' });
  }
});

// ── Admin: Create legal page ──
router.post('/admin', authenticate, isAdmin, async (req, res) => {
  try {
    const { slug, title, titleAr, titleKu, content, contentAr, contentKu, isActive, sortOrder } = req.body;
    if (!slug || !title || !titleAr || !titleKu) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const page = await prisma.legalPage.create({
      data: {
        slug,
        title,
        titleAr,
        titleKu,
        content: content || '',
        contentAr: contentAr || '',
        contentKu: contentKu || '',
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });
    res.json({ success: true, data: page });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }
    console.error('Create legal page error:', error);
    res.status(500).json({ success: false, message: 'Failed to create legal page' });
  }
});

// ── Admin: Update legal page ──
router.put('/admin/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { slug, title, titleAr, titleKu, content, contentAr, contentKu, isActive, sortOrder } = req.body;
    const page = await prisma.legalPage.update({
      where: { id: req.params.id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(titleAr !== undefined && { titleAr }),
        ...(titleKu !== undefined && { titleKu }),
        ...(content !== undefined && { content }),
        ...(contentAr !== undefined && { contentAr }),
        ...(contentKu !== undefined && { contentKu }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });
    res.json({ success: true, data: page });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }
    console.error('Update legal page error:', error);
    res.status(500).json({ success: false, message: 'Failed to update legal page' });
  }
});

// ── Admin: Delete legal page ──
router.delete('/admin/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await prisma.legalPage.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Legal page deleted' });
  } catch (error) {
    console.error('Delete legal page error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete legal page' });
  }
});

export default router;
