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
    // Get all questions for context
    const questions = await pool.query(
      'SELECT id, type, label FROM questions ORDER BY sort_order ASC'
    );

    // Get recent citizen responses with their answers
    const citizenData = await pool.query(
      `SELECT c.id, c.island, c.age_group, c.sector
       FROM citizens c
       ORDER BY c.created_at DESC
       LIMIT 200`
    );

    if (citizenData.rows.length === 0) {
      return res.json({ insights: 'No responses available for analysis yet.' });
    }

    const citizenIds = citizenData.rows.map((c: any) => c.id);
    const answersResult = await pool.query(
      `SELECT r.citizen_id, q.label, q.type, r.value
       FROM responses r
       JOIN questions q ON q.id = r.question_id
       WHERE r.citizen_id = ANY($1)
       ORDER BY r.citizen_id, q.sort_order`,
      [citizenIds]
    );

    // Group answers by citizen
    const answersByCitizen = new Map<number, any[]>();
    for (const row of answersResult.rows) {
      if (!answersByCitizen.has(row.citizen_id)) answersByCitizen.set(row.citizen_id, []);
      answersByCitizen.get(row.citizen_id)!.push(row);
    }

    const dataForAnalysis = citizenData.rows.map((c: any, i: number) => {
      const answers = answersByCitizen.get(c.id) || [];
      const answerLines = answers.map((a: any) => `  - ${a.label}: ${a.value}`).join('\n');
      return `Response ${i + 1} (${c.island}, ${c.age_group}, ${c.sector}):\n${answerLines}`;
    }).join('\n\n');

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are analyzing citizen feedback from a Bahamas Technology Town Hall survey. Here are ${citizenData.rows.length} responses:

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
