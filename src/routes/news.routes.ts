import { Router, Request } from 'express';
import { authenticate, isPublisher, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import admin from 'firebase-admin';
import { uploadToImgBB } from '../services/imgbb.service';
import { resolveImageUrl, toRelativeImagePath } from '../utils/imageUrl';

const MAX_ARTICLE_IMAGES = 9;

function normalizeArticleImageUrls(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      return [];
    }
  }

  return [];
}

function collectUploadedImages(req: Request): any[] {
  const files = (req as any).files;
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return [...(files.image || []), ...(files.images || [])];
}

// Resolve author avatar + article imageUrl for mobile consumption
function resolveArticle(article: any) {
  if (!article) return article;
  const resolved = { ...article };
  const imageUrls = normalizeArticleImageUrls(resolved.imageUrls)
    .map(url => resolveImageUrl(url))
    .filter((url): url is string => !!url);

  const legacyImageUrl = resolveImageUrl(resolved.imageUrl);
  const mergedImageUrls = [...imageUrls];

  if (legacyImageUrl && !mergedImageUrls.includes(legacyImageUrl)) {
    mergedImageUrls.unshift(legacyImageUrl);
  }

  const finalImageUrls = mergedImageUrls.slice(0, MAX_ARTICLE_IMAGES);
  resolved.imageUrls = finalImageUrls;
  resolved.imageUrl = finalImageUrls[0] || null;

  if (resolved.author && resolved.author.avatar) {
    resolved.author = { ...resolved.author, avatar: toRelativeImagePath(resolved.author.avatar) };
  }
  return resolved;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

const router = Router();

// Setup multer with memory storage for ImgBB upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const uploadArticleImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: MAX_ARTICLE_IMAGES },
]);

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
      data: articles.map(resolveArticle),
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

    res.json({ success: true, data: articles.map(resolveArticle) });
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

    res.json({ success: true, data: resolveArticle(article) });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ success: false, message: 'Failed to get article' });
  }
});

// Create article (publisher/admin only)
router.post('/', authenticate, isPublisher, uploadArticleImages, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const uploadedFiles = collectUploadedImages(req).slice(0, MAX_ARTICLE_IMAGES);
    console.log('📸 News uploaded files:', uploadedFiles.length, uploadedFiles.map(f => ({ originalname: f.originalname, mimetype: f.mimetype, size: f.size })));
    
    const uploadedImageUrls: string[] = [];

    for (const file of uploadedFiles) {
      console.log('📤 Uploading file:', file.originalname);
      const uploaded = await uploadToImgBB(file.buffer, `news-${Date.now()}`);
      console.log('📤 Upload result:', uploaded ? 'SUCCESS' : 'FAILED');
      if (uploaded) uploadedImageUrls.push(uploaded);
    }

    console.log('📸 Final uploaded URLs:', uploadedImageUrls);
    const coverImageUrl = uploadedImageUrls[0];

    const article = await (prisma as any).newsArticle.create({
      data: {
        title,
        content,
        imageUrl: coverImageUrl,
        imageUrls: uploadedImageUrls,
        authorId: req.user!.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Emit socket event for real-time feed
    const resolvedArticle = resolveArticle(article);
    const io = req.app.get('io');
    io.emit('news:new', { article: resolvedArticle });

    // Respond immediately so the client doesn't timeout
    res.status(201).json({ success: true, message: 'Article published', data: resolvedArticle });

    // Send push notification to ALL users (fire-and-forget, after response)
    // Use the raw R2 public URL directly — FCM fetches from Google servers,
    // so it needs a direct public URL, not our backend proxy
    const fullImageUrl = coverImageUrl || undefined;

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
                ...(fullImageUrl ? { imageUrl: fullImageUrl } : {}),
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
router.put('/:id', authenticate, isPublisher, uploadArticleImages, async (req: AuthRequest, res) => {
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
    const uploadedFiles = collectUploadedImages(req).slice(0, MAX_ARTICLE_IMAGES);
    if (uploadedFiles.length > 0) {
      const uploadedImageUrls: string[] = [];
      for (const file of uploadedFiles) {
        const uploaded = await uploadToImgBB(file.buffer, `news-${Date.now()}`);
        if (uploaded) uploadedImageUrls.push(uploaded);
      }

      if (uploadedImageUrls.length > 0) {
        updateData.imageUrls = uploadedImageUrls;
        updateData.imageUrl = uploadedImageUrls[0];
      }
    }

    const updated = await (prisma as any).newsArticle.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({ success: true, message: 'Article updated', data: resolveArticle(updated) });
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

    // ImgBB images are cloud-hosted, no local file to delete

    await (prisma as any).newsArticle.delete({ where: { id } });

    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete article' });
  }
});

export default router;
