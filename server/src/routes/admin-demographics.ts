import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/demographics', adminAuth, async (_req: Request, res: Response) => {
  try {
    // Citizen demographics (static fields)
    const [byIsland, byAgeGroup, bySector] = await Promise.all([
      pool.query('SELECT island, COUNT(*) as count FROM citizens GROUP BY island ORDER BY count DESC'),
      pool.query('SELECT age_group, COUNT(*) as count FROM citizens GROUP BY age_group ORDER BY count DESC'),
      pool.query('SELECT sector, COUNT(*) as count FROM citizens GROUP BY sector ORDER BY count DESC'),
    ]);

    // Dynamic question aggregations
    const questions = await pool.query(
      'SELECT id, type, label, options FROM questions ORDER BY sort_order ASC'
    );

    const questionStats = [];
    for (const q of questions.rows) {
      let stats: any = { id: q.id, type: q.type, label: q.label };

      if (q.type === 'scale') {
        const result = await pool.query(
          `SELECT value, COUNT(*) as count FROM responses WHERE question_id = $1 GROUP BY value ORDER BY value`,
          [q.id]
        );
        const avg = await pool.query(
          `SELECT ROUND(AVG(value::numeric), 2) as avg FROM responses WHERE question_id = $1`,
          [q.id]
        );
        stats.distribution = result.rows;
        stats.average = avg.rows[0]?.avg ? parseFloat(avg.rows[0].avg) : 0;
      } else if (q.type === 'dropdown') {
        const result = await pool.query(
          `SELECT value, COUNT(*) as count FROM responses WHERE question_id = $1 GROUP BY value ORDER BY count DESC`,
          [q.id]
        );
        stats.distribution = result.rows;
      } else if (q.type === 'checkbox') {
        // Checkbox values are stored as JSON arrays -- unnest and count
        const result = await pool.query(
          `SELECT item, COUNT(*) as count
           FROM responses, jsonb_array_elements_text(value::jsonb) AS item
           WHERE question_id = $1
           GROUP BY item ORDER BY count DESC`,
          [q.id]
        );
        stats.distribution = result.rows;
      } else if (q.type === 'text' || q.type === 'textarea') {
        const count = await pool.query(
          'SELECT COUNT(*) as count FROM responses WHERE question_id = $1',
          [q.id]
        );
        const recent = await pool.query(
          `SELECT r.value, c.island, c.age_group
           FROM responses r JOIN citizens c ON c.id = r.citizen_id
           WHERE r.question_id = $1 ORDER BY r.created_at DESC LIMIT 10`,
          [q.id]
        );
        stats.total_responses = parseInt(count.rows[0].count);
        stats.recent = recent.rows;
      }

      questionStats.push(stats);
    }

    res.json({
      by_island: byIsland.rows,
      by_age_group: byAgeGroup.rows,
      by_sector: bySector.rows,
      questions: questionStats,
    });
  } catch (err) {
    console.error('Demographics error:', err);
    res.status(500).json({ error: 'Failed to fetch demographics' });
  }
});

export default router;
