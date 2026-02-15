import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/priorities', adminAuth, async (_req: Request, res: Response) => {
  try {
    const [topicRankings, govServices, topicsByIsland, topicsByAge] = await Promise.all([
      // Topic rankings with vote counts and average rank
      pool.query(
        `SELECT topic,
          COUNT(*) as total_votes,
          ROUND(AVG(rank)::numeric, 2) as avg_rank,
          COUNT(*) FILTER (WHERE rank = 1) as rank_1,
          COUNT(*) FILTER (WHERE rank = 2) as rank_2,
          COUNT(*) FILTER (WHERE rank = 3) as rank_3
         FROM topic_votes
         GROUP BY topic
         ORDER BY total_votes DESC, avg_rank ASC`
      ),
      // Preferred government services
      pool.query(
        `SELECT preferred_gov_service, COUNT(*) as count
         FROM survey_responses
         WHERE preferred_gov_service IS NOT NULL
         GROUP BY preferred_gov_service
         ORDER BY count DESC`
      ),
      // Cross-tab: topics by island
      pool.query(
        `SELECT tv.topic, c.island, COUNT(*) as count
         FROM topic_votes tv
         JOIN citizens c ON c.id = tv.citizen_id
         GROUP BY tv.topic, c.island
         ORDER BY tv.topic, count DESC`
      ),
      // Cross-tab: topics by age group
      pool.query(
        `SELECT tv.topic, c.age_group, COUNT(*) as count
         FROM topic_votes tv
         JOIN citizens c ON c.id = tv.citizen_id
         GROUP BY tv.topic, c.age_group
         ORDER BY tv.topic, count DESC`
      ),
    ]);

    res.json({
      topic_rankings: topicRankings.rows,
      gov_services: govServices.rows,
      topics_by_island: topicsByIsland.rows,
      topics_by_age: topicsByAge.rows,
    });
  } catch (err) {
    console.error('Priorities error:', err);
    res.status(500).json({ error: 'Failed to fetch priorities' });
  }
});

export default router;
