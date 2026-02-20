import { Router } from 'express';
import { authenticate, isAdmin, isMerchant, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { sendFCMNotification } from '../services/firebase.service';

const router = Router();

// ==================== USER ROUTES ====================

// Create order (authenticated user)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { customerName, customerPhone, customerAddress, items, deliveryFee } = req.body;

    if (!customerName?.trim() || !customerPhone?.trim() || !customerAddress?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, and address are required',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = items.map((item: any) => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        productName: item.productName,
        productNameAr: item.productNameAr,
        productNameKu: item.productNameKu,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
        imageUrl: item.imageUrl || null,
      };
    });

    const finalDeliveryFee = typeof deliveryFee === 'number' ? deliveryFee : 0;
    const order = await prisma.storeOrder.create({
      data: {
        userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        totalAmount: totalAmount + finalDeliveryFee,
        deliveryFee: finalDeliveryFee,
        status: 'pending',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Send notification to all admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'admin', pushToken: { not: null } },
      });

      for (const admin of admins) {
        if (admin.pushToken) {
          await sendFCMNotification({
            token: admin.pushToken,
            title: 'طلب شراء جديد',
            body: `طلب جديد من ${customerName} - ${items.length} منتج - ${Math.round(totalAmount + finalDeliveryFee).toLocaleString()} د.ع`,
            data: {
              type: 'new_order',
              orderId: order.id,
            },
          });
        }
      }

      // Save notification for admins
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'new_order',
            title: 'طلب شراء جديد',
            body: `طلب جديد من ${customerName} - ${items.length} منتج - ${Math.round(totalAmount + finalDeliveryFee).toLocaleString()} د.ع`,
            data: JSON.stringify({ orderId: order.id }),
            isRead: false,
          },
        });
      }
    } catch (notifError) {
      console.error('Error sending order notification to admins:', notifError);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/my-orders', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const orders = await prisma.storeOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all orders (admin)
router.get('/admin/all', authenticate, isMerchant, async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status as string;
    }

    const orders = await prisma.storeOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { emoji: true, imageUrl: true },
            },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

// Update order status (admin) - approve/reject/deliver
router.put('/admin/:id/status', authenticate, isMerchant, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, estimatedDelivery, deliveryFee } = req.body;

    if (!['approved', 'rejected', 'delivered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: approved, rejected, or delivered',
      });
    }

    const updateData: any = {
        status,
        adminNote: adminNote || null,
        estimatedDelivery: estimatedDelivery || null,
      };
    if (typeof deliveryFee === 'number') {
      updateData.deliveryFee = deliveryFee;
    }
    const order = await prisma.storeOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, pushToken: true } },
      },
    });

    // Send notification to user
    try {
      const user = await prisma.user.findUnique({ where: { id: order.userId } });

      if (user?.pushToken) {
        let title = '';
        let body = '';

        if (status === 'approved') {
          title = 'تم قبول طلبك';
          body = estimatedDelivery
            ? `تم قبول طلب الشراء الخاص بك. مدة التوصيل المتوقعة: ${estimatedDelivery}`
            : 'تم قبول طلب الشراء الخاص بك وسيتم التوصيل قريباً';
          if (adminNote) body += `\n${adminNote}`;
        } else if (status === 'rejected') {
          title = 'تم رفض طلبك';
          body = adminNote || 'تم رفض طلب الشراء الخاص بك';
        } else if (status === 'delivered') {
          title = 'تم التوصيل';
          body = 'تم توصيل طلبك بنجاح. شكراً لتسوقك معنا!';
        }

        await sendFCMNotification({
          token: user.pushToken,
          title,
          body,
          data: {
            type: 'order_status',
            orderId: order.id,
            status,
          },
        });

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'order_status',
            title,
            body,
            data: JSON.stringify({ orderId: order.id, status }),
            isRead: false,
          },
        });
      }
    } catch (notifError) {
      console.error('Error sending order status notification:', notifError);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// Get order counts by status (admin)
router.get('/admin/counts', authenticate, isMerchant, async (req, res) => {
  try {
    const [pending, approved, rejected, delivered, total] = await Promise.all([
      prisma.storeOrder.count({ where: { status: 'pending' } }),
      prisma.storeOrder.count({ where: { status: 'approved' } }),
      prisma.storeOrder.count({ where: { status: 'rejected' } }),
      prisma.storeOrder.count({ where: { status: 'delivered' } }),
      prisma.storeOrder.count(),
    ]);

    res.json({
      success: true,
      data: { pending, approved, rejected, delivered, total },
    });
  } catch (error) {
    console.error('Get order counts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get order counts' });
  }
});

export default router;
