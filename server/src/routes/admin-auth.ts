import { Router, Request, Response } from 'express';
import { generateToken, adminAuth } from '../middleware/admin-auth';

const router = Router();

router.post('/api/admin/login', async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }

  // Direct comparison since ADMIN_PASSWORD is stored as plain text in env
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = generateToken();
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  res.json({ success: true });
});

router.post('/api/admin/logout', (_req: Request, res: Response) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

router.get('/api/admin/check', adminAuth, (_req: Request, res: Response) => {
  res.json({ authenticated: true });
});

export default router;
