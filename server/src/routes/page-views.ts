import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

// Public: log a page view
router.post('/api/track', async (req: Request, res: Response) => {
  try {
    const { path, referrer } = req.body as { path: string; referrer?: string };
    if (!path) return res.status(400).json({ error: 'path is required' });

    const userAgent = req.headers['user-agent'] || '';

    await pool.query(
      'INSERT INTO page_views (path, referrer, user_agent) VALUES ($1, $2, $3)',
      [path, referrer || null, userAgent]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('Track error:', err);
    return res.status(500).json({ error: 'Failed to track' });
  }
});

// Admin: get page view stats
router.get('/api/admin/page-views', adminAuth, async (req: Request, res: Response) => {
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

    const [total, today, byPage, byDay] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM page_views ${where}`, params),
      pool.query('SELECT COUNT(*) as count FROM page_views WHERE created_at::date = CURRENT_DATE'),
      pool.query(
        `SELECT path, COUNT(*) as count FROM page_views ${where} GROUP BY path ORDER BY count DESC`,
        params
      ),
      pool.query(
        `SELECT created_at::date as date, COUNT(*) as count
         FROM page_views ${where}
         GROUP BY created_at::date
         ORDER BY date DESC
         LIMIT 30`,
        params
      ),
    ]);

    return res.json({
      total_views: parseInt(total.rows[0].count, 10),
      today_views: parseInt(today.rows[0].count, 10),
      by_page: byPage.rows,
      by_day: byDay.rows,
    });
  } catch (err) {
    console.error('Page views error:', err);
    return res.status(500).json({ error: 'Failed to fetch page views' });
  }
});

export default router;
