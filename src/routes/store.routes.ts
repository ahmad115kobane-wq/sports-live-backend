import { Router } from 'express';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { uploadToImgBB } from '../services/imgbb.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

// Setup multer with memory storage for ImgBB upload
const storeImageUpload = multer({
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

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Get all active categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.storeCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    res.json({
      success: true,
      data: categories.map((c: any) => ({
        ...c,
        productCount: c._count.products,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error('Get store categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
});

// Get all active products (with optional filters + pagination)
router.get('/products', async (req, res) => {
  try {
    const { categoryId, search, featured, badge } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId as string;
    if (featured === 'true' || featured === 'TRUE') where.isFeatured = true;
    if (badge) where.badge = badge as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' as const } },
        { nameAr: { contains: search as string, mode: 'insensitive' as const } },
        { nameKu: { contains: search as string, mode: 'insensitive' as const } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.storeProduct.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true, categoryId: true, name: true, nameAr: true, nameKu: true,
          price: true, originalPrice: true, discount: true,
          imageUrl: true, emoji: true, badge: true,
          rating: true, reviewsCount: true,
          colors: true, sizes: true,
          inStock: true, isFeatured: true, sortOrder: true, createdAt: true,
        },
        skip,
        take: limit,
      }),
      prisma.storeProduct.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + products.length < total,
      },
    });
  } catch (error) {
    console.error('Get store products error:', error);
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

// Get single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.storeProduct.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get store product error:', error);
    res.status(500).json({ success: false, message: 'Failed to get product' });
  }
});

// Get active banners (public)
router.get('/banners', async (req, res) => {
  try {
    const now = new Date();
    const banners = await prisma.storeBanner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Get store banners error:', error);
    res.status(500).json({ success: false, message: 'Failed to get banners' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all categories (admin - includes inactive)
router.get('/admin/categories', authenticate, isAdmin, async (req, res) => {
  try {
    const categories = await prisma.storeCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    res.json({
      success: true,
      data: categories.map((c: any) => ({
        ...c,
        productCount: c._count.products,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error('Admin get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
});

// Create category (admin)
router.post('/admin/categories', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, nameAr, nameKu, icon, sortOrder, isActive } = req.body;

    if (!name || !nameAr || !nameKu) {
      return res.status(400).json({ success: false, message: 'name, nameAr, nameKu are required' });
    }

    const category = await prisma.storeCategory.create({
      data: {
        name,
        nameAr,
        nameKu,
        icon: icon || 'grid',
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// Update category (admin)
router.put('/admin/categories/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, nameAr, nameKu, icon, sortOrder, isActive } = req.body;

    const category = await prisma.storeCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(nameKu !== undefined && { nameKu }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// Delete category (admin)
router.delete('/admin/categories/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.storeCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// Get all products (admin - includes inactive)
router.get('/admin/products', authenticate, isAdmin, async (req, res) => {
  try {
    const products = await prisma.storeProduct.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { category: true },
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

// Create product (admin)
router.post('/admin/products', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      categoryId, name, nameAr, nameKu,
      description, descriptionAr, descriptionKu,
      price, originalPrice, discount,
      imageUrl, emoji, badge,
      rating, reviewsCount,
      colors, sizes,
      inStock, isFeatured, isActive, sortOrder,
    } = req.body;

    if (!categoryId || !name || !nameAr || !nameKu || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'categoryId, name, nameAr, nameKu, price are required',
      });
    }

    const product = await prisma.storeProduct.create({
      data: {
        categoryId,
        name,
        nameAr,
        nameKu,
        description: description || null,
        descriptionAr: descriptionAr || null,
        descriptionKu: descriptionKu || null,
        price,
        originalPrice: originalPrice || null,
        discount: (discount === '' || discount === undefined) ? null : discount,
        imageUrl: imageUrl || null,
        emoji: emoji || '📦',
        badge: badge || null,
        rating: rating || 0,
        reviewsCount: reviewsCount || 0,
        colors: colors ? JSON.stringify(colors) : null,
        sizes: sizes ? JSON.stringify(sizes) : null,
        inStock: inStock !== undefined ? inStock : true,
        isFeatured: isFeatured || false,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// Update product (admin)
router.put('/admin/products/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const data: any = {};
    const fields = [
      'categoryId', 'name', 'nameAr', 'nameKu',
      'description', 'descriptionAr', 'descriptionKu',
      'price', 'originalPrice', 'discount',
      'imageUrl', 'emoji', 'badge',
      'rating', 'reviewsCount',
      'inStock', 'isFeatured', 'isActive', 'sortOrder',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        // Convert empty string to null for numeric fields
        if ((field === 'discount' || field === 'originalPrice') && req.body[field] === '') {
          data[field] = null;
        } else {
          data[field] = req.body[field];
        }
      }
    }

    // Handle JSON fields
    if (req.body.colors !== undefined) {
      data.colors = Array.isArray(req.body.colors) ? JSON.stringify(req.body.colors) : req.body.colors;
    }
    if (req.body.sizes !== undefined) {
      data.sizes = Array.isArray(req.body.sizes) ? JSON.stringify(req.body.sizes) : req.body.sizes;
    }

    const product = await prisma.storeProduct.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    });

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Delete product (admin)
router.delete('/admin/products/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.storeProduct.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// ==================== ADMIN BANNER ROUTES ====================

// Get all banners (admin - includes inactive)
router.get('/admin/banners', authenticate, isAdmin, async (req, res) => {
  try {
    const banners = await prisma.storeBanner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: banners });
  } catch (error) {
    console.error('Admin get banners error:', error);
    res.status(500).json({ success: false, message: 'Failed to get banners' });
  }
});

// Create banner (admin)
router.post('/admin/banners', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      title, titleAr, titleKu,
      subtitle, subtitleAr, subtitleKu,
      imageUrl, gradientStart, gradientEnd,
      linkType, linkValue, discount,
      isActive, sortOrder, startDate, endDate,
    } = req.body;

    if (!title || !titleAr || !titleKu) {
      return res.status(400).json({ success: false, message: 'title, titleAr, titleKu are required' });
    }

    const banner = await prisma.storeBanner.create({
      data: {
        title, titleAr, titleKu,
        subtitle: subtitle || null,
        subtitleAr: subtitleAr || null,
        subtitleKu: subtitleKu || null,
        imageUrl: imageUrl || null,
        gradientStart: gradientStart || null,
        gradientEnd: gradientEnd || null,
        linkType: linkType || null,
        linkValue: linkValue || null,
        discount: discount || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
});

// Update banner (admin)
router.put('/admin/banners/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const data: any = {};
    const fields = [
      'title', 'titleAr', 'titleKu',
      'subtitle', 'subtitleAr', 'subtitleKu',
      'imageUrl', 'gradientStart', 'gradientEnd',
      'linkType', 'linkValue', 'discount',
      'isActive', 'sortOrder',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    if (req.body.startDate !== undefined) {
      data.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    }
    if (req.body.endDate !== undefined) {
      data.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    }

    const banner = await prisma.storeBanner.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
});

// Delete banner (admin)
router.delete('/admin/banners/:id', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.storeBanner.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
});

// Clean dead image URLs (admin) - removes old broken image links
router.post('/admin/clean-images', authenticate, isAdmin, async (req: AuthRequest, res) => {
  try {
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
    // Clear imageUrl for products where URL doesn't point to R2
    const products = await prisma.storeProduct.updateMany({
      where: {
        imageUrl: { not: { startsWith: R2_PUBLIC_URL || 'https://pub-' } },
        NOT: { imageUrl: null },
      },
      data: { imageUrl: null },
    });
    // Clear imageUrl for banners where URL doesn't point to R2
    const banners = await prisma.storeBanner.updateMany({
      where: {
        imageUrl: { not: { startsWith: R2_PUBLIC_URL || 'https://pub-' } },
        NOT: { imageUrl: null },
      },
      data: { imageUrl: null },
    });
    res.json({
      success: true,
      message: `Cleaned ${products.count} products and ${banners.count} banners`,
    });
  } catch (error) {
    console.error('Clean images error:', error);
    res.status(500).json({ success: false, message: 'Failed to clean images' });
  }
});

// ==================== IMAGE UPLOAD ====================

// Upload store image (admin)
router.post('/admin/upload', authenticate, isAdmin, storeImageUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!(req as any).file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    const file = (req as any).file;
    const imageUrl = await uploadToImgBB(file.buffer, `store-${Date.now()}`);
    if (!imageUrl) {
      return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
    res.json({ success: true, data: { imageUrl } });
  } catch (error) {
    console.error('Upload store image error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

export default router;
