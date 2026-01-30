import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Returns a list of all users (admin only). Passwords are excluded.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [admin, staff]
 *                       name:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Create a new user account (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: staff@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, staff]
 *                 example: staff
 *               name:
 *                 type: string
 *                 nullable: true
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['admin', 'staff'])
      .withMessage('Role must be either admin or staff'),
    body('name').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, role, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          name: name || null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          createdAt: true,
        },
      });

      res.status(201).json({ user });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/users/{id}/password:
 *   put:
 *     tags:
 *       - Users
 *     summary: Reset user password
 *     description: Reset a user's password (admin only, requires master PIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - masterPin
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newpassword123
 *               masterPin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Invalid master PIN or admin access required
 *       404:
 *         description: User not found
 */
router.put(
  '/:id/password',
  [
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('masterPin').notEmpty().withMessage('Master PIN is required'),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { newPassword, masterPin } = req.body;

      // Verify master PIN
      if (masterPin !== process.env.MASTER_PIN) {
        return res.status(403).json({ error: 'Invalid master PIN' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user
 *     description: Delete a user account (admin only, requires master PIN). Cannot delete yourself.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Validation error or cannot delete yourself
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Invalid master PIN or admin access required
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  [body('masterPin').notEmpty().withMessage('Master PIN is required')],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { masterPin } = req.body;

      // Prevent self-deletion
      if (req.user.id === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Verify master PIN
      if (masterPin !== process.env.MASTER_PIN) {
        return res.status(403).json({ error: 'Invalid master PIN' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user
      await prisma.user.delete({
        where: { id },
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
