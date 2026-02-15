import { Router, Request, Response } from 'express';
import pool from '../services/database';
import type { CitizenSubmission } from '../types';

const router = Router();

router.post('/api/citizens', async (req: Request, res: Response) => {
  const body: CitizenSubmission = req.body;

  // Validation
  const errors: string[] = [];
  if (!body.name?.trim()) errors.push('Name is required');
  if (!body.email?.trim()) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Invalid email format');
  if (!body.island?.trim()) errors.push('Island is required');
  if (!body.age_group?.trim()) errors.push('Age group is required');
  if (!body.sector?.trim()) errors.push('Sector is required');
  if (!Array.isArray(body.answers)) errors.push('Answers are required');

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Validate required questions are answered
  const requiredQuestions = await pool.query(
    'SELECT id, label FROM questions WHERE active = true AND required = true'
  );
  const answeredIds = new Set(body.answers.map((a) => a.question_id));
  for (const q of requiredQuestions.rows) {
    if (!answeredIds.has(q.id)) {
      errors.push(`"${q.label}" is required`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert citizen
    const citizenResult = await client.query(
      `INSERT INTO citizens (name, email, phone, lives_in_bahamas, island, country, age_group, sector)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [body.name, body.email, body.phone || null, body.lives_in_bahamas ?? true, body.island, body.country || null, body.age_group, body.sector]
    );
    const citizenId = citizenResult.rows[0].id;

    // Insert dynamic answers
    for (const answer of body.answers) {
      if (answer.value !== undefined && answer.value !== '' && answer.value !== '[]') {
        await client.query(
          'INSERT INTO responses (citizen_id, question_id, value) VALUES ($1, $2, $3)',
          [citizenId, answer.question_id, answer.value]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id: citizenId });
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ errors: ['A submission with this email already exists'] });
    }
    console.error('Submission error:', err);
    res.status(500).json({ errors: ['Internal server error'] });
  } finally {
    client.release();
  }
});

export default router;
