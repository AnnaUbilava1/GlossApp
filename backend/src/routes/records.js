import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/records
 * Get all wash records (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50 } = req.query;

    const where = {};
    
    if (status === 'unfinished') {
      where.isFinished = false;
    } else if (status === 'finished_unpaid') {
      where.isFinished = true;
      where.isPaid = false;
    } else if (status === 'paid') {
      where.isPaid = true;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const records = await prisma.washRecord.findMany({
      where,
      include: {
        company: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
    });

    res.json({ records });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/records/:id
 * Get a single wash record
 */
router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.washRecord.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ record });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/records
 * Create a new wash record
 */
router.post(
  '/',
  [
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    body('carType').isIn(['sedan', 'suv', 'truck', 'motorcycle']),
    body('serviceType').isIn(['basic', 'premium', 'deluxe']),
    body('price').isFloat({ min: 0 }),
    body('boxNumber').isInt({ min: 1 }),
    body('washerName').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        licenseNumber,
        carType,
        serviceType,
        companyId,
        discountPercent = 0,
        price,
        boxNumber,
        washerName,
      } = req.body;

      const record = await prisma.washRecord.create({
        data: {
          licenseNumber,
          carType,
          serviceType,
          companyId: companyId || null,
          discountPercent,
          price,
          boxNumber,
          washerName,
          createdById: req.user.id,
        },
        include: {
          company: true,
        },
      });

      res.status(201).json({ record });
    } catch (error) {
      console.error('Create record error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/records/:id
 * Update a wash record (admin only, requires master PIN)
 */
router.put(
  '/:id',
  requireAdmin,
  [
    body('masterPin').notEmpty().withMessage('Master PIN is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify master PIN
      if (req.body.masterPin !== process.env.MASTER_PIN) {
        return res.status(403).json({ error: 'Invalid master PIN' });
      }

      const { id } = req.params;
      const updateData = { ...req.body };
      delete updateData.masterPin; // Remove masterPin from update data

      // Convert date strings to Date objects if present
      if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
      if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);

      const record = await prisma.washRecord.update({
        where: { id },
        data: updateData,
        include: {
          company: true,
        },
      });

      res.json({ record });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' });
      }
      console.error('Update record error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/records/:id
 * Delete a wash record (admin only, requires master PIN)
 */
router.delete(
  '/:id',
  requireAdmin,
  [
    body('masterPin').notEmpty().withMessage('Master PIN is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify master PIN
      if (req.body.masterPin !== process.env.MASTER_PIN) {
        return res.status(403).json({ error: 'Invalid master PIN' });
      }

      await prisma.washRecord.delete({
        where: { id: req.params.id },
      });

      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' });
      }
      console.error('Delete record error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

