import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/responses', adminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const island = req.query.island as string;
    const age_group = req.query.age_group as string;
    const sector = req.query.sector as string;
    const search = req.query.search as string;
    const sort = (req.query.sort as string) || 'created_at';
    const order = (req.query.order as string) === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (island) {
      conditions.push(`c.island = $${paramIdx++}`);
      params.push(island);
    }
    if (age_group) {
      conditions.push(`c.age_group = $${paramIdx++}`);
      params.push(age_group);
    }
    if (sector) {
      conditions.push(`c.sector = $${paramIdx++}`);
      params.push(sector);
    }
    if (search) {
      conditions.push(`(c.name ILIKE $${paramIdx} OR c.email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSorts = ['created_at', 'name', 'island', 'age_group', 'sector'];
    const sortCol = allowedSorts.includes(sort) ? `c.${sort}` : 'c.created_at';

    const countQuery = `SELECT COUNT(*) as count FROM citizens c ${where}`;
    const dataQuery = `
      SELECT c.*, sr.tech_comfort_level, sr.primary_barrier, sr.interested_in_careers
      FROM citizens c
      LEFT JOIN survey_responses sr ON sr.citizen_id = c.id
      ${where}
      ORDER BY ${sortCol} ${order}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, limit, offset]),
    ]);

    res.json({
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    });
  } catch (err) {
    console.error('Responses error:', err);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

router.get('/api/admin/responses/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [citizen, survey, topics, interests] = await Promise.all([
      pool.query('SELECT * FROM citizens WHERE id = $1', [id]),
      pool.query('SELECT * FROM survey_responses WHERE citizen_id = $1', [id]),
      pool.query('SELECT * FROM topic_votes WHERE citizen_id = $1 ORDER BY rank', [id]),
      pool.query('SELECT * FROM interest_areas WHERE citizen_id = $1', [id]),
    ]);

    if (citizen.rows.length === 0) {
      return res.status(404).json({ error: 'Citizen not found' });
    }

    res.json({
      citizen: citizen.rows[0],
      survey: survey.rows[0] || null,
      topic_votes: topics.rows,
      interest_areas: interests.rows,
    });
  } catch (err) {
    console.error('Response detail error:', err);
    res.status(500).json({ error: 'Failed to fetch response detail' });
  }
});

export default router;
