import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/stats', adminAuth, async (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.date_from as string | undefined;
    const dateTo = req.query.date_to as string | undefined;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (dateFrom) {
      conditions.push(`created_at >= $${paramIdx++}::date`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`created_at < ($${paramIdx++}::date + interval '1 day')`);
      params.push(dateTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [total, today, byIsland, byAgeGroup, bySector, byMode] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM citizens ${where}`, params),
      pool.query(
        `SELECT COUNT(*) as count FROM citizens WHERE created_at::date = CURRENT_DATE`
      ),
      pool.query(
        `SELECT island, COUNT(*) as count FROM citizens ${where} GROUP BY island ORDER BY count DESC`,
        params
      ),
      pool.query(
        `SELECT age_group, COUNT(*) as count FROM citizens ${where} GROUP BY age_group ORDER BY count DESC`,
        params
      ),
      pool.query(
        `SELECT sector, COUNT(*) as count FROM citizens ${where} GROUP BY sector ORDER BY count DESC`,
        params
      ),
      pool.query(
        `SELECT COALESCE(survey_mode, 'standard') as mode, COUNT(*) as count FROM citizens ${where} GROUP BY survey_mode ORDER BY count DESC`,
        params
      ),
    ]);

    res.json({
      total_responses: parseInt(total.rows[0].count),
      today_responses: parseInt(today.rows[0].count),
      by_island: byIsland.rows,
      by_age_group: byAgeGroup.rows,
      by_sector: bySector.rows,
      by_mode: byMode.rows,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
