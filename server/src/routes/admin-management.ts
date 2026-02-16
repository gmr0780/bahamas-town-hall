import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

// List admins
router.get('/api/admin/admins', adminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM admins ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List admins error:', err);
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

// Create admin
router.post('/api/admin/admins', adminAuth, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An admin with this email already exists' });
    }
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Delete admin
router.delete('/api/admin/admins/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const count = await pool.query('SELECT COUNT(*) as count FROM admins');
    if (parseInt(count.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
    const result = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

export default router;
