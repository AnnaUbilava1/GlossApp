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

// All routes require authentication
router.use(authenticateToken);

function toDecimalString(value) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

function recordToLegacy(record) {
  const discountPercent = record.discountPercentage ?? 0;
  const discountedPriceNum = record.discountedPrice ? Number(record.discountedPrice) : 0;
  const originalPriceNum = record.originalPrice ? Number(record.originalPrice) : 0;
  const price = discountedPriceNum || originalPriceNum;

  const isFinished = Boolean(record.endTime);
  const isPaid = Boolean(record.paymentMethod);

  const carType =
    SCHEMA_CAR_TYPE_TO_LEGACY[record.carCategory] || String(record.carCategory || '');
  const serviceType =
    SCHEMA_WASH_TYPE_TO_LEGACY[record.washType] || String(record.washType || '');

  const companyName = record.companyName || record.company?.name || null;
  const companyDiscount =
    discountPercent > 0
      ? `${companyName || 'Physical Person'} ${discountPercent}%`
      : companyName || 'Physical Person';

  return {
    // legacy fields expected by the current frontend
    id: record.id,
    licenseNumber: record.licensePlate,
    carType,
    serviceType,
    companyDiscount,
    discountPercent,
    price,
    boxNumber: record.boxNumber ?? 0,
    washerName: record.washerUsername,
    startTime: record.startTime,
    endTime: record.endTime,
    isFinished,
    isPaid,
    paymentMethod: record.paymentMethod ?? undefined,
    createdAt: record.createdAt,
  };
}

async function resolveVehicleId({ licensePlate, carCategory }) {
  const existing = await prisma.vehicle.findUnique({
    where: { licensePlate },
    select: { id: true, carCategory: true },
  });

  if (!existing) {
    const created = await prisma.vehicle.create({
      data: { licensePlate, carCategory },
      select: { id: true },
    });
    return created.id;
  }

  // Keep vehicle's category in sync if it changed
  if (carCategory && existing.carCategory !== carCategory) {
    await prisma.vehicle.update({
      where: { licensePlate },
      data: { carCategory },
    });
  }

  return existing.id;
}

async function resolveWasher({ washerId, washerUsername }) {
  if (washerId) {
    const washer = await prisma.washer.findUnique({
      where: { id: washerId },
      select: { id: true, username: true, salaryPercentage: true },
    });
    if (!washer) return null;
    return washer;
  }

  const username = washerUsername?.trim();
  if (!username) return null;

  const existing = await prisma.washer.findUnique({
    where: { username },
    select: { id: true, username: true, salaryPercentage: true },
  });
  if (existing) return existing;

  return await prisma.washer.create({
    data: { username, name: username, active: true },
    select: { id: true, username: true, salaryPercentage: true },
  });
}

async function resolveCompanySnapshot(companyId) {
  if (!companyId) return { companyId: null, companyName: null };
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) return { companyId: null, companyName: null };
  return { companyId: company.id, companyName: company.name };
}

async function resolveDiscountId({ companyId, discountPercentage }) {
  if (!companyId || !discountPercentage || discountPercentage <= 0) return null;

  const discount = await prisma.discount.findFirst({
    where: { companyId, active: true, percentage: discountPercentage },
    select: { id: true },
  });

  return discount?.id || null;
}

async function resolveOriginalPrice({ carCategory, washType, fallbackPrice }) {
  const fallback = typeof fallbackPrice === 'number' ? fallbackPrice : Number(fallbackPrice);
  if (Number.isFinite(fallback) && fallback >= 0) return fallback;

  const pricing = await prisma.pricing.findUnique({
    where: { carCategory_washType: { carCategory, washType } },
    select: { price: true },
  });

  if (!pricing?.price) return null;
  return Number(pricing.price);
}

function computeDiscountedPrice(originalPrice, discountPercentage) {
  const discount = Number(discountPercentage) || 0;
  const discounted = originalPrice * (1 - discount / 100);
  return Math.max(0, discounted);
}

function computeWasherCut(originalPrice, washerSalaryPercentage) {
  const pct = Number(washerSalaryPercentage) || 0;
  const cut = originalPrice * (pct / 100);
  return Math.max(0, cut);
}

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
      where.endTime = null;
    } else if (status === 'finished_unpaid') {
      where.endTime = { not: null };
      where.paymentMethod = null;
    } else if (status === 'paid') {
      where.paymentMethod = { not: null };
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        // Start of day (inclusive)
        where.startTime.gte = new Date(String(startDate));
      }
      if (endDate) {
        // End of day (inclusive): 23:59:59.999 so records created during that day are included
        const end = new Date(String(endDate));
        end.setUTCHours(23, 59, 59, 999);
        where.startTime.lte = end;
      }
    }

    const records = await prisma.washRecord.findMany({
      where,
      include: {
        company: true,
        vehicle: true,
        washer: true,
        discount: true,
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

    res.json({ records: records.map(recordToLegacy), rawRecords: records });
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
        vehicle: true,
        washer: true,
        discount: true,
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

    res.json({ record: recordToLegacy(record), rawRecord: record });
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
 *     description: Create a new wash record (requires authentication). Accepts legacy frontend fields and maps them into the current database schema.
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
 *               - washerName
 *             properties:
 *               licenseNumber:
 *                 type: string
 *                 description: Legacy field (recommended for current frontend). Stored as WashRecord.licensePlate snapshot and Vehicle.licensePlate.
 *               licensePlate:
 *                 type: string
 *                 description: Schema-style alias for licenseNumber.
 *               carType:
 *                 type: string
 *                 description: Legacy UI car category (mapped to schema enum CarType).
 *                 enum: [Sedan, Jeep, Big Jeep, Premium, Hatchback, Minivan, Truck]
 *               carCategory:
 *                 type: string
 *                 description: Schema enum CarType (e.g. SEDAN, PREMIUM_CLASS, SMALL_JEEP, BIG_JEEP, MICROBUS).
 *               serviceType:
 *                 type: string
 *                 description: Legacy UI wash type (mapped to schema enum WashType).
 *                 enum: [Complete Wash, Outer Wash, Interior Wash, Engine Wash, Chemical Wash]
 *               washType:
 *                 type: string
 *                 description: Schema enum WashType (e.g. COMPLETE, OUTER, INNER, ENGINE, CHEMICAL).
 *               price:
 *                 type: number
 *                 description: Optional override. If omitted, price is loaded from the Pricing matrix (carCategory + washType).
 *               boxNumber:
 *                 type: integer
 *                 description: Legacy UI field; persisted in the database as wash_records.box_number.
 *               washerName:
 *                 type: string
 *                 description: Legacy UI field. Used as washerUsername snapshot and to resolve/create a Washer.username.
 *               washerUsername:
 *                 type: string
 *                 description: Schema-style alias for washerName.
 *               washerId:
 *                 type: integer
 *                 description: Schema Washer.id (preferred if available).
 *               companyId:
 *                 type: string
 *               discountPercent:
 *                 type: number
 *                 default: 0
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
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
 *                   description: Legacy-shaped record for current frontend compatibility.
 *                 rawRecord:
 *                   type: object
 *                   description: Raw Prisma WashRecord including relations and Decimal fields (mostly for debugging/admin tooling).
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
    body('licenseNumber')
      .optional()
      .isString()
      .notEmpty()
      .withMessage('licenseNumber must be a non-empty string'),
    body('licensePlate')
      .optional()
      .isString()
      .notEmpty()
      .withMessage('licensePlate must be a non-empty string'),
    body('carType').optional().isString(),
    body('carCategory').optional().isString(),
    body('serviceType').optional().isString(),
    body('washType').optional().isString(),
    body('discountPercent').optional().isFloat({ min: 0, max: 100 }),
    body('price').optional().isFloat({ min: 0 }),
    body('boxNumber').optional().isInt(),
    body('washerName').optional().isString(),
    body('washerUsername').optional().isString(),
    body('washerId').optional().isInt({ min: 1 }),
    body('companyId').optional().isString(),
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601(),
    body('paymentMethod').optional().isIn(['cash', 'card']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const licensePlate = (req.body.licensePlate || req.body.licenseNumber || '').trim();
      if (!licensePlate) {
        return res.status(400).json({ error: 'licenseNumber (or licensePlate) is required' });
      }

      const carCategory =
        req.body.carCategory ||
        LEGACY_CAR_TYPE_TO_SCHEMA[req.body.carType] ||
        null;
      if (!carCategory) {
        return res.status(400).json({ error: 'carType (or carCategory) is required' });
      }

      const washType =
        req.body.washType ||
        LEGACY_SERVICE_TYPE_TO_SCHEMA[req.body.serviceType] ||
        null;
      if (!washType) {
        return res.status(400).json({ error: 'serviceType (or washType) is required' });
      }

      const washer = await resolveWasher({
        washerId: req.body.washerId ? Number(req.body.washerId) : null,
        washerUsername: req.body.washerUsername || req.body.washerName,
      });
      if (!washer) {
        return res.status(400).json({ error: 'washerName (or washerUsername/washerId) is required' });
      }

      const discountPercentage = Number(req.body.discountPercent) || 0;
      const boxNumber =
        req.body.boxNumber === undefined || req.body.boxNumber === null
          ? 0
          : Number(req.body.boxNumber);
      if (!Number.isInteger(boxNumber)) {
        return res.status(400).json({ error: 'boxNumber must be an integer' });
      }

      const originalPrice = await resolveOriginalPrice({
        carCategory,
        washType,
        fallbackPrice: req.body.price,
      });
      if (originalPrice === null) {
        return res.status(400).json({
          error:
            'price is required unless a pricing matrix entry exists for the provided carType/serviceType',
        });
      }

      const discountedPrice = computeDiscountedPrice(originalPrice, discountPercentage);
      const washerCut = computeWasherCut(originalPrice, washer.salaryPercentage);

      const vehicleId = await resolveVehicleId({ licensePlate, carCategory });
      const { companyId, companyName } = await resolveCompanySnapshot(req.body.companyId);
      const discountId = await resolveDiscountId({ companyId, discountPercentage });

      const record = await prisma.washRecord.create({
        data: {
          vehicleId,
          washerId: washer.id,
          companyId,
          discountId,
          createdById: req.user.id,

          licensePlate,
          companyName,
          discountPercentage,
          carCategory,
          washType,
          washerUsername: washer.username,
          boxNumber,

          originalPrice: toDecimalString(originalPrice),
          discountedPrice: toDecimalString(discountedPrice),
          washerCut: toDecimalString(washerCut),

          paymentMethod: req.body.paymentMethod || null,
          startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
          endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
        },
        include: {
          company: true,
          vehicle: true,
          washer: true,
          discount: true,
          createdBy: { select: { id: true, email: true, name: true } },
        },
      });

      res.status(201).json({ record: recordToLegacy(record), rawRecord: record });
    } catch (error) {
      console.error('Create record error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/records/{id}/finish:
 *   post:
 *     tags:
 *       - Records
 *     summary: Mark a wash record as finished
 *     description: >
 *       Sets the end time to now, marking the record as finished. Accessible to any authenticated user.
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
 *         description: Record marked as finished
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/finish', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.washRecord.findUnique({
      where: { id },
      select: { id: true, endTime: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (existing.endTime) {
      // Already finished; treat as idempotent
      return res.json({ message: 'Record already finished' });
    }

    const record = await prisma.washRecord.update({
      where: { id },
      data: { endTime: new Date() },
    });

    res.json({ message: 'Record marked as finished', record: recordToLegacy(record) });
  } catch (error) {
    console.error('Finish record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/records/{id}/pay:
 *   post:
 *     tags:
 *       - Records
 *     summary: Mark a wash record as paid
 *     description: >
 *       Sets the payment method (cash or card), marking the record as paid. Admin only.
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
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card]
 *     responses:
 *       200:
 *         description: Record marked as paid
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/pay',
  requireAdmin,
  [body('paymentMethod').isIn(['cash', 'card']).withMessage('paymentMethod must be cash or card')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { paymentMethod } = req.body;

      const existing = await prisma.washRecord.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Record not found' });
      }

      const record = await prisma.washRecord.update({
        where: { id },
        data: { paymentMethod },
      });

      res.json({ message: 'Record marked as paid', record: recordToLegacy(record) });
    } catch (error) {
      console.error('Mark record paid error:', error);
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
 *     description: Update a wash record (admin only, requires master PIN). Accepts legacy fields and maps them into the current schema.
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
 *               licensePlate:
 *                 type: string
 *               carType:
 *                 type: string
 *               serviceType:
 *                 type: string
 *               carCategory:
 *                 type: string
 *               washType:
 *                 type: string
 *               price:
 *                 type: number
 *               discountPercent:
 *                 type: number
 *               companyId:
 *                 type: string
 *               washerName:
 *                 type: string
 *               washerUsername:
 *                 type: string
 *               washerId:
 *                 type: integer
 *               isFinished:
 *                 type: boolean
 *               isPaid:
 *                 type: boolean
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
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
 *                 rawRecord:
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

      const existing = await prisma.washRecord.findUnique({
        where: { id },
        include: { company: true, vehicle: true, washer: true },
      });
      if (!existing) return res.status(404).json({ error: 'Record not found' });

      // Build schema-aligned update data from legacy-friendly input
      const updateData = {};

      // Status helpers (legacy)
      if (typeof req.body.isFinished === 'boolean') {
        updateData.endTime = req.body.isFinished ? new Date() : null;
      }
      if (typeof req.body.isPaid === 'boolean') {
        if (req.body.isPaid === false) {
          updateData.paymentMethod = null;
        } else if (!req.body.paymentMethod && !existing.paymentMethod) {
          updateData.paymentMethod = 'cash';
        }
      }

      if (req.body.paymentMethod) updateData.paymentMethod = req.body.paymentMethod;
      if (req.body.startTime) updateData.startTime = new Date(req.body.startTime);
      if (req.body.endTime) updateData.endTime = new Date(req.body.endTime);

      if (Object.prototype.hasOwnProperty.call(req.body, 'boxNumber')) {
        const boxNumber =
          req.body.boxNumber === undefined || req.body.boxNumber === null
            ? 0
            : Number(req.body.boxNumber);
        if (!Number.isInteger(boxNumber)) {
          return res.status(400).json({ error: 'boxNumber must be an integer' });
        }
        updateData.boxNumber = boxNumber;
      }

      const nextCarCategory =
        req.body.carCategory ||
        (req.body.carType ? LEGACY_CAR_TYPE_TO_SCHEMA[req.body.carType] : undefined);
      const nextWashType =
        req.body.washType ||
        (req.body.serviceType ? LEGACY_SERVICE_TYPE_TO_SCHEMA[req.body.serviceType] : undefined);

      // License plate changes require (re)linking vehicle
      const nextLicensePlate = req.body.licensePlate || req.body.licenseNumber;
      if (nextLicensePlate) {
        const plate = String(nextLicensePlate).trim();
        const category = nextCarCategory || existing.carCategory;
        updateData.licensePlate = plate;
        updateData.vehicleId = await resolveVehicleId({ licensePlate: plate, carCategory: category });
      }

      if (nextCarCategory) {
        updateData.carCategory = nextCarCategory;
      }
      if (nextWashType) {
        updateData.washType = nextWashType;
      }

      // Washer changes require relinking washer + snapshot username
      if (req.body.washerId || req.body.washerUsername || req.body.washerName) {
        const washer = await resolveWasher({
          washerId: req.body.washerId ? Number(req.body.washerId) : null,
          washerUsername: req.body.washerUsername || req.body.washerName,
        });
        if (!washer) return res.status(400).json({ error: 'Invalid washerId/washerName' });
        updateData.washerId = washer.id;
        updateData.washerUsername = washer.username;
      }

      // Company/discount snapshot changes
      if (Object.prototype.hasOwnProperty.call(req.body, 'companyId')) {
        const { companyId, companyName } = await resolveCompanySnapshot(req.body.companyId);
        updateData.companyId = companyId;
        updateData.companyName = companyName;
      }

      // Discount/price recomputation
      const nextDiscountPercentage = Object.prototype.hasOwnProperty.call(req.body, 'discountPercent')
        ? Number(req.body.discountPercent) || 0
        : undefined;
      if (nextDiscountPercentage !== undefined) {
        updateData.discountPercentage = nextDiscountPercentage;
      }

      const priceOverride = Object.prototype.hasOwnProperty.call(req.body, 'price')
        ? Number(req.body.price)
        : undefined;

      const shouldReprice =
        priceOverride !== undefined ||
        nextCarCategory !== undefined ||
        nextWashType !== undefined ||
        nextDiscountPercentage !== undefined;

      if (shouldReprice) {
        const carCategory = nextCarCategory || existing.carCategory;
        const washType = nextWashType || existing.washType;
        const discountPercentage =
          nextDiscountPercentage !== undefined ? nextDiscountPercentage : existing.discountPercentage;

        const originalPrice = await resolveOriginalPrice({
          carCategory,
          washType,
          fallbackPrice: priceOverride,
        });
        if (originalPrice === null) {
          return res.status(400).json({
            error:
              'price is required unless a pricing matrix entry exists for the provided carType/serviceType',
          });
        }

        const discountedPrice = computeDiscountedPrice(originalPrice, discountPercentage);

        // If washer is being changed in the same request, use it; otherwise compute from existing washer
        let washerSalaryPercentage = existing.washer?.salaryPercentage ?? 0;
        if (updateData.washerId && updateData.washerId !== existing.washerId) {
          const updatedWasher = await prisma.washer.findUnique({
            where: { id: updateData.washerId },
            select: { salaryPercentage: true },
          });
          washerSalaryPercentage = updatedWasher?.salaryPercentage ?? washerSalaryPercentage;
        }

        const washerCut = computeWasherCut(originalPrice, washerSalaryPercentage);

        updateData.originalPrice = toDecimalString(originalPrice);
        updateData.discountedPrice = toDecimalString(discountedPrice);
        updateData.washerCut = toDecimalString(washerCut);

        const effectiveCompanyId =
          updateData.companyId !== undefined ? updateData.companyId : existing.companyId;
        const discountId = await resolveDiscountId({
          companyId: effectiveCompanyId,
          discountPercentage,
        });
        updateData.discountId = discountId;
      }

      const record = await prisma.washRecord.update({
        where: { id },
        data: updateData,
        include: {
          company: true,
          vehicle: true,
          washer: true,
          discount: true,
        },
      });

      res.json({ record: recordToLegacy(record), rawRecord: record });
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

