import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';
import { stringify } from 'csv-stringify/sync';

const router = Router();

async function getExportData(query: Request['query']) {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (query.island) {
    conditions.push(`c.island = $${paramIdx++}`);
    params.push(query.island);
  }
  if (query.age_group) {
    conditions.push(`c.age_group = $${paramIdx++}`);
    params.push(query.age_group);
  }
  if (query.sector) {
    conditions.push(`c.sector = $${paramIdx++}`);
    params.push(query.sector);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT c.name, c.email, c.phone, c.lives_in_bahamas, c.island, c.country, c.age_group, c.sector, c.created_at,
            sr.tech_comfort_level, sr.primary_barrier, sr.interested_in_careers,
            sr.desired_skill, sr.biggest_concern, sr.best_opportunity,
            sr.gov_tech_suggestion, sr.preferred_gov_service,
            (SELECT string_agg(tv.topic || ' (#' || tv.rank || ')', ', ' ORDER BY tv.rank)
             FROM topic_votes tv WHERE tv.citizen_id = c.id) as topic_votes,
            (SELECT string_agg(ia.area, ', ')
             FROM interest_areas ia WHERE ia.citizen_id = c.id) as interest_areas
     FROM citizens c
     LEFT JOIN survey_responses sr ON sr.citizen_id = c.id
     ${where}
     ORDER BY c.created_at DESC`,
    params
  );

  return result.rows;
}

router.get('/api/admin/export/csv', adminAuth, async (req: Request, res: Response) => {
  try {
    const data = await getExportData(req.query);
    const csv = stringify(data, {
      header: true,
      columns: [
        'name', 'email', 'phone', 'lives_in_bahamas', 'island', 'country', 'age_group', 'sector', 'created_at',
        'tech_comfort_level', 'primary_barrier', 'interested_in_careers',
        'desired_skill', 'biggest_concern', 'best_opportunity',
        'gov_tech_suggestion', 'preferred_gov_service', 'topic_votes', 'interest_areas',
      ],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=town-hall-responses.csv');
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

router.get('/api/admin/export/json', adminAuth, async (req: Request, res: Response) => {
  try {
    const data = await getExportData(req.query);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=town-hall-responses.json');
    res.json(data);
  } catch (err) {
    console.error('JSON export error:', err);
    res.status(500).json({ error: 'Failed to export JSON' });
  }
});

export default router;
