import { PrismaClient } from '@prisma/client';
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * @openapi
 * /api/discount-options:
 *   get:
 *     tags:
 *       - Discounts
 *     summary: List discount options for record creation
 *     description: Returns a flat list of discount choices from the database (company-linked discounts) suitable for a dropdown.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Discount options
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      where: { active: true },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ company: { name: 'asc' } }, { percentage: 'asc' }],
    });

    const companyOptions = discounts.map((d) => ({
      label: `${d.company.name} ${d.percentage}%`,
      companyId: d.company.id,
      discountPercent: d.percentage,
      discountId: d.id,
    }));

    res.json({ options: companyOptions });
  } catch (error) {
    console.error('Discount options error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/discount-options/list:
 *   get:
 *     tags:
 *       - Discounts
 *     summary: List all discounts for admin management
 *     description: Returns all discounts (including inactive) with company information. Admin only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of discounts
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ company: { name: 'asc' } }, { percentage: 'asc' }],
    });

    const formattedDiscounts = discounts.map((d) => ({
      id: d.id,
      companyId: d.companyId,
      companyName: d.company.name,
      percentage: d.percentage,
      active: d.active,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    res.json({ discounts: formattedDiscounts });
  } catch (error) {
    console.error('List discounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/discount-options/{id}:
 *   put:
 *     tags:
 *       - Discounts
 *     summary: Update a discount
 *     description: Updates discount active status or percentage. Admin only. Cannot update physical person discounts.
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
 *               active:
 *                 type: boolean
 *               percentage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Discount not found
 */
router.put(
  '/:id',
  requireAdmin,
  [
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
    body('percentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Percentage must be between 0 and 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Check if it's a physical person discount (cannot be updated)
      if (id.startsWith('physical-')) {
        return res.status(400).json({ error: 'Physical person discounts cannot be modified' });
      }

      const { active, percentage } = req.body;

      // Check if discount exists
      const existing = await prisma.discount.findUnique({
        where: { id },
        include: { company: { select: { id: true, name: true } } },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Discount not found' });
      }

      const updateData = {};
      if (active !== undefined) updateData.active = active;
      if (percentage !== undefined) updateData.percentage = percentage;

      const discount = await prisma.discount.update({
        where: { id },
        data: updateData,
        include: { company: { select: { id: true, name: true } } },
      });

      res.json({
        discount: {
          id: discount.id,
          companyId: discount.companyId,
          companyName: discount.company.name,
          percentage: discount.percentage,
          active: discount.active,
          createdAt: discount.createdAt,
          updatedAt: discount.updatedAt,
        },
      });
    } catch (error) {
      console.error('Update discount error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Discount not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/discount-options/{id}:
 *   delete:
 *     tags:
 *       - Discounts
 *     summary: Delete a discount
 *     description: Permanently deletes a discount. Admin only. Requires master PIN. Cannot delete physical person discounts or discounts with wash records.
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
 *         description: Discount deleted successfully
 *       400:
 *         description: Bad request (invalid PIN or cannot delete)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Discount not found
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

    // Check if it's a physical person discount (cannot be deleted)
    if (id.startsWith('physical-')) {
      return res.status(400).json({ error: 'Physical person discounts cannot be deleted' });
    }

    // Check if discount exists
    const existing = await prisma.discount.findUnique({
      where: { id },
      include: {
        washRecords: {
          take: 1,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    // Check if discount has wash records
    if (existing.washRecords.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete discount with existing wash records',
      });
    }

    // Delete discount
    await prisma.discount.delete({
      where: { id },
    });

    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Delete discount error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


