import { PrismaClient } from '@prisma/client';
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication; admin-only is enforced per-route so that
// read-only type lists can be used by non-admin (e.g. staff) clients.
router.use(authenticateToken);

function ensureMasterPin(req, res) {
  const masterPin = req.body.masterPin;
  if (!masterPin || masterPin !== process.env.MASTER_PIN) {
    res.status(403).json({ error: 'Invalid master PIN' });
    return false;
  }
  return true;
}

/**
 * @openapi
 * /api/types/car:
 *   get:
 *     tags:
 *       - Types
 *     summary: List car type configurations
 *     description: Returns all configured car types (admin only).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of car types
 */
router.get('/car', async (_req, res) => {
  try {
    const types = await prisma.carType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { vehicles: true, washRecords: true, pricing: true } },
      },
    });
    const typesWithUsage = types.map((t) => {
      const { _count, ...rest } = t;
      const inUse = (_count.vehicles + _count.washRecords + _count.pricing) > 0;
      return { ...rest, inUse };
    });
    res.json({ types: typesWithUsage });
  } catch (error) {
    console.error('Get car types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/types/wash:
 *   get:
 *     tags:
 *       - Types
 *     summary: List wash type configurations
 *     description: Returns all configured wash types (admin only).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wash types
 */
router.get('/wash', async (_req, res) => {
  try {
    const types = await prisma.washType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { washRecords: true, pricing: true } },
      },
    });
    const typesWithUsage = types.map((t) => {
      const { _count, ...rest } = t;
      const inUse = (_count.washRecords + _count.pricing) > 0;
      return { ...rest, inUse };
    });
    res.json({ types: typesWithUsage });
  } catch (error) {
    console.error('Get wash types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/types/car:
 *   post:
 *     tags:
 *       - Types
 *     summary: Create a car type configuration
 *     description: Admin-only. Requires master PIN.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, displayNameKa, displayNameEn, masterPin]
 *             properties:
 *               code:
 *                 type: string
 *               displayNameKa:
 *                 type: string
 *               displayNameEn:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               masterPin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/car',
  requireAdmin,
  [
    body('code').isString().notEmpty(),
    body('displayNameKa').isString().notEmpty(),
    body('displayNameEn').isString().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (!ensureMasterPin(req, res)) return;

      const { code, displayNameKa, displayNameEn, isActive = true, sortOrder = 0 } = req.body;

      const created = await prisma.carType.create({
        data: {
          code,
          displayNameKa,
          displayNameEn,
          isActive: Boolean(isActive),
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        },
      });

      res.status(201).json({ type: created });
    } catch (error) {
      console.error('Create car type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/types/wash:
 *   post:
 *     tags:
 *       - Types
 *     summary: Create a wash type configuration
 *     description: Admin-only. Requires master PIN.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, displayNameKa, displayNameEn, masterPin]
 *             properties:
 *               code:
 *                 type: string
 *               displayNameKa:
 *                 type: string
 *               displayNameEn:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               masterPin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/wash',
  requireAdmin,
  [
    body('code').isString().notEmpty(),
    body('displayNameKa').isString().notEmpty(),
    body('displayNameEn').isString().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (!ensureMasterPin(req, res)) return;

      const { code, displayNameKa, displayNameEn, isActive = true, sortOrder = 0 } = req.body;

      const created = await prisma.washType.create({
        data: {
          code,
          displayNameKa,
          displayNameEn,
          isActive: Boolean(isActive),
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        },
      });

      res.status(201).json({ type: created });
    } catch (error) {
      console.error('Create wash type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/types/car/{id}:
 *   put:
 *     tags:
 *       - Types
 *     summary: Update a car type configuration
 *     description: Admin-only. Requires master PIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [masterPin]
 *             properties:
 *               code:
 *                 type: string
 *               displayNameKa:
 *                 type: string
 *               displayNameEn:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               masterPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  '/car/:id',
  requireAdmin,
  [],
  async (req, res) => {
    try {
      if (!ensureMasterPin(req, res)) return;

      const { id } = req.params;
      const { code, displayNameKa, displayNameEn, isActive, sortOrder } = req.body;

      const data = {};
      if (code !== undefined) data.code = String(code);
      if (displayNameKa !== undefined) data.displayNameKa = String(displayNameKa);
      if (displayNameEn !== undefined) data.displayNameEn = String(displayNameEn);
      if (isActive !== undefined) data.isActive = Boolean(isActive);
      if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

      const updated = await prisma.carType.update({
        where: { id },
        data,
      });

      res.json({ type: updated });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Car type not found' });
      }
      console.error('Update car type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/types/wash/{id}:
 *   put:
 *     tags:
 *       - Types
 *     summary: Update a wash type configuration
 *     description: Admin-only. Requires master PIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [masterPin]
 *             properties:
 *               code:
 *                 type: string
 *               displayNameKa:
 *                 type: string
 *               displayNameEn:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               masterPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  '/wash/:id',
  requireAdmin,
  [],
  async (req, res) => {
    try {
      if (!ensureMasterPin(req, res)) return;

      const { id } = req.params;
      const { code, displayNameKa, displayNameEn, isActive, sortOrder } = req.body;

      const data = {};
      if (code !== undefined) data.code = String(code);
      if (displayNameKa !== undefined) data.displayNameKa = String(displayNameKa);
      if (displayNameEn !== undefined) data.displayNameEn = String(displayNameEn);
      if (isActive !== undefined) data.isActive = Boolean(isActive);
      if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

      const updated = await prisma.washType.update({
        where: { id },
        data,
      });

      res.json({ type: updated });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Wash type not found' });
      }
      console.error('Update wash type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/types/car/{id}:
 *   delete:
 *     tags:
 *       - Types
 *     summary: Delete a car type configuration
 *     description: Admin-only. Requires master PIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [masterPin]
 *             properties:
 *               masterPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/car/:id', requireAdmin, async (req, res) => {
  try {
    if (!ensureMasterPin(req, res)) return;

    const { id } = req.params;
    const carType = await prisma.carType.findUnique({
      where: { id },
      select: { code: true },
    });
    if (!carType) {
      return res.status(404).json({ error: 'Car type not found' });
    }
    const [vehiclesCount, washRecordsCount, pricingCount] = await Promise.all([
      prisma.vehicle.count({ where: { carCategory: carType.code } }),
      prisma.washRecord.count({ where: { carCategory: carType.code } }),
      prisma.pricing.count({ where: { carCategory: carType.code } }),
    ]);
    if (vehiclesCount > 0 || washRecordsCount > 0 || pricingCount > 0) {
      return res.status(400).json({
        error: 'TYPE_IN_USE',
        message: 'This type is used by vehicles, records, or pricing and cannot be deleted. Disable it instead so it won\'t show in dropdowns.',
      });
    }
    await prisma.carType.delete({ where: { id } });
    res.json({ message: 'Car type deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Car type not found' });
    }
    console.error('Delete car type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/types/wash/{id}:
 *   delete:
 *     tags:
 *       - Types
 *     summary: Delete a wash type configuration
 *     description: Admin-only. Requires master PIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [masterPin]
 *             properties:
 *               masterPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/wash/:id', requireAdmin, async (req, res) => {
  try {
    if (!ensureMasterPin(req, res)) return;

    const { id } = req.params;
    const washType = await prisma.washType.findUnique({
      where: { id },
      select: { code: true },
    });
    if (!washType) {
      return res.status(404).json({ error: 'Wash type not found' });
    }
    const [washRecordsCount, pricingCount] = await Promise.all([
      prisma.washRecord.count({ where: { washType: washType.code } }),
      prisma.pricing.count({ where: { washType: washType.code } }),
    ]);
    if (washRecordsCount > 0 || pricingCount > 0) {
      return res.status(400).json({
        error: 'TYPE_IN_USE',
        message: 'This type is used by records or pricing and cannot be deleted. Disable it instead so it won\'t show in dropdowns.',
      });
    }
    await prisma.washType.delete({ where: { id } });
    res.json({ message: 'Wash type deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Wash type not found' });
    }
    console.error('Delete wash type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


