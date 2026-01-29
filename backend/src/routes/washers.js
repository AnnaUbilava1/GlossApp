import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

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
 *     description: Returns active washers (for staff record creation)
 *     security:
 *       - bearerAuth: []
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
    const washers = await prisma.washer.findMany({
      where: { active: true },
      orderBy: { username: 'asc' },
      select: { id: true, username: true, name: true },
    });
    res.json({ washers });
  } catch (error) {
    console.error('List washers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


