import { Router, Request } from 'express';
import { authenticate, isPublisher, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

const router = Router();

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const dir = path.join(__dirname, '../../public/news');
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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get all published news (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [articles, total] = await Promise.all([
      (prisma as any).newsArticle.findMany({
        where: { isPublished: true },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      (prisma as any).newsArticle.count({ where: { isPublished: true } }),
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ success: false, message: 'Failed to get news' });
  }
});

// Get my articles (publisher's own articles) - MUST be before /:id
router.get('/my/articles', authenticate, isPublisher, async (req: AuthRequest, res) => {
  try {
    const articles = await (prisma as any).newsArticle.findMany({
      where: { authorId: req.user!.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: articles });
  } catch (error) {
    console.error('Get my articles error:', error);
    res.status(500).json({ success: false, message: 'Failed to get articles' });
  }
});

// Get single article
router.get('/:id', async (req, res) => {
  try {
    const article = await (prisma as any).newsArticle.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ success: false, message: 'Failed to get article' });
  }
});

// Create article (publisher/admin only)
router.post('/', authenticate, isPublisher, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    let imageUrl: string | undefined;
    if ((req as any).file) {
      imageUrl = `/news/${(req as any).file.filename}`;
    }

    const article = await (prisma as any).newsArticle.create({
      data: {
        title,
        content,
        imageUrl,
        authorId: req.user!.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Emit socket event for real-time feed
    const io = req.app.get('io');
    io.emit('news:new', { article });

    // Respond immediately so the client doesn't timeout
    res.status(201).json({ success: true, message: 'Article published', data: article });

    // Send push notification to ALL users (fire-and-forget, after response)
    // ملاحظة: imageUrl في FCM يتطلب رابط عام (https://yourdomain.com/news/image.jpg)
    // على خادم محلي (192.168.x.x) لن تظهر الصورة — ستعمل فقط على خادم حقيقي
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fullImageUrl = imageUrl ? `${baseUrl}${imageUrl}` : undefined;

    (async () => {
      try {
        const usersWithTokens = await prisma.user.findMany({
          where: { pushToken: { not: null } },
          select: { pushToken: true },
        });

        const tokens = [...new Set(
          usersWithTokens
            .map((u: any) => u.pushToken)
            .filter((t: string | null): t is string => !!t)
        )];

        if (tokens.length > 0) {
          const notifTitle = '📰 ' + title;
          const notifBody = content.substring(0, 100) + (content.length > 100 ? '...' : '');

          for (let i = 0; i < tokens.length; i += 500) {
            const batch = tokens.slice(i, i + 500);
            const message: admin.messaging.MulticastMessage = {
              tokens: batch,
              notification: {
                title: notifTitle,
                body: notifBody,
                imageUrl: fullImageUrl,
              },
              data: {
                type: 'news',
                articleId: article.id,
              },
              android: {
                priority: 'high',
                collapseKey: `news_${article.id}`,
                notification: {
                  channelId: 'match-notifications',
                  sound: 'default',
                  imageUrl: fullImageUrl,
                  tag: `news_${article.id}`,
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    'mutable-content': 1,
                    'thread-id': `news_${article.id}`,
                  },
                },
                fcmOptions: {
                  imageUrl: fullImageUrl,
                },
              },
            };
            const result = await admin.messaging().sendEachForMulticast(message);
            console.log(`📊 FCM batch result: ${result.successCount} success, ${result.failureCount} failed`);
            result.responses.forEach((resp, idx) => {
              if (!resp.success) {
                console.error(`❌ FCM error for token[${idx}]:`, resp.error?.code, resp.error?.message);
              }
            });
          }
          console.log(`📢 News notification sent to ${tokens.length} devices (image: ${fullImageUrl || 'none'})`);
        }
      } catch (notifError) {
        console.error('Error sending news notifications:', notifError);
      }
    })();
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ success: false, message: 'Failed to create article' });
  }
});

// Update article (publisher who owns it, or admin)
router.put('/:id', authenticate, isPublisher, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPublished } = req.body;

    const article = await (prisma as any).newsArticle.findUnique({ where: { id } });
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Only author or admin can edit
    if (article.authorId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (isPublished !== undefined) updateData.isPublished = isPublished === 'true' || isPublished === true;
    if ((req as any).file) updateData.imageUrl = `/news/${(req as any).file.filename}`;

    const updated = await (prisma as any).newsArticle.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({ success: true, message: 'Article updated', data: updated });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ success: false, message: 'Failed to update article' });
  }
});

// Delete article (publisher who owns it, or admin)
router.delete('/:id', authenticate, isPublisher, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const article = await (prisma as any).newsArticle.findUnique({ where: { id } });
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.authorId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete image file if exists
    if (article.imageUrl) {
      const imagePath = path.join(__dirname, '../../public', article.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await (prisma as any).newsArticle.delete({ where: { id } });

    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete article' });
  }
});

export default router;
