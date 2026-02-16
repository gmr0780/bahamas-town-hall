import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../services/database';
import { sendThankYouEmail } from '../services/email';
import Anthropic from '@anthropic-ai/sdk';
import type { Question } from '../types';

const router = Router();

// --- Constants ---

const ISLANDS = [
  'New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Andros',
  'Eleuthera', 'Exuma', 'Long Island', 'Cat Island', 'San Salvador', 'Bimini',
  'Inagua', 'Acklins', 'Berry Islands', 'Crooked Island', 'Mayaguana',
  'Ragged Island', 'Rum Cay',
];

const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

const SECTORS = [
  'Technology & Innovation', 'Tourism & Hospitality', 'Financial Services',
  'Healthcare', 'Education', 'Government & Public Service',
  'Agriculture & Fisheries', 'Real Estate & Construction', 'Retail & Commerce',
  'Transportation & Logistics', 'Arts, Culture & Entertainment',
  'Non-Profit & Community', 'Student', 'Retired', 'Other',
];

const DEMOGRAPHIC_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'lives_in_bahamas', 'island', 'country', 'age_group', 'sector',
] as const;

type DemographicKey = typeof DEMOGRAPHIC_FIELDS[number];

// --- Session store ---

interface Demographics {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  lives_in_bahamas?: boolean;
  island?: string;
  country?: string;
  age_group?: string;
  sector?: string;
}

interface Session {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  demographics: Demographics;
  answers: Record<number, string>;
  questions: Question[];
  phase: 'demographics' | 'survey' | 'complete';
  currentQuestionIndex: number;
  createdAt: number;
}

const sessions = new Map<string, Session>();

// Cleanup sessions older than 1 hour every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > 60 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// --- Claude tool definition ---

const surveyUpdateTool: Anthropic.Tool = {
  name: 'survey_update',
  description: 'Report extracted survey data and generate reply',
  input_schema: {
    type: 'object' as const,
    properties: {
      extracted_demographics: {
        type: 'object',
        description: 'Any demographic fields extracted from the user message',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          lives_in_bahamas: { type: 'boolean' },
          island: { type: 'string' },
          country: { type: 'string' },
          age_group: { type: 'string' },
          sector: { type: 'string' },
        },
      },
      extracted_answer: {
        type: 'object',
        description: 'Survey answer extracted from the user message, if applicable',
        properties: {
          question_id: { type: 'number' },
          value: { type: 'string' },
        },
      },
      reply: {
        type: 'string',
        description: 'The conversational reply to show the user',
      },
      quick_replies: {
        type: 'array',
        items: { type: 'string' },
        description: 'Quick reply buttons to show (for choice/scale questions)',
      },
      is_asking_followup: {
        type: 'boolean',
        description: 'True if asking a follow-up question before moving to next topic',
      },
    },
    required: ['reply'],
  },
};

// --- Helpers ---

function countDemographicsCollected(demographics: Demographics): number {
  let count = 0;
  if (demographics.first_name) count++;
  if (demographics.last_name) count++;
  if (demographics.email) count++;
  if (demographics.phone !== undefined) count++;
  if (demographics.lives_in_bahamas !== undefined) count++;
  if (demographics.island) count++;
  // country only needed if lives_in_bahamas is false
  if (demographics.lives_in_bahamas === false) {
    if (demographics.country) count++;
  } else if (demographics.lives_in_bahamas === true) {
    count++; // country not needed, count as collected
  }
  if (demographics.age_group) count++;
  if (demographics.sector) count++;
  return count;
}

function getMissingDemographics(demographics: Demographics): string[] {
  const missing: string[] = [];
  if (!demographics.first_name) missing.push('first_name');
  if (!demographics.last_name) missing.push('last_name');
  if (!demographics.email) missing.push('email');
  // phone is optional, but we still ask
  if (demographics.phone === undefined) missing.push('phone (optional)');
  if (demographics.lives_in_bahamas === undefined) missing.push('lives_in_bahamas (do they live in The Bahamas? yes/no)');
  if (demographics.lives_in_bahamas === true && !demographics.island) missing.push('island');
  if (demographics.lives_in_bahamas === false && !demographics.country) missing.push('country');
  if (demographics.lives_in_bahamas === false && !demographics.island) missing.push('island (which Bahamian island they are most connected to)');
  if (demographics.lives_in_bahamas === undefined && !demographics.island) missing.push('island');
  if (!demographics.age_group) missing.push('age_group');
  if (!demographics.sector) missing.push('sector');
  return missing;
}

function areDemographicsComplete(demographics: Demographics): boolean {
  if (!demographics.first_name || !demographics.last_name || !demographics.email) return false;
  if (demographics.lives_in_bahamas === undefined) return false;
  if (!demographics.island) return false;
  if (demographics.lives_in_bahamas === false && !demographics.country) return false;
  if (!demographics.age_group) return false;
  if (!demographics.sector) return false;
  return true;
}

function calculateProgress(session: Session): number {
  const totalDemographics = 9;
  const totalQuestions = session.questions.length;
  const total = totalDemographics + totalQuestions;
  if (total === 0) return 0;
  const demographicsCollected = countDemographicsCollected(session.demographics);
  const answersCollected = Object.keys(session.answers).length;
  return Math.round(((demographicsCollected + answersCollected) / total) * 100);
}

function buildSystemPrompt(session: Session): string {
  const currentQuestion = session.phase === 'survey' && session.currentQuestionIndex < session.questions.length
    ? session.questions[session.currentQuestionIndex]
    : null;

  let currentQuestionDesc = 'N/A (collecting demographics)';
  if (currentQuestion) {
    let desc = `[Q${currentQuestion.id}] (${currentQuestion.type}) "${currentQuestion.label}"`;
    if (currentQuestion.options) {
      const opts = typeof currentQuestion.options === 'string'
        ? JSON.parse(currentQuestion.options)
        : currentQuestion.options;
      if (Array.isArray(opts)) {
        desc += ` Options: ${JSON.stringify(opts)}`;
      } else if (opts.min !== undefined && opts.max !== undefined) {
        desc += ` Scale: ${opts.min}-${opts.max} (${opts.min_label} to ${opts.max_label})`;
      }
    }
    currentQuestionDesc = desc;
  } else if (session.phase === 'survey') {
    currentQuestionDesc = 'All questions answered!';
  }

  const questionsRemaining = session.phase === 'survey'
    ? session.questions.length - session.currentQuestionIndex
    : session.questions.length;

  const missingDemographics = getMissingDemographics(session.demographics);

  return `You are Bahamas AI, a friendly and warm assistant helping collect feedback for the Bahamas Technology Town Hall survey. You have a light Bahamian personality — encouraging, positive, occasionally using local expressions, and making the survey feel like a fun chat rather than a boring form.

CURRENT STATE:
- Phase: ${session.phase}
- Demographics collected so far: ${JSON.stringify(session.demographics)}
- Current question: ${currentQuestionDesc}
- Questions remaining: ${questionsRemaining}
- Total questions: ${session.questions.length}
- Answers collected: ${JSON.stringify(session.answers)}

RULES:
1. Ask ONE thing at a time. Never overwhelm.
2. For demographics, collect in this order: first name, then last name (ask both — e.g. "What's your first name?" then "And your last name?"), email (optional: phone), do they live in Bahamas (yes/no), if yes ask island, if no ask country then island, age group, sector.
3. For survey questions, present them naturally. For choice questions (dropdown/checkbox/scale), mention the options and set quick_replies so the user can tap.
4. For checkbox questions, the user can pick multiple. List them and let them choose.
5. For scale questions (1-5 etc), show the scale labels and set quick_replies to the numbers.
6. For text/textarea questions, just ask naturally and let them type freely.
7. After an interesting open-ended answer, you MAY ask ONE brief follow-up before moving on. Set is_asking_followup=true.
8. Adapt your tone — if they seem young and techy, be casual. If they seem formal, match that.
9. Acknowledge sentiment — if they express frustration, validate it. If they're excited, match the energy.
10. Give progress updates: "We're about halfway!", "Almost done!", etc.
11. When all questions are answered AND demographics are complete, say thanks warmly and let them know you're submitting their feedback. Mention they'll see a personalized summary.
12. Use the survey_update tool to report extracted data with every response.
13. Keep replies SHORT — 1-3 sentences max. This is a chat, not an essay.
14. NEVER make up data. Only extract what the user actually said.
15. For the island question, valid options are: ${JSON.stringify(ISLANDS)}
16. For age groups: ${JSON.stringify(AGE_GROUPS)}
17. For sectors: ${JSON.stringify(SECTORS)}
18. If the user says they don't want to provide phone, set phone to "declined" in extracted_demographics.
19. For email, if the user declines, still try to encourage them — it's needed for the submission. But if they insist, accept it.

DEMOGRAPHIC FIELDS STILL NEEDED: ${missingDemographics.length > 0 ? missingDemographics.join(', ') : 'ALL COLLECTED'}

${session.phase === 'survey' && currentQuestion ? `CURRENT SURVEY QUESTION TO ASK:
Type: ${currentQuestion.type}
Label: ${currentQuestion.label}
${currentQuestion.description ? `Description: ${currentQuestion.description}` : ''}
${currentQuestion.options ? `Options: ${JSON.stringify(typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options)}` : ''}
Question ID for extracted_answer: ${currentQuestion.id}` : ''}`;
}

async function callClaude(
  session: Session,
  isOpening: boolean = false,
): Promise<{ reply: string; quick_replies?: string[]; extracted_demographics?: Partial<Demographics>; extracted_answer?: { question_id: number; value: string }; is_asking_followup?: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = buildSystemPrompt(session);

  const messages: Anthropic.MessageParam[] = isOpening
    ? [{ role: 'user', content: 'Hi, I\'d like to take the survey.' }]
    : session.messages.map((m) => ({ role: m.role, content: m.content }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools: [surveyUpdateTool],
    tool_choice: { type: 'any' },
  });

  // Extract tool use result
  const toolUseBlock = response.content.find((c) => c.type === 'tool_use');
  if (toolUseBlock && toolUseBlock.type === 'tool_use') {
    const input = toolUseBlock.input as {
      reply?: string;
      quick_replies?: string[];
      extracted_demographics?: Partial<Demographics>;
      extracted_answer?: { question_id: number; value: string };
      is_asking_followup?: boolean;
    };
    return {
      reply: input.reply || 'I\'m here to help! Let\'s get started with the survey.',
      quick_replies: input.quick_replies,
      extracted_demographics: input.extracted_demographics,
      extracted_answer: input.extracted_answer,
      is_asking_followup: input.is_asking_followup,
    };
  }

  // Fallback: extract text if no tool use
  const textBlock = response.content.find((c) => c.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return { reply: textBlock.text };
  }

  return { reply: 'Let\'s continue with the survey! What do you think?' };
}

// --- Routes ---

router.post('/api/chat/message', async (req: Request, res: Response) => {
  try {
    const { session_id, message, turnstile_token } = req.body as {
      session_id?: string;
      message: string;
      turnstile_token?: string;
    };

    // --- New session ---
    if (!session_id) {
      // Verify Turnstile token if configured
      const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
      if (turnstileSecret) {
        if (!turnstile_token) {
          return res.status(400).json({ error: 'Verification check is required' });
        }
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret: turnstileSecret, response: turnstile_token }),
        });
        const verifyData = await verifyRes.json() as { success: boolean };
        if (!verifyData.success) {
          return res.status(403).json({ error: 'Verification failed. Please try again.' });
        }
      }

      // Check if survey is open
      const surveyStatus = await pool.query("SELECT value FROM site_settings WHERE key = 'survey_open'");
      if (surveyStatus.rows[0]?.value !== 'true') {
        return res.status(403).json({ error: 'The survey is currently closed' });
      }

      // Load questions from DB
      const questionsResult = await pool.query(
        'SELECT id, type, label, description, required, sort_order, options, active FROM questions WHERE active = true ORDER BY sort_order ASC'
      );
      const questions = questionsResult.rows as Question[];

      // Create session
      const newSessionId = crypto.randomUUID();
      const session: Session = {
        messages: [],
        demographics: {},
        answers: {},
        questions,
        phase: 'demographics',
        currentQuestionIndex: 0,
        createdAt: Date.now(),
      };

      sessions.set(newSessionId, session);

      // Generate opening message from Claude
      const result = await callClaude(session, true);

      // Store assistant reply in conversation history
      session.messages.push({ role: 'assistant', content: result.reply });

      return res.json({
        session_id: newSessionId,
        reply: result.reply,
        quick_replies: result.quick_replies,
        progress: 0,
        is_complete: false,
      });
    }

    // --- Existing session ---
    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired. Please start a new chat.' });
    }

    if (session.phase === 'complete') {
      return res.json({
        session_id,
        reply: 'Your survey has already been submitted. Thank you!',
        progress: 100,
        is_complete: true,
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add user message to history
    session.messages.push({ role: 'user', content: message });

    // Call Claude
    const result = await callClaude(session);

    // Process extracted demographics
    if (result.extracted_demographics) {
      const demo = result.extracted_demographics;
      for (const key of Object.keys(demo) as DemographicKey[]) {
        const val = demo[key];
        if (val !== undefined && val !== null && val !== '') {
          (session.demographics as any)[key] = val;
        }
      }
    }

    // Process extracted answer
    if (result.extracted_answer && result.extracted_answer.question_id && result.extracted_answer.value) {
      const { question_id, value } = result.extracted_answer;
      // Validate question_id exists in our question set
      const validQuestion = session.questions.find((q) => q.id === question_id);
      if (validQuestion) {
        session.answers[question_id] = value;

        // Advance question index if we just answered the current question
        if (session.phase === 'survey') {
          const currentQ = session.questions[session.currentQuestionIndex];
          if (currentQ && currentQ.id === question_id && !result.is_asking_followup) {
            session.currentQuestionIndex++;
          }
        }
      }
    }

    // Phase transitions
    if (session.phase === 'demographics' && areDemographicsComplete(session.demographics)) {
      session.phase = 'survey';
    }

    // Check if survey is complete
    if (session.phase === 'survey' && !result.is_asking_followup) {
      // Advance past any already-answered questions
      while (
        session.currentQuestionIndex < session.questions.length &&
        session.answers[session.questions[session.currentQuestionIndex].id] !== undefined
      ) {
        session.currentQuestionIndex++;
      }

      if (session.currentQuestionIndex >= session.questions.length && areDemographicsComplete(session.demographics)) {
        // All done! Submit to DB
        try {
          const citizenId = await submitSurvey(session);
          session.phase = 'complete';

          // Store assistant reply
          session.messages.push({ role: 'assistant', content: result.reply });

          return res.json({
            session_id,
            reply: result.reply,
            progress: 100,
            is_complete: true,
            citizen_id: citizenId,
          });
        } catch (submitErr: any) {
          if (submitErr.code === '23505') {
            return res.status(409).json({
              error: 'A submission with this email already exists.',
              session_id,
              reply: 'It looks like someone with that email has already submitted a response. If you\'d like to try with a different email, just let me know!',
              progress: calculateProgress(session),
              is_complete: false,
            });
          }
          console.error('Chat survey submission error:', submitErr);
          return res.status(500).json({ error: 'Failed to submit survey' });
        }
      }
    }

    // Store assistant reply in conversation history
    session.messages.push({ role: 'assistant', content: result.reply });

    return res.json({
      session_id,
      reply: result.reply,
      quick_replies: result.quick_replies,
      progress: calculateProgress(session),
      is_complete: false,
    });
  } catch (err) {
    console.error('Chat message error:', err);
    return res.status(500).json({ error: 'Failed to process message' });
  }
});

async function submitSurvey(session: Session): Promise<number> {
  const { demographics, answers } = session;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert citizen
    const citizenResult = await client.query(
      `INSERT INTO citizens (name, email, phone, lives_in_bahamas, island, country, age_group, sector)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        `${demographics.first_name} ${demographics.last_name}`,
        demographics.email,
        demographics.phone && demographics.phone !== 'declined' ? demographics.phone : null,
        demographics.lives_in_bahamas ?? true,
        demographics.island,
        demographics.country || null,
        demographics.age_group,
        demographics.sector,
      ]
    );
    const citizenId = citizenResult.rows[0].id;

    // Insert survey answers
    for (const [questionIdStr, value] of Object.entries(answers)) {
      const questionId = parseInt(questionIdStr, 10);
      if (value !== undefined && value !== '' && value !== '[]') {
        await client.query(
          'INSERT INTO responses (citizen_id, question_id, value) VALUES ($1, $2, $3)',
          [citizenId, questionId, value]
        );
      }
    }

    await client.query('COMMIT');

    // Fire-and-forget thank-you email
    if (demographics.email) {
      sendThankYouEmail(demographics.email, demographics.first_name || 'Friend').catch(() => {});
    }

    return citizenId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// --- POST /api/chat/summary ---

router.post('/api/chat/summary', async (req: Request, res: Response) => {
  try {
    const { citizen_id } = req.body as { citizen_id: number };

    if (!citizen_id) {
      return res.status(400).json({ error: 'citizen_id is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    // Fetch citizen demographics
    const citizenResult = await pool.query(
      'SELECT name, island, age_group, sector, lives_in_bahamas, country FROM citizens WHERE id = $1',
      [citizen_id]
    );
    if (citizenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Citizen not found' });
    }
    const citizen = citizenResult.rows[0];

    // Fetch citizen's answers with question labels
    const answersResult = await pool.query(
      `SELECT q.label, q.type, r.value
       FROM responses r
       JOIN questions q ON q.id = r.question_id
       WHERE r.citizen_id = $1
       ORDER BY q.sort_order`,
      [citizen_id]
    );

    // Fetch aggregate stats
    const totalCountResult = await pool.query('SELECT COUNT(*) as count FROM citizens');
    const totalCount = parseInt(totalCountResult.rows[0].count, 10);

    const topIslandsResult = await pool.query(
      `SELECT island, COUNT(*) as count
       FROM citizens
       GROUP BY island
       ORDER BY count DESC
       LIMIT 5`
    );

    const commonAnswersResult = await pool.query(
      `SELECT q.label, r.value, COUNT(*) as count
       FROM responses r
       JOIN questions q ON q.id = r.question_id
       WHERE q.type IN ('dropdown', 'scale')
       GROUP BY q.label, r.value
       ORDER BY count DESC
       LIMIT 10`
    );

    const citizenAnswers = answersResult.rows
      .map((a: any) => `- ${a.label}: ${a.value}`)
      .join('\n');

    const topIslands = topIslandsResult.rows
      .map((r: any) => `${r.island}: ${r.count} responses`)
      .join(', ');

    const commonThemes = commonAnswersResult.rows
      .map((r: any) => `${r.label} -> "${r.value}" (${r.count} people)`)
      .join('\n');

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are Bahamas AI. A citizen just completed the Technology Town Hall survey. You must respond with valid JSON only — no markdown, no code fences, no extra text.

Generate TWO things:

1. A fun "Tech Personality" based on their answers. Be creative — invent a unique, Bahamas-flavored tech personality title (e.g. "The Island Innovator", "The Digital Conch Shell", "The Coral Coder", "The Nassau Navigator"). Pick an emoji that fits. Write a short, playful 1-2 sentence description of this personality type that references their specific answers.

2. A brief, personalized insight (3-4 sentences) about their responses compared to other Bahamians. Be warm and encouraging. Mention something specific about their answers. End with encouragement to share the survey.

Respond with this exact JSON structure:
{"personality_title":"<title>","personality_emoji":"<single emoji>","personality_description":"<1-2 sentences>","summary":"<3-4 sentences>"}

Their info:
Name: ${citizen.name}
Island: ${citizen.island}
Age group: ${citizen.age_group}
Sector: ${citizen.sector}
${citizen.lives_in_bahamas ? 'Lives in The Bahamas' : `Lives abroad (${citizen.country})`}

Their responses:
${citizenAnswers || 'No detailed answers provided.'}

Aggregate data:
Total responses so far: ${totalCount}
Top islands: ${topIslands}
Common answers:
${commonThemes || 'Not enough data yet.'}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    const raw = textContent?.text || '';

    try {
      const parsed = JSON.parse(raw);
      return res.json({
        personality_title: parsed.personality_title || null,
        personality_emoji: parsed.personality_emoji || null,
        personality_description: parsed.personality_description || null,
        summary: parsed.summary || 'Thank you for your feedback!',
      });
    } catch {
      // Fallback if JSON parsing fails — return as plain summary
      return res.json({ summary: raw || 'Thank you for your feedback!' });
    }
  } catch (err) {
    console.error('Chat summary error:', err);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
