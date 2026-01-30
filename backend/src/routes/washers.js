import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Staff can list washers for record creation.
router.use(authenticateToken);

/**
 * @openapi
 * /api/washers:
 *   get:
 *     tags:
 *       - Washers
 *     summary: List washers
 *     description: Returns washers. Staff sees only active washers, admins see all washers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive washers (admin only, defaults to false for staff)
 *     responses:
 *       200:
 *         description: List of washers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 washers:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const includeInactive = isAdmin && req.query.includeInactive === 'true';

    const washers = await prisma.washer.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        contact: true,
        active: true,
        salaryPercentage: true,
      },
    });
    res.json({ washers });
  } catch (error) {
    console.error('List washers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/washers:
 *   post:
 *     tags:
 *       - Washers
 *     summary: Create a new washer
 *     description: Creates a new washer. Admin only.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               contact:
 *                 type: string
 *               salaryPercentage:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Washer created successfully
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
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Username must be between 1 and 100 characters'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
    body('surname').optional().trim().isLength({ max: 100 }).withMessage('Surname must be at most 100 characters'),
    body('contact').optional().trim().isLength({ max: 100 }).withMessage('Contact must be at most 100 characters'),
    body('salaryPercentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Salary percentage must be between 0 and 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, name, surname, contact, salaryPercentage = 0 } = req.body;

      // Check if username already exists (must be unique)
      const trimmedUsername = username.trim();
      const existing = await prisma.washer.findUnique({
        where: { username: trimmedUsername },
      });

      if (existing) {
        return res.status(400).json({ error: 'Username already exists. Each washer must have a unique username.' });
      }

      const washer = await prisma.washer.create({
        data: {
          username: username.trim(),
          name: name?.trim() || null,
          surname: surname?.trim() || null,
          contact: contact?.trim() || null,
          salaryPercentage: salaryPercentage || 0,
          active: true,
        },
        select: {
          id: true,
          username: true,
          name: true,
          surname: true,
          contact: true,
          active: true,
          salaryPercentage: true,
        },
      });

      res.status(201).json({ washer });
    } catch (error) {
      console.error('Create washer error:', error);
      if (error.code === 'P2002') {
        // Unique constraint violation
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/washers/{id}:
 *   put:
 *     tags:
 *       - Washers
 *     summary: Update a washer
 *     description: Updates washer details or deactivates. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               contact:
 *                 type: string
 *               active:
 *                 type: boolean
 *               salaryPercentage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Washer updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Washer not found
 */
router.put(
  '/:id',
  requireAdmin,
  [
    body('username').not().exists().withMessage('Username cannot be changed'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
    body('surname').optional().trim().isLength({ max: 100 }).withMessage('Surname must be at most 100 characters'),
    body('contact').optional().trim().isLength({ max: 100 }).withMessage('Contact must be at most 100 characters'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
    body('salaryPercentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Salary percentage must be between 0 and 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid washer ID' });
      }

      // Explicitly reject username changes
      if (req.body.username !== undefined) {
        return res.status(400).json({ error: 'Username cannot be changed' });
      }

      const { name, surname, contact, active, salaryPercentage } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name?.trim() || null;
      if (surname !== undefined) updateData.surname = surname?.trim() || null;
      if (contact !== undefined) updateData.contact = contact?.trim() || null;
      if (active !== undefined) updateData.active = active;
      if (salaryPercentage !== undefined) updateData.salaryPercentage = salaryPercentage;

      const washer = await prisma.washer.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          name: true,
          surname: true,
          contact: true,
          active: true,
          salaryPercentage: true,
        },
      });

      res.json({ washer });
    } catch (error) {
      console.error('Update washer error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Washer not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/washers/{id}:
 *   delete:
 *     tags:
 *       - Washers
 *     summary: Delete a washer
 *     description: Permanently deletes a washer. Admin only. Requires master PIN. Use PUT to deactivate instead if you want to preserve records.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Washer deleted successfully
 *       400:
 *         description: Bad request (invalid PIN)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Washer not found
 */
router.delete('/:id', requireAdmin, [body('masterPin').notEmpty().withMessage('Master PIN is required')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid washer ID' });
    }

    const { masterPin } = req.body;

    // Verify master PIN
    if (masterPin !== process.env.MASTER_PIN) {
      return res.status(400).json({ error: 'Invalid master PIN' });
    }

    await prisma.washer.delete({
      where: { id },
    });

    res.json({ message: 'Washer deleted successfully' });
  } catch (error) {
    console.error('Delete washer error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Washer not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


