import { PrismaClient } from '@prisma/client';
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  LEGACY_CAR_TYPE_TO_SCHEMA,
  LEGACY_SERVICE_TYPE_TO_SCHEMA,
  SCHEMA_CAR_TYPE_TO_LEGACY,
  SCHEMA_WASH_TYPE_TO_LEGACY,
} from '../utils/legacyMappings.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * @openapi
 * /api/pricing/quote:
 *   get:
 *     tags:
 *       - Pricing
 *     summary: Get a price quote
 *     description: Returns original and discounted price for a given car/service type. Uses the Pricing matrix in the database.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: carType
 *         schema:
 *           type: string
 *         description: Legacy car type (e.g. Sedan, Premium, Jeep)
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Legacy service type (e.g. Complete Wash, Outer Wash)
 *       - in: query
 *         name: discountPercent
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: Quote
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Pricing not found
 */
router.get('/quote', async (req, res) => {
  try {
    const carType = req.query.carType ? String(req.query.carType) : null;
    const serviceType = req.query.serviceType ? String(req.query.serviceType) : null;
    const discountPercent = req.query.discountPercent ? Number(req.query.discountPercent) : 0;
    const washerId = req.query.washerId ? Number(req.query.washerId) : null;
    const washerUsername = req.query.washerUsername ? String(req.query.washerUsername) : null;

    if (!carType || !serviceType) {
      return res.status(400).json({ error: 'carType and serviceType are required' });
    }
    if (!washerId && !washerUsername) {
      return res.status(400).json({ error: 'washerId or washerUsername is required' });
    }

    const carCategory = LEGACY_CAR_TYPE_TO_SCHEMA[carType];
    const washType = LEGACY_SERVICE_TYPE_TO_SCHEMA[serviceType];

    if (!carCategory) return res.status(400).json({ error: `Unsupported carType: ${carType}` });
    if (!washType) return res.status(400).json({ error: `Unsupported serviceType: ${serviceType}` });

    const pricing = await prisma.pricing.findUnique({
      where: { carCategory_washType: { carCategory, washType } },
      select: { price: true },
    });

    if (!pricing) {
      console.error(`Pricing not found for carCategory: ${carCategory}, washType: ${washType}`);
      return res.status(404).json({ error: `Pricing not found for ${carType} × ${serviceType}` });
    }

    // Convert Prisma Decimal to number properly
    // Prisma Decimal is returned as a Decimal object, convert via string
    const priceStr = pricing.price.toString();
    const priceValue = parseFloat(priceStr);
    
    if (isNaN(priceValue) || priceValue <= 0) {
      console.error(`Invalid price value: ${pricing.price} (string: ${priceStr}, converted: ${priceValue}) for carCategory: ${carCategory}, washType: ${washType}`);
      return res.status(404).json({ error: `Invalid pricing for ${carType} × ${serviceType}. Please configure pricing in admin panel.` });
    }

    const originalPrice = priceValue;
    const discountedPrice = Math.max(0, originalPrice * (1 - (Number.isFinite(discountPercent) ? discountPercent : 0) / 100));

    const washer = washerId
      ? await prisma.washer.findUnique({ where: { id: washerId }, select: { id: true, username: true, salaryPercentage: true } })
      : await prisma.washer.findUnique({ where: { username: washerUsername }, select: { id: true, username: true, salaryPercentage: true } });

    if (!washer) {
      return res.status(404).json({ error: 'Washer not found' });
    }

    const washerCut = Math.max(0, originalPrice * ((Number(washer.salaryPercentage) || 0) / 100));

    res.json({
      carType,
      serviceType,
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
      originalPrice,
      discountedPrice,
      washerCut,
      washer: { id: washer.id, username: washer.username, salaryPercentage: washer.salaryPercentage },
    });
  } catch (error) {
    console.error('Pricing quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/pricing:
 *   get:
 *     tags:
 *       - Pricing
 *     summary: Get full pricing matrix
 *     description: Returns all pricing entries formatted as a matrix (carType × serviceType)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pricing matrix
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
  try {
    const allPricing = await prisma.pricing.findMany({
      select: {
        carCategory: true,
        washType: true,
        price: true,
      },
    });

    // Convert to legacy format for frontend
    const matrix = {};
    allPricing.forEach((entry) => {
      const legacyCarType = SCHEMA_CAR_TYPE_TO_LEGACY[entry.carCategory];
      const legacyServiceType = SCHEMA_WASH_TYPE_TO_LEGACY[entry.washType];

      if (!legacyCarType || !legacyServiceType) {
        return; // Skip unmapped entries
      }

      if (!matrix[legacyCarType]) {
        matrix[legacyCarType] = {};
      }

      // Convert Prisma Decimal to number via string conversion
      const priceValue = parseFloat(entry.price.toString());
      matrix[legacyCarType][legacyServiceType] = priceValue;
    });

    res.json({ matrix });
  } catch (error) {
    console.error('Get pricing matrix error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/pricing:
 *   put:
 *     tags:
 *       - Pricing
 *     summary: Update pricing matrix
 *     description: Updates pricing entries. Admin only. Accepts a matrix object with carType × serviceType prices.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matrix:
 *                 type: object
 *                 description: Object with carType keys, each containing serviceType keys with price values
 *     responses:
 *       200:
 *         description: Pricing updated successfully
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put(
  '/',
  requireAdmin,
  [
    body('matrix')
      .isObject()
      .withMessage('matrix must be an object')
      .custom((matrix) => {
        // Validate that all values are objects with numeric values
        for (const carType in matrix) {
          if (typeof matrix[carType] !== 'object' || matrix[carType] === null) {
            throw new Error(`Invalid matrix structure for carType: ${carType}`);
          }
          for (const serviceType in matrix[carType]) {
            const price = matrix[carType][serviceType];
            if (typeof price !== 'number' || price < 0 || !Number.isFinite(price)) {
              throw new Error(`Price must be a non-negative number for ${carType} × ${serviceType}`);
            }
          }
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      console.log('Update pricing request body:', JSON.stringify(req.body, null, 2));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { matrix } = req.body;
      if (!matrix || typeof matrix !== 'object') {
        return res.status(400).json({ error: 'matrix is required and must be an object' });
      }

      const updates = [];
      let updateCount = 0;

      // Convert legacy names to schema enums and prepare updates
      for (const legacyCarType in matrix) {
        const carCategory = LEGACY_CAR_TYPE_TO_SCHEMA[legacyCarType];
        if (!carCategory) {
          console.warn(`Skipping unmapped carType: ${legacyCarType}`);
          continue;
        }

        for (const legacyServiceType in matrix[legacyCarType]) {
          const washType = LEGACY_SERVICE_TYPE_TO_SCHEMA[legacyServiceType];
          if (!washType) {
            console.warn(`Skipping unmapped serviceType: ${legacyServiceType}`);
            continue;
          }

          const price = Number(matrix[legacyCarType][legacyServiceType]);
          if (price < 0 || !Number.isFinite(price)) {
            console.warn(`Skipping invalid price: ${price} for ${legacyCarType} × ${legacyServiceType}`);
            continue; // Skip invalid prices (already validated, but double-check)
          }

          updateCount++;
          updates.push(
            prisma.pricing.upsert({
              where: {
                carCategory_washType: {
                  carCategory,
                  washType,
                },
              },
              update: {
                price,
              },
              create: {
                carCategory,
                washType,
                price,
              },
            })
          );
        }
      }

      console.log(`Updating ${updateCount} pricing entries`);
      await Promise.all(updates);
      console.log(`Successfully updated ${updateCount} pricing entries`);

      res.json({ message: `Pricing matrix updated successfully (${updateCount} entries)` });
    } catch (error) {
      console.error('Update pricing matrix error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
);

export default router;


