import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { CitizenSubmission } from '../types';

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
  if (!body.tech_comfort_level || body.tech_comfort_level < 1 || body.tech_comfort_level > 5) {
    errors.push('Tech comfort level must be between 1 and 5');
  }
  if (!Array.isArray(body.topic_votes) || body.topic_votes.length !== 3) {
    errors.push('Exactly 3 topic votes are required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert citizen
    const citizenResult = await client.query(
      `INSERT INTO citizens (name, email, phone, island, age_group, sector)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [body.name, body.email, body.phone || null, body.island, body.age_group, body.sector]
    );
    const citizenId = citizenResult.rows[0].id;

    // Insert survey response
    await client.query(
      `INSERT INTO survey_responses
       (citizen_id, tech_comfort_level, primary_barrier, interested_in_careers,
        desired_skill, biggest_concern, best_opportunity, gov_tech_suggestion, preferred_gov_service)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        citizenId,
        body.tech_comfort_level,
        body.primary_barrier || null,
        body.interested_in_careers || false,
        body.desired_skill || null,
        body.biggest_concern || null,
        body.best_opportunity || null,
        body.gov_tech_suggestion || null,
        body.preferred_gov_service || null,
      ]
    );

    // Insert topic votes
    for (const vote of body.topic_votes) {
      await client.query(
        'INSERT INTO topic_votes (citizen_id, topic, rank) VALUES ($1, $2, $3)',
        [citizenId, vote.topic, vote.rank]
      );
    }

    // Insert interest areas
    if (Array.isArray(body.interest_areas)) {
      for (const area of body.interest_areas) {
        await client.query(
          'INSERT INTO interest_areas (citizen_id, area) VALUES ($1, $2)',
          [citizenId, area]
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
