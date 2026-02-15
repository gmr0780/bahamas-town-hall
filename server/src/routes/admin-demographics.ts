import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/demographics', adminAuth, async (_req: Request, res: Response) => {
  try {
    const [
      byIsland,
      byAgeGroup,
      bySector,
      byBarrier,
      comfortByIsland,
      comfortByAge,
      careerInterest,
      byDesiredSkill,
      interestAreas,
    ] = await Promise.all([
      pool.query('SELECT island, COUNT(*) as count FROM citizens GROUP BY island ORDER BY count DESC'),
      pool.query('SELECT age_group, COUNT(*) as count FROM citizens GROUP BY age_group ORDER BY count DESC'),
      pool.query('SELECT sector, COUNT(*) as count FROM citizens GROUP BY sector ORDER BY count DESC'),
      pool.query(
        'SELECT primary_barrier, COUNT(*) as count FROM survey_responses WHERE primary_barrier IS NOT NULL GROUP BY primary_barrier ORDER BY count DESC'
      ),
      pool.query(
        `SELECT c.island, ROUND(AVG(sr.tech_comfort_level)::numeric, 2) as avg_comfort
         FROM citizens c JOIN survey_responses sr ON sr.citizen_id = c.id
         GROUP BY c.island ORDER BY avg_comfort DESC`
      ),
      pool.query(
        `SELECT c.age_group, ROUND(AVG(sr.tech_comfort_level)::numeric, 2) as avg_comfort
         FROM citizens c JOIN survey_responses sr ON sr.citizen_id = c.id
         GROUP BY c.age_group ORDER BY avg_comfort DESC`
      ),
      pool.query(
        `SELECT interested_in_careers, COUNT(*) as count
         FROM survey_responses GROUP BY interested_in_careers`
      ),
      pool.query(
        'SELECT desired_skill, COUNT(*) as count FROM survey_responses WHERE desired_skill IS NOT NULL GROUP BY desired_skill ORDER BY count DESC'
      ),
      pool.query(
        'SELECT area, COUNT(*) as count FROM interest_areas GROUP BY area ORDER BY count DESC'
      ),
    ]);

    res.json({
      by_island: byIsland.rows,
      by_age_group: byAgeGroup.rows,
      by_sector: bySector.rows,
      by_barrier: byBarrier.rows,
      comfort_by_island: comfortByIsland.rows,
      comfort_by_age: comfortByAge.rows,
      career_interest: careerInterest.rows,
      by_desired_skill: byDesiredSkill.rows,
      interest_areas: interestAreas.rows,
    });
  } catch (err) {
    console.error('Demographics error:', err);
    res.status(500).json({ error: 'Failed to fetch demographics' });
  }
});

export default router;
