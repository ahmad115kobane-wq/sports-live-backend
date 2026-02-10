import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail({ allow_utf8_local_part: true, require_tld: false })
      .withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'user',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email')
      .isEmail({ allow_utf8_local_part: true, require_tld: false })
      .withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }
);

// Guest Login - Create anonymous guest account
router.post('/guest', async (req: any, res: any) => {
  try {
    // Generate unique guest identifier
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const guestEmail = `${guestId}@guest.local`;
    const guestName = `ضيف ${Math.floor(Math.random() * 10000)}`;

    // Create guest user with random password (they won't use it)
    const passwordHash = await bcrypt.hash(guestId, 10);

    const user = await prisma.user.create({
      data: {
        name: guestName,
        email: guestEmail,
        passwordHash,
        role: 'guest',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' } // Longer expiry for guests
    );

    res.status(201).json({
      success: true,
      message: 'Guest account created',
      data: {
        user: {
          ...user,
          isGuest: true,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create guest account',
    });
  }
});

// Upgrade guest to full account (requires valid guest token)
router.post(
  '/upgrade-guest',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail({ allow_utf8_local_part: true, require_tld: false })
      .withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Verify caller owns this guest account via JWT
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access token required' });
      }

      const token = authHeader.split(' ')[1];
      let decoded: { id: string; role: string };
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }

      // Must be a guest account
      if (decoded.role !== 'guest') {
        return res.status(403).json({ success: false, message: 'Only guest accounts can be upgraded' });
      }

      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.update({
        where: { id: decoded.id },
        data: { name, email, passwordHash, role: 'user' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      const newToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Account upgraded successfully',
        data: { user, token: newToken },
      });
    } catch (error) {
      console.error('Upgrade guest error:', error);
      res.status(500).json({ success: false, message: 'Failed to upgrade account' });
    }
  }
);

// Delete own account (self-delete)
router.delete('/delete-account', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user and all related data (Prisma cascades will handle relations)
    await prisma.user.delete({ where: { id: decoded.id } });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
});

export default router;
