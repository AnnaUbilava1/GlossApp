import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * @openapi
 * /api/companies:
 *   get:
 *     tags:
 *       - Companies
 *     summary: List all companies
 *     description: Returns all companies with their active discounts. Admin only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        discounts: {
          where: { active: true },
          select: {
            id: true,
            percentage: true,
            active: true,
          },
          orderBy: { percentage: 'asc' },
        },
      },
    });

    // Format response to match frontend expectations
    const formattedCompanies = companies.map((company) => ({
      id: company.id,
      name: company.name,
      contact: company.contact,
      discounts: company.discounts,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }));

    res.json({ companies: formattedCompanies });
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/companies:
 *   post:
 *     tags:
 *       - Companies
 *     summary: Create a new company
 *     description: Creates a new company and optionally creates discount options. Admin only.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *               contact:
 *                 type: string
 *               discountPercentages:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of discount percentages to create for this company
 *     responses:
 *       201:
 *         description: Company created successfully
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
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Company name must be between 1 and 200 characters'),
    body('contact')
      .trim()
      .notEmpty()
      .withMessage('Contact information is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Contact must be between 1 and 200 characters'),
    body('discountPercentages')
      .optional()
      .isArray()
      .withMessage('discountPercentages must be an array'),
    body('discountPercentages.*')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Each discount percentage must be between 0 and 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, contact, discountPercentages = [] } = req.body;

      // Create company and discounts in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: name.trim(),
            contact: contact.trim(),
          },
        });

        // Create discount options if provided
        if (discountPercentages.length > 0) {
          const uniquePercentages = [...new Set(discountPercentages)];
          await Promise.all(
            uniquePercentages.map((percentage) =>
              tx.discount.create({
                data: {
                  companyId: company.id,
                  percentage: Number(percentage),
                  active: true,
                },
              })
            )
          );
        }

        // Fetch company with discounts
        return await tx.company.findUnique({
          where: { id: company.id },
          include: {
            discounts: {
              where: { active: true },
              select: {
                id: true,
                percentage: true,
                active: true,
              },
              orderBy: { percentage: 'asc' },
            },
          },
        });
      });

      res.status(201).json({ company: result });
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/companies/{id}:
 *   put:
 *     tags:
 *       - Companies
 *     summary: Update a company
 *     description: Updates company details and optionally manages discount options. Admin only.
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
 *               name:
 *                 type: string
 *               contact:
 *                 type: string
 *               discountPercentages:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of discount percentages to set for this company (replaces existing)
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
 */
router.put(
  '/:id',
  requireAdmin,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Company name must be between 1 and 200 characters'),
    body('contact')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Contact must be between 1 and 200 characters'),
    body('discountPercentages')
      .optional()
      .isArray()
      .withMessage('discountPercentages must be an array'),
    body('discountPercentages.*')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Each discount percentage must be between 0 and 100'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, contact, discountPercentages } = req.body;

      // Check if company exists
      const existing = await prisma.company.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Update company and manage discounts in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (contact !== undefined) updateData.contact = contact.trim();

        if (Object.keys(updateData).length > 0) {
          await tx.company.update({
            where: { id },
            data: updateData,
          });
        }

        // Manage discount percentages if provided
        if (discountPercentages !== undefined) {
          // Deactivate all existing discounts
          await tx.discount.updateMany({
            where: { companyId: id },
            data: { active: false },
          });

          // Create new active discounts for provided percentages
          if (Array.isArray(discountPercentages) && discountPercentages.length > 0) {
            const uniquePercentages = [...new Set(discountPercentages)];
            await Promise.all(
              uniquePercentages.map((percentage) =>
                tx.discount.create({
                  data: {
                    companyId: id,
                    percentage: Number(percentage),
                    active: true,
                  },
                })
              )
            );
          }
        }

        // Fetch updated company with discounts
        return await tx.company.findUnique({
          where: { id },
          include: {
            discounts: {
              where: { active: true },
              select: {
                id: true,
                percentage: true,
                active: true,
              },
              orderBy: { percentage: 'asc' },
            },
          },
        });
      });

      res.json({ company: result });
    } catch (error) {
      console.error('Update company error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/companies/{id}:
 *   delete:
 *     tags:
 *       - Companies
 *     summary: Delete a company
 *     description: Permanently deletes a company and its discounts. Admin only. Requires master PIN.
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
 *         description: Company deleted successfully
 *       400:
 *         description: Bad request (invalid PIN)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
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

    // Check if company exists
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Delete company (discounts will be cascade deleted)
    await prisma.company.delete({
      where: { id },
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
