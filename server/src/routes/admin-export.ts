import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';
import { stringify } from 'csv-stringify';

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

  // Get questions for column headers
  const questions = await pool.query(
    'SELECT id, label, type FROM questions ORDER BY sort_order ASC'
  );

  // Get citizens with all their answers
  const citizens = await pool.query(
    `SELECT c.* FROM citizens c ${where} ORDER BY c.created_at DESC`,
    params
  );

  if (citizens.rows.length === 0) return { questions: questions.rows, rows: [] };

  const citizenIds = citizens.rows.map((c: any) => c.id);
  const answers = await pool.query(
    `SELECT citizen_id, question_id, value FROM responses WHERE citizen_id = ANY($1)`,
    [citizenIds]
  );

  // Index answers by citizen_id
  const answerMap = new Map<number, Map<number, string>>();
  for (const a of answers.rows) {
    if (!answerMap.has(a.citizen_id)) answerMap.set(a.citizen_id, new Map());
    answerMap.get(a.citizen_id)!.set(a.question_id, a.value);
  }

  const rows = citizens.rows.map((c: any) => {
    const citizenAnswers = answerMap.get(c.id) || new Map();
    const row: Record<string, any> = {
      name: c.name,
      email: c.email,
      phone: c.phone,
      lives_in_bahamas: c.lives_in_bahamas,
      island: c.island,
      country: c.country,
      age_group: c.age_group,
      sector: c.sector,
      created_at: c.created_at,
    };
    for (const q of questions.rows) {
      const val = citizenAnswers.get(q.id) || '';
      // For checkbox/JSON arrays, flatten to comma-separated
      if (q.type === 'checkbox' && val) {
        try {
          row[q.label] = JSON.parse(val).join(', ');
        } catch {
          row[q.label] = val;
        }
      } else {
        row[q.label] = val;
      }
    }
    return row;
  });

  return { questions: questions.rows, rows };
}

router.get('/api/admin/export/csv', adminAuth, async (req: Request, res: Response) => {
  try {
    const { questions, rows } = await getExportData(req.query);
    const columns = [
      'name', 'email', 'phone', 'lives_in_bahamas', 'island', 'country',
      'age_group', 'sector', 'created_at',
      ...questions.map((q: any) => q.label),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=town-hall-responses.csv');

    const stringifier = stringify({ header: true, columns });
    stringifier.pipe(res);
    for (const row of rows) {
      stringifier.write(row);
    }
    stringifier.end();
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

router.get('/api/admin/export/json', adminAuth, async (req: Request, res: Response) => {
  try {
    const { rows } = await getExportData(req.query);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=town-hall-responses.json');
    res.json(rows);
  } catch (err) {
    console.error('JSON export error:', err);
    res.status(500).json({ error: 'Failed to export JSON' });
  }
});

export default router;
