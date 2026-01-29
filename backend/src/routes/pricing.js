import { PrismaClient } from '@prisma/client';
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  LEGACY_CAR_TYPE_TO_SCHEMA,
  LEGACY_SERVICE_TYPE_TO_SCHEMA,
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

    if (!pricing?.price) {
      return res.status(404).json({ error: 'Pricing not found for selected carType/serviceType' });
    }

    const originalPrice = Number(pricing.price);
    const discountedPrice = Math.max(0, originalPrice * (1 - (Number.isFinite(discountPercent) ? discountPercent : 0) / 100));

    const washer = washerId
      ? await prisma.washer.findUnique({ where: { id: washerId }, select: { id: true, username: true, salaryPercentage: true } })
      : await prisma.washer.findUnique({ where: { username: washerUsername }, select: { id: true, username: true, salaryPercentage: true } });

    if (!washer) {
      return res.status(404).json({ error: 'Washer not found' });
    }

    const washerCut = Math.max(0, discountedPrice * ((Number(washer.salaryPercentage) || 0) / 100));

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

export default router;


