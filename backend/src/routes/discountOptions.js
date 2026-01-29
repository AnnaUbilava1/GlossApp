import { PrismaClient } from '@prisma/client';
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

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
 *     description: Returns a flat list of discount choices (including physical person) suitable for a dropdown.
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

export default router;


