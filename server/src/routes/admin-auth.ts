import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../services/database';
import { generateToken, adminAuth } from '../middleware/admin-auth';

const router = Router();

router.post('/api/admin/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Try email+password login against admins table
  if (email) {
    try {
      const result = await pool.query('SELECT id, password_hash FROM admins WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        const valid = await bcrypt.compare(password, result.rows[0].password_hash);
        if (valid) {
          const token = generateToken({ adminId: result.rows[0].id, email });
          res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
          });
          return res.json({ success: true });
        }
      }
    } catch (err) {
      console.error('Admin login error:', err);
    }
  }

  // Fallback: ADMIN_PASSWORD (bootstrap mode, no email required)
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && password === adminPassword) {
    const token = generateToken({});
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

router.post('/api/admin/logout', (_req: Request, res: Response) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

router.get('/api/admin/check', adminAuth, (_req: Request, res: Response) => {
  res.json({ authenticated: true });
});

export default router;
