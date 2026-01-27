import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/records:
 *   get:
 *     tags:
 *       - Records
 *     summary: Get all wash records
 *     description: Retrieve all wash records with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unfinished, finished_unpaid, paid]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: List of wash records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 records:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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
 * @openapi
 * /api/records/{id}:
 *   get:
 *     tags:
 *       - Records
 *     summary: Get a single wash record
 *     description: Retrieve a wash record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Wash record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 record:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
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
 * @openapi
 * /api/records:
 *   post:
 *     tags:
 *       - Records
 *     summary: Create a new wash record
 *     description: Create a new wash record (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - licenseNumber
 *               - carType
 *               - serviceType
 *               - price
 *               - boxNumber
 *               - washerName
 *             properties:
 *               licenseNumber:
 *                 type: string
 *               carType:
 *                 type: string
 *                 enum: [sedan, suv, truck, motorcycle]
 *               serviceType:
 *                 type: string
 *                 enum: [basic, premium, deluxe]
 *               price:
 *                 type: number
 *               boxNumber:
 *                 type: integer
 *               washerName:
 *                 type: string
 *               companyId:
 *                 type: string
 *               discountPercent:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 record:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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
 * @openapi
 * /api/records/{id}:
 *   put:
 *     tags:
 *       - Records
 *     summary: Update a wash record
 *     description: Update a wash record (admin only, requires master PIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - masterPin
 *             properties:
 *               masterPin:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               carType:
 *                 type: string
 *               serviceType:
 *                 type: string
 *               price:
 *                 type: number
 *               isFinished:
 *                 type: boolean
 *               isPaid:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 record:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid master PIN
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
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
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     tags:
 *       - Records
 *     summary: Delete a wash record
 *     description: Delete a wash record (admin only, requires master PIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - masterPin
 *             properties:
 *               masterPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid master PIN
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
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

