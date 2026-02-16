import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/demographics', adminAuth, async (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.date_from as string | undefined;
    const dateTo = req.query.date_to as string | undefined;

    const conditions: string[] = [];
    const dateParams: any[] = [];
    let paramIdx = 1;

    if (dateFrom) {
      conditions.push(`c.created_at >= $${paramIdx++}::date`);
      dateParams.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`c.created_at < ($${paramIdx++}::date + interval '1 day')`);
      dateParams.push(dateTo);
    }

    const citizenWhere = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Citizen demographics (static fields) - use alias 'c' for citizens
    const [byIsland, byAgeGroup, bySector] = await Promise.all([
      pool.query(`SELECT c.island, COUNT(*) as count FROM citizens c ${citizenWhere} GROUP BY c.island ORDER BY count DESC`, dateParams),
      pool.query(`SELECT c.age_group, COUNT(*) as count FROM citizens c ${citizenWhere} GROUP BY c.age_group ORDER BY count DESC`, dateParams),
      pool.query(`SELECT c.sector, COUNT(*) as count FROM citizens c ${citizenWhere} GROUP BY c.sector ORDER BY count DESC`, dateParams),
    ]);

    // Dynamic question aggregations - need to join through citizens for date filter
    const questions = await pool.query(
      'SELECT id, type, label, options FROM questions ORDER BY sort_order ASC'
    );

    // Build response conditions with offset param indices (since $1 = question_id)
    const responseConditions: string[] = [];
    const offset = 1; // $1 is question_id
    let rParamIdx = offset + 1;
    if (dateFrom) {
      responseConditions.push(`c.created_at >= $${rParamIdx++}::date`);
    }
    if (dateTo) {
      responseConditions.push(`c.created_at < ($${rParamIdx++}::date + interval '1 day')`);
    }
    const responseWhere = responseConditions.length > 0
      ? `AND ${responseConditions.join(' AND ')}`
      : '';

    const questionStats = [];
    for (const q of questions.rows) {
      let stats: any = { id: q.id, type: q.type, label: q.label };

      if (q.type === 'scale') {
        const result = await pool.query(
          `SELECT r.value, COUNT(*) as count FROM responses r JOIN citizens c ON c.id = r.citizen_id WHERE r.question_id = $1 ${responseWhere} GROUP BY r.value ORDER BY r.value`,
          [q.id, ...dateParams]
        );
        const avg = await pool.query(
          `SELECT ROUND(AVG(r.value::numeric), 2) as avg FROM responses r JOIN citizens c ON c.id = r.citizen_id WHERE r.question_id = $1 ${responseWhere}`,
          [q.id, ...dateParams]
        );
        stats.distribution = result.rows;
        stats.average = avg.rows[0]?.avg ? parseFloat(avg.rows[0].avg) : 0;
      } else if (q.type === 'dropdown') {
        const result = await pool.query(
          `SELECT r.value, COUNT(*) as count FROM responses r JOIN citizens c ON c.id = r.citizen_id WHERE r.question_id = $1 ${responseWhere} GROUP BY r.value ORDER BY count DESC`,
          [q.id, ...dateParams]
        );
        stats.distribution = result.rows;
      } else if (q.type === 'checkbox') {
        const result = await pool.query(
          `SELECT item, COUNT(*) as count
           FROM responses r JOIN citizens c ON c.id = r.citizen_id,
           jsonb_array_elements_text(
             CASE WHEN r.value ~ '^\\[' THEN r.value::jsonb ELSE jsonb_build_array(r.value) END
           ) AS item
           WHERE r.question_id = $1 ${responseWhere}
           GROUP BY item ORDER BY count DESC`,
          [q.id, ...dateParams]
        );
        stats.distribution = result.rows;
      } else if (q.type === 'text' || q.type === 'textarea') {
        const count = await pool.query(
          `SELECT COUNT(*) as count FROM responses r JOIN citizens c ON c.id = r.citizen_id WHERE r.question_id = $1 ${responseWhere}`,
          [q.id, ...dateParams]
        );
        const recent = await pool.query(
          `SELECT r.value, c.island, c.age_group
           FROM responses r JOIN citizens c ON c.id = r.citizen_id
           WHERE r.question_id = $1 ${responseWhere} ORDER BY r.created_at DESC LIMIT 10`,
          [q.id, ...dateParams]
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
