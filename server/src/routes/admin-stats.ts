import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/stats', adminAuth, async (_req: Request, res: Response) => {
  try {
    const [total, today, byIsland, byAgeGroup, bySector, avgComfort] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM citizens'),
      pool.query(
        "SELECT COUNT(*) as count FROM citizens WHERE created_at::date = CURRENT_DATE"
      ),
      pool.query(
        'SELECT island, COUNT(*) as count FROM citizens GROUP BY island ORDER BY count DESC'
      ),
      pool.query(
        'SELECT age_group, COUNT(*) as count FROM citizens GROUP BY age_group ORDER BY count DESC'
      ),
      pool.query(
        'SELECT sector, COUNT(*) as count FROM citizens GROUP BY sector ORDER BY count DESC'
      ),
      pool.query(
        'SELECT ROUND(AVG(tech_comfort_level)::numeric, 2) as avg FROM survey_responses'
      ),
    ]);

    res.json({
      total_responses: parseInt(total.rows[0].count),
      today_responses: parseInt(today.rows[0].count),
      by_island: byIsland.rows,
      by_age_group: byAgeGroup.rows,
      by_sector: bySector.rows,
      avg_tech_comfort: parseFloat(avgComfort.rows[0].avg) || 0,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
