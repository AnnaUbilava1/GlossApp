import { PrismaClient } from '@prisma/client';
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  LEGACY_CAR_TYPE_TO_SCHEMA,
  SCHEMA_CAR_TYPE_TO_LEGACY,
} from '../utils/legacyMappings.js';

const router = express.Router();
const prisma = new PrismaClient();

// All vehicle routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/vehicles:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Search vehicles by license plate
 *     description: >
 *       Returns a list of vehicles matching the search query. Intended for
 *       autocomplete in the New Record form.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: >
 *           Partial license plate to search for. If omitted, returns the most
 *           recently created vehicles (limited).
 *     responses:
 *       200:
 *         description: List of matching vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       licensePlate:
 *                         type: string
 *                       carCategory:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/', async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const where = search
      ? {
          licensePlate: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    const vehicles = await prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        licensePlate: true,
        carCategory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Convert carCategory to legacy format for frontend
    const formattedVehicles = vehicles.map((v) => ({
      id: v.id,
      licensePlate: v.licensePlate,
      carCategory: SCHEMA_CAR_TYPE_TO_LEGACY[v.carCategory] || v.carCategory,
    }));

    res.json({ vehicles: formattedVehicles });
  } catch (error) {
    console.error('Search vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/vehicles/list:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: List all vehicles (admin)
 *     description: Returns all vehicles with pagination. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional search term for license plate
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of vehicles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 100);
    const skip = (page - 1) * limit;

    const where = search
      ? {
          licensePlate: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : {};

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        select: {
          id: true,
          licensePlate: true,
          carCategory: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);

    // Convert carCategory to legacy format
    const formattedVehicles = vehicles.map((v) => ({
      id: v.id,
      licensePlate: v.licensePlate,
      carCategory: SCHEMA_CAR_TYPE_TO_LEGACY[v.carCategory] || v.carCategory,
      createdAt: v.createdAt,
    }));

    res.json({
      vehicles: formattedVehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/vehicles:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Create a new vehicle
 *     description: Creates a new vehicle. Admin only.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - licensePlate
 *               - carType
 *             properties:
 *               licensePlate:
 *                 type: string
 *               carType:
 *                 type: string
 *                 description: Legacy car type (e.g. Sedan, Premium, Jeep)
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post(
  '/',
  requireAdmin,
  [
    body('licensePlate')
      .trim()
      .notEmpty()
      .withMessage('License plate is required')
      .isLength({ min: 1, max: 20 })
      .withMessage('License plate must be between 1 and 20 characters'),
    body('carType')
      .trim()
      .notEmpty()
      .withMessage('Car type is required')
      .custom((value) => {
        if (!LEGACY_CAR_TYPE_TO_SCHEMA[value]) {
          throw new Error(`Invalid car type: ${value}`);
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { licensePlate, carType } = req.body;
      const carCategory = LEGACY_CAR_TYPE_TO_SCHEMA[carType];

      // Check if license plate already exists
      const existing = await prisma.vehicle.findUnique({
        where: { licensePlate: licensePlate.trim() },
      });

      if (existing) {
        return res.status(400).json({ error: 'License plate already exists' });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          licensePlate: licensePlate.trim(),
          carCategory,
        },
        select: {
          id: true,
          licensePlate: true,
          carCategory: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        vehicle: {
          ...vehicle,
          carCategory: SCHEMA_CAR_TYPE_TO_LEGACY[vehicle.carCategory] || vehicle.carCategory,
        },
      });
    } catch (error) {
      console.error('Create vehicle error:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'License plate already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/vehicles/{id}:
 *   put:
 *     tags:
 *       - Vehicles
 *     summary: Update a vehicle
 *     description: Updates vehicle license plate or car type. Admin only.
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
 *             properties:
 *               licensePlate:
 *                 type: string
 *               carType:
 *                 type: string
 *                 description: Legacy car type (e.g. Sedan, Premium, Jeep)
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Vehicle not found
 */
router.put(
  '/:id',
  requireAdmin,
  [
    body('licensePlate')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('License plate must be between 1 and 20 characters'),
    body('carType')
      .optional()
      .trim()
      .custom((value) => {
        if (value && !LEGACY_CAR_TYPE_TO_SCHEMA[value]) {
          throw new Error(`Invalid car type: ${value}`);
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { licensePlate, carType } = req.body;

      // Check if vehicle exists
      const existing = await prisma.vehicle.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check if new license plate conflicts with existing
      if (licensePlate && licensePlate.trim() !== existing.licensePlate) {
        const conflict = await prisma.vehicle.findUnique({
          where: { licensePlate: licensePlate.trim() },
        });
        if (conflict) {
          return res.status(400).json({ error: 'License plate already exists' });
        }
      }

      const updateData = {};
      if (licensePlate !== undefined) {
        updateData.licensePlate = licensePlate.trim();
      }
      if (carType !== undefined) {
        updateData.carCategory = LEGACY_CAR_TYPE_TO_SCHEMA[carType];
      }

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          licensePlate: true,
          carCategory: true,
          createdAt: true,
        },
      });

      res.json({
        vehicle: {
          ...vehicle,
          carCategory: SCHEMA_CAR_TYPE_TO_LEGACY[vehicle.carCategory] || vehicle.carCategory,
        },
      });
    } catch (error) {
      console.error('Update vehicle error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'License plate already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/vehicles/{id}:
 *   delete:
 *     tags:
 *       - Vehicles
 *     summary: Delete a vehicle
 *     description: Permanently deletes a vehicle. Admin only. Requires master PIN. Cannot delete if vehicle has wash records.
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
 *             required:
 *               - masterPin
 *             properties:
 *               masterPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       400:
 *         description: Bad request (invalid PIN or vehicle has records)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Vehicle not found
 */
router.delete('/:id', requireAdmin, [body('masterPin').notEmpty().withMessage('Master PIN is required')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { masterPin } = req.body;

    // Verify master PIN
    if (masterPin !== process.env.MASTER_PIN) {
      return res.status(400).json({ error: 'Invalid master PIN' });
    }

    // Check if vehicle exists
    const existing = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        washRecords: {
          take: 1,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if vehicle has wash records
    if (existing.washRecords.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete vehicle with existing wash records',
      });
    }

    // Delete vehicle
    await prisma.vehicle.delete({
      where: { id },
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

