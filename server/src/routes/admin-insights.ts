import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

router.post('/api/admin/insights', adminAuth, async (_req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: 'ANTHROPIC_API_KEY not configured. Add it to your environment variables.',
    });
  }

  try {
    const responses = await pool.query(
      `SELECT c.island, c.age_group, c.sector,
              sr.biggest_concern, sr.best_opportunity, sr.gov_tech_suggestion,
              sr.tech_comfort_level, sr.primary_barrier
       FROM citizens c
       JOIN survey_responses sr ON sr.citizen_id = c.id
       WHERE sr.biggest_concern IS NOT NULL
          OR sr.best_opportunity IS NOT NULL
          OR sr.gov_tech_suggestion IS NOT NULL`
    );

    if (responses.rows.length === 0) {
      return res.json({ insights: 'No open-ended responses available for analysis yet.' });
    }

    const dataForAnalysis = responses.rows.map((r, i) => (
      `Response ${i + 1} (${r.island}, ${r.age_group}, ${r.sector}, comfort: ${r.tech_comfort_level}/5):
  - Biggest concern: ${r.biggest_concern || 'N/A'}
  - Best opportunity: ${r.best_opportunity || 'N/A'}
  - Gov tech suggestion: ${r.gov_tech_suggestion || 'N/A'}
  - Primary barrier: ${r.primary_barrier || 'N/A'}`
    )).join('\n\n');

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are analyzing citizen feedback from a Bahamas Technology Town Hall survey. Here are ${responses.rows.length} responses:

${dataForAnalysis}

Please provide a structured analysis with the following sections:

## Key Themes
Identify the 3-5 most prominent themes across all responses.

## Sentiment Analysis
Overall sentiment breakdown (positive, negative, neutral) with brief explanation.

## Summary Brief
A 2-3 paragraph executive summary of the findings suitable for government officials.

## Notable Quotes
3-5 direct quotes that best represent the range of citizen perspectives.

## Recommendations
3-5 actionable recommendations based on the feedback.`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    res.json({ insights: textContent?.text || 'No analysis generated.' });
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
