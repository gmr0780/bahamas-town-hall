import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

// Public: get survey status
router.get('/api/survey-status', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT value FROM site_settings WHERE key = 'survey_open'");
    const isOpen = result.rows[0]?.value === 'true';
    res.json({ survey_open: isOpen });
  } catch (err) {
    console.error('Survey status error:', err);
    res.status(500).json({ error: 'Failed to fetch survey status' });
  }
});

// Public: get response count
router.get('/api/response-count', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM citizens');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Response count error:', err);
    res.status(500).json({ error: 'Failed to fetch response count' });
  }
});

// Admin: toggle survey status
router.put('/api/admin/survey-status', adminAuth, async (req: Request, res: Response) => {
  try {
    const { survey_open } = req.body;
    if (typeof survey_open !== 'boolean') {
      return res.status(400).json({ error: 'survey_open must be a boolean' });
    }
    await pool.query(
      "INSERT INTO site_settings (key, value) VALUES ('survey_open', $1) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()",
      [String(survey_open)]
    );
    res.json({ survey_open });
  } catch (err) {
    console.error('Update survey status error:', err);
    res.status(500).json({ error: 'Failed to update survey status' });
  }
});

export default router;
