import { Router, Request, Response } from 'express';
import pool from '../services/database';

const router = Router();

router.get('/api/questions', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, type, label, description, required, options FROM questions WHERE active = true ORDER BY sort_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Questions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

export default router;
