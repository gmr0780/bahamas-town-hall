# Dynamic Survey System + Bahamas Branding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded survey with a fully dynamic question system managed from the admin panel, add Bahamas national branding, and support 10k+ users.

**Architecture:** Dynamic questions stored in Postgres `questions` table, answers in generic `responses` table. Admin CRUD API for question management. Client fetches question definitions from API and renders appropriate input components per type. Dashboard auto-generates charts from question metadata. Existing data migrated from old fixed-schema tables.

**Tech Stack:** Express, PostgreSQL, React 19, TypeScript, Tailwind CSS 4, Recharts, Vite 7

**Note:** This project has no test framework set up. Verification steps use TypeScript type-checking (`npx tsc --noEmit`) and manual endpoint testing via curl.

---

### Task 1: Database Migration -- New Tables

**Files:**
- Create: `db/migrate-dynamic.sql`
- Modify: `server/src/scripts/migrate.ts`

**Step 1: Create the migration SQL**

Create `db/migrate-dynamic.sql`:

```sql
-- Dynamic survey questions
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'textarea', 'dropdown', 'checkbox', 'scale')),
  label TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  options JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_active_order ON questions(active, sort_order);

-- Dynamic survey responses
CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  citizen_id INTEGER NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_citizen ON responses(citizen_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);
```

**Step 2: Update migrate.ts to run both migrations**

Modify `server/src/scripts/migrate.ts` to also execute `db/migrate-dynamic.sql` after `db/migrate.sql`.

```typescript
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const baseSql = readFileSync(resolve(__dirname, '../../../db/migrate.sql'), 'utf-8');
  const dynamicSql = readFileSync(resolve(__dirname, '../../../db/migrate-dynamic.sql'), 'utf-8');

  try {
    await pool.query(baseSql);
    await pool.query(dynamicSql);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
```

**Step 3: Verify**

Run: `cd /tmp/bahamas-town-hall/server && npx tsc --noEmit`
Expected: Clean compilation

**Step 4: Commit**

```bash
git add db/migrate-dynamic.sql server/src/scripts/migrate.ts
git commit -m "feat: add questions and responses tables for dynamic survey"
```

---

### Task 2: Seed Questions from Current Hardcoded Data

**Files:**
- Create: `db/seed-questions.sql`

**Step 1: Create the seed file**

Create `db/seed-questions.sql` that inserts all current hardcoded questions into the `questions` table:

```sql
-- Seed dynamic questions from the original hardcoded survey
-- Run after migrate-dynamic.sql

INSERT INTO questions (type, label, description, required, sort_order, options, active) VALUES
-- Scale question
('scale', 'How comfortable are you with technology?', NULL, true, 1,
 '{"min": 1, "max": 5, "min_label": "Not at all", "max_label": "Very comfortable"}', true),

-- Dropdown: barriers
('dropdown', 'What is your primary barrier to using technology?', NULL, false, 2,
 '["Cost of internet / devices", "Lack of training or skills", "Limited internet access in my area", "Don''t see the need", "Privacy / security concerns", "Lack of local tech support", "Other"]', true),

-- Checkbox: career interest (single option acts as yes/no)
('checkbox', 'Are you interested in a career in technology?', NULL, false, 3,
 '["Yes, I am interested in a tech career"]', true),

-- Dropdown: desired skills
('dropdown', 'What tech skill would you most like to learn?', NULL, false, 4,
 '["Basic computer literacy", "Coding / Software development", "Digital marketing", "Cybersecurity", "Data analysis", "Graphic design", "AI / Machine learning", "Project management", "Other"]', true),

-- Textarea: biggest concern
('textarea', 'What is your biggest concern about technology in The Bahamas?', 'Share your thoughts...', false, 5, NULL, true),

-- Textarea: best opportunity
('textarea', 'What do you see as the best opportunity technology can bring?', 'Share your vision...', false, 6, NULL, true),

-- Dropdown: preferred gov service
('dropdown', 'What government service would you most like to access online?', NULL, false, 7,
 '["Online tax filing", "Digital ID / passport renewal", "Business registration online", "Online court services", "E-health records", "Online education portal", "Digital land registry", "Online utility payments", "Government job portal", "Emergency alert system"]', true),

-- Textarea: gov tech suggestion
('textarea', 'Any suggestions for how government can better use technology?', 'Your suggestions...', false, 8, NULL, true),

-- Checkbox: technology priorities (was ranked, now multi-select)
('checkbox', 'Select your top technology priorities for The Bahamas', 'Select all that apply', false, 9,
 '["Affordable internet access", "Digital government services", "Tech education in schools", "Cybersecurity and data privacy", "Support for local tech startups", "E-commerce development", "Smart city infrastructure", "Telemedicine and e-health", "Digital financial inclusion", "Environmental tech solutions"]', true),

-- Checkbox: interest areas
('checkbox', 'Which of these initiatives would you be interested in?', 'Select all that apply', false, 10,
 '["Free coding workshops", "Tech career mentorship", "Small business tech grants", "Community Wi-Fi hotspots", "Youth tech programs", "Senior digital literacy classes", "Women in tech initiatives", "Hackathons and competitions", "Tech internship programs", "Open data initiatives"]', true)

ON CONFLICT DO NOTHING;
```

**Step 2: Commit**

```bash
git add db/seed-questions.sql
git commit -m "feat: seed questions from hardcoded survey definitions"
```

---

### Task 3: Data Migration Script

**Files:**
- Create: `db/migrate-data.sql`

**Step 1: Create the data migration**

Create `db/migrate-data.sql` that moves existing `survey_responses`, `topic_votes`, and `interest_areas` data into the new `responses` table. This script maps old fixed columns to question IDs (assumes seed-questions.sql has been run and IDs are 1-10).

```sql
-- Migrate existing survey data to dynamic responses table
-- Prerequisites: migrate-dynamic.sql and seed-questions.sql must have been run
-- Question IDs reference seed order: 1=comfort, 2=barrier, 3=career, 4=skill,
-- 5=concern, 6=opportunity, 7=gov_service, 8=suggestion, 9=priorities, 10=interests

-- Tech comfort level (question 1)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 1, tech_comfort_level::text, created_at
FROM survey_responses
WHERE tech_comfort_level IS NOT NULL
ON CONFLICT DO NOTHING;

-- Primary barrier (question 2)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 2, primary_barrier, created_at
FROM survey_responses
WHERE primary_barrier IS NOT NULL
ON CONFLICT DO NOTHING;

-- Career interest (question 3)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 3,
  CASE WHEN interested_in_careers THEN '["Yes, I am interested in a tech career"]' ELSE '[]' END,
  created_at
FROM survey_responses
ON CONFLICT DO NOTHING;

-- Desired skill (question 4)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 4, desired_skill, created_at
FROM survey_responses
WHERE desired_skill IS NOT NULL
ON CONFLICT DO NOTHING;

-- Biggest concern (question 5)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 5, biggest_concern, created_at
FROM survey_responses
WHERE biggest_concern IS NOT NULL
ON CONFLICT DO NOTHING;

-- Best opportunity (question 6)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 6, best_opportunity, created_at
FROM survey_responses
WHERE best_opportunity IS NOT NULL
ON CONFLICT DO NOTHING;

-- Preferred gov service (question 7)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 7, preferred_gov_service, created_at
FROM survey_responses
WHERE preferred_gov_service IS NOT NULL
ON CONFLICT DO NOTHING;

-- Gov tech suggestion (question 8)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT citizen_id, 8, gov_tech_suggestion, created_at
FROM survey_responses
WHERE gov_tech_suggestion IS NOT NULL
ON CONFLICT DO NOTHING;

-- Topic votes -> priorities checkbox (question 9)
-- Aggregate per citizen into JSON array, preserving rank order
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT
  tv.citizen_id,
  9,
  json_agg(tv.topic ORDER BY tv.rank)::text,
  MIN(c.created_at)
FROM topic_votes tv
JOIN citizens c ON c.id = tv.citizen_id
GROUP BY tv.citizen_id
ON CONFLICT DO NOTHING;

-- Interest areas -> checkbox (question 10)
INSERT INTO responses (citizen_id, question_id, value, created_at)
SELECT
  ia.citizen_id,
  10,
  json_agg(ia.area)::text,
  MIN(c.created_at)
FROM interest_areas ia
JOIN citizens c ON c.id = ia.citizen_id
GROUP BY ia.citizen_id
ON CONFLICT DO NOTHING;
```

**Step 2: Commit**

```bash
git add db/migrate-data.sql
git commit -m "feat: data migration from fixed schema to dynamic responses"
```

---

### Task 4: Server -- Questions API (Public + Admin CRUD)

**Files:**
- Create: `server/src/routes/questions.ts`
- Create: `server/src/routes/admin-questions.ts`
- Modify: `server/src/index.ts`

**Step 1: Create public questions endpoint**

Create `server/src/routes/questions.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../services/database';

const router = Router();

router.get('/api/questions', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, type, label, description, required, options FROM questions WHERE active = true ORDER BY sort_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Questions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

export default router;
```

**Step 2: Create admin questions CRUD**

Create `server/src/routes/admin-questions.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

const VALID_TYPES = ['text', 'textarea', 'dropdown', 'checkbox', 'scale'];

// List all questions (including inactive)
router.get('/api/admin/questions', adminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions ORDER BY sort_order ASC, id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin questions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Create question
router.post('/api/admin/questions', adminAuth, async (req: Request, res: Response) => {
  const { type, label, description, required, options } = req.body;

  const errors: string[] = [];
  if (!label?.trim()) errors.push('Label is required');
  if (!VALID_TYPES.includes(type)) errors.push(`Type must be one of: ${VALID_TYPES.join(', ')}`);
  if ((type === 'dropdown' || type === 'checkbox') && (!Array.isArray(options) || options.length === 0)) {
    errors.push('Options are required for dropdown and checkbox types');
  }
  if (type === 'scale' && (!options || typeof options.min !== 'number' || typeof options.max !== 'number')) {
    errors.push('Scale type requires options with min and max');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Get next sort_order
    const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM questions');
    const sort_order = maxOrder.rows[0].next;

    const result = await pool.query(
      `INSERT INTO questions (type, label, description, required, sort_order, options)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [type, label, description || null, required || false, sort_order, options ? JSON.stringify(options) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Question create error:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update question
router.put('/api/admin/questions/:id', adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, label, description, required, options, active } = req.body;

  const errors: string[] = [];
  if (label !== undefined && !label?.trim()) errors.push('Label cannot be empty');
  if (type !== undefined && !VALID_TYPES.includes(type)) errors.push(`Type must be one of: ${VALID_TYPES.join(', ')}`);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (type !== undefined) { fields.push(`type = $${idx++}`); values.push(type); }
    if (label !== undefined) { fields.push(`label = $${idx++}`); values.push(label); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (required !== undefined) { fields.push(`required = $${idx++}`); values.push(required); }
    if (options !== undefined) { fields.push(`options = $${idx++}`); values.push(JSON.stringify(options)); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Question update error:', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Reorder questions
router.patch('/api/admin/questions/reorder', adminAuth, async (req: Request, res: Response) => {
  const { order } = req.body; // array of { id, sort_order }

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of { id, sort_order }' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of order) {
      await client.query('UPDATE questions SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Question reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder questions' });
  } finally {
    client.release();
  }
});

// Soft-delete question
router.delete('/api/admin/questions/:id', adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE questions SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Question delete error:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
```

**Step 3: Register routes in index.ts**

Add imports and registration for both new routers in `server/src/index.ts`:

```typescript
import questionsRouter from './routes/questions';
import adminQuestionsRouter from './routes/admin-questions';
```

Add after existing route registrations:
```typescript
app.use(questionsRouter);
app.use(adminQuestionsRouter);
```

**Step 4: Verify**

Run: `cd /tmp/bahamas-town-hall/server && npx tsc --noEmit`
Expected: Clean compilation

**Step 5: Commit**

```bash
git add server/src/routes/questions.ts server/src/routes/admin-questions.ts server/src/index.ts
git commit -m "feat: questions API with public fetch and admin CRUD"
```

---

### Task 5: Server -- Update Citizen Submission for Dynamic Answers

**Files:**
- Modify: `server/src/routes/citizens.ts`
- Modify: `server/src/types/index.ts`

**Step 1: Update types**

Update `server/src/types/index.ts` -- replace `CitizenSubmission` with a version that uses dynamic answers:

```typescript
export interface CitizenSubmission {
  name: string;
  email: string;
  phone?: string;
  lives_in_bahamas: boolean;
  island: string;
  country?: string;
  age_group: string;
  sector: string;
  answers: { question_id: number; value: string }[];
}
```

Remove the old fixed survey fields (`tech_comfort_level`, `primary_barrier`, `interested_in_careers`, `desired_skill`, `biggest_concern`, `best_opportunity`, `gov_tech_suggestion`, `preferred_gov_service`, `topic_votes`, `interest_areas`). Keep the `Citizen`, `SurveyResponse`, `TopicVote`, `InterestArea` interfaces for now (they'll be removed when old tables are dropped).

**Step 2: Rewrite citizens.ts submission**

Replace the body of the POST handler in `server/src/routes/citizens.ts`:

```typescript
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
```

**Step 3: Verify**

Run: `cd /tmp/bahamas-town-hall/server && npx tsc --noEmit`
Expected: May have errors in admin routes that still reference old types -- that's expected and will be fixed in Tasks 6-8.

**Step 4: Commit**

```bash
git add server/src/routes/citizens.ts server/src/types/index.ts
git commit -m "feat: citizen submission with dynamic answers"
```

---

### Task 6: Server -- Update Admin Stats & Demographics for Dynamic Questions

**Files:**
- Modify: `server/src/routes/admin-stats.ts`
- Modify: `server/src/routes/admin-demographics.ts`

**Step 1: Rewrite admin-stats.ts**

The dashboard now shows: total citizens, today's citizens, and per-question aggregations. Replace `server/src/routes/admin-stats.ts`:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/stats', adminAuth, async (_req: Request, res: Response) => {
  try {
    const [total, today, byIsland, byAgeGroup, bySector] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM citizens'),
      pool.query(
        "SELECT COUNT(*) as count FROM citizens WHERE created_at::date = CURRENT_DATE"
      ),
      pool.query(
        'SELECT island, COUNT(*) as count FROM citizens GROUP BY island ORDER BY count DESC'
      ),
      pool.query(
        'SELECT age_group, COUNT(*) as count FROM citizens GROUP BY age_group ORDER BY count DESC'
      ),
      pool.query(
        'SELECT sector, COUNT(*) as count FROM citizens GROUP BY sector ORDER BY count DESC'
      ),
    ]);

    res.json({
      total_responses: parseInt(total.rows[0].count),
      today_responses: parseInt(today.rows[0].count),
      by_island: byIsland.rows,
      by_age_group: byAgeGroup.rows,
      by_sector: bySector.rows,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
```

**Step 2: Rewrite admin-demographics.ts**

Replace with dynamic question-based aggregation:

```typescript
import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

router.get('/api/admin/demographics', adminAuth, async (_req: Request, res: Response) => {
  try {
    // Citizen demographics (static fields)
    const [byIsland, byAgeGroup, bySector] = await Promise.all([
      pool.query('SELECT island, COUNT(*) as count FROM citizens GROUP BY island ORDER BY count DESC'),
      pool.query('SELECT age_group, COUNT(*) as count FROM citizens GROUP BY age_group ORDER BY count DESC'),
      pool.query('SELECT sector, COUNT(*) as count FROM citizens GROUP BY sector ORDER BY count DESC'),
    ]);

    // Dynamic question aggregations
    const questions = await pool.query(
      'SELECT id, type, label, options FROM questions ORDER BY sort_order ASC'
    );

    const questionStats = [];
    for (const q of questions.rows) {
      let stats: any = { id: q.id, type: q.type, label: q.label };

      if (q.type === 'scale') {
        const result = await pool.query(
          `SELECT value, COUNT(*) as count FROM responses WHERE question_id = $1 GROUP BY value ORDER BY value`,
          [q.id]
        );
        const avg = await pool.query(
          `SELECT ROUND(AVG(value::numeric), 2) as avg FROM responses WHERE question_id = $1`,
          [q.id]
        );
        stats.distribution = result.rows;
        stats.average = avg.rows[0]?.avg ? parseFloat(avg.rows[0].avg) : 0;
      } else if (q.type === 'dropdown') {
        const result = await pool.query(
          `SELECT value, COUNT(*) as count FROM responses WHERE question_id = $1 GROUP BY value ORDER BY count DESC`,
          [q.id]
        );
        stats.distribution = result.rows;
      } else if (q.type === 'checkbox') {
        // Checkbox values are stored as JSON arrays -- unnest and count
        const result = await pool.query(
          `SELECT item, COUNT(*) as count
           FROM responses, jsonb_array_elements_text(value::jsonb) AS item
           WHERE question_id = $1
           GROUP BY item ORDER BY count DESC`,
          [q.id]
        );
        stats.distribution = result.rows;
      } else if (q.type === 'text' || q.type === 'textarea') {
        const count = await pool.query(
          'SELECT COUNT(*) as count FROM responses WHERE question_id = $1',
          [q.id]
        );
        const recent = await pool.query(
          `SELECT r.value, c.island, c.age_group
           FROM responses r JOIN citizens c ON c.id = r.citizen_id
           WHERE r.question_id = $1 ORDER BY r.created_at DESC LIMIT 10`,
          [q.id]
        );
        stats.total_responses = parseInt(count.rows[0].count);
        stats.recent = recent.rows;
      }

      questionStats.push(stats);
    }

    res.json({
      by_island: byIsland.rows,
      by_age_group: byAgeGroup.rows,
      by_sector: bySector.rows,
      questions: questionStats,
    });
  } catch (err) {
    console.error('Demographics error:', err);
    res.status(500).json({ error: 'Failed to fetch demographics' });
  }
});

export default router;
```

**Step 3: Verify**

Run: `cd /tmp/bahamas-town-hall/server && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add server/src/routes/admin-stats.ts server/src/routes/admin-demographics.ts
git commit -m "feat: update stats and demographics for dynamic questions"
```

---

### Task 7: Server -- Update Responses, Priorities, Insights, Export

**Files:**
- Modify: `server/src/routes/admin-responses.ts`
- Modify: `server/src/routes/admin-insights.ts`
- Modify: `server/src/routes/admin-export.ts`
- Delete: `server/src/routes/admin-priorities.ts` (merged into demographics)
- Modify: `server/src/index.ts` (remove priorities route)
- Modify: `server/src/types/index.ts` (clean up old interfaces)

**Step 1: Rewrite admin-responses.ts**

Update the response browser to join with dynamic responses instead of fixed `survey_responses`:

```typescript
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
      SELECT c.*
      FROM citizens c
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

    const [citizen, answers] = await Promise.all([
      pool.query('SELECT * FROM citizens WHERE id = $1', [id]),
      pool.query(
        `SELECT r.value, q.id as question_id, q.type, q.label, q.options
         FROM responses r
         JOIN questions q ON q.id = r.question_id
         WHERE r.citizen_id = $1
         ORDER BY q.sort_order ASC`,
        [id]
      ),
    ]);

    if (citizen.rows.length === 0) {
      return res.status(404).json({ error: 'Citizen not found' });
    }

    res.json({
      citizen: citizen.rows[0],
      answers: answers.rows,
    });
  } catch (err) {
    console.error('Response detail error:', err);
    res.status(500).json({ error: 'Failed to fetch response detail' });
  }
});

export default router;
```

**Step 2: Rewrite admin-insights.ts**

Update to pull dynamic question/answer pairs:

```typescript
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
```

**Step 3: Rewrite admin-export.ts with streaming**

```typescript
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
```

**Step 4: Remove priorities route**

Delete `server/src/routes/admin-priorities.ts`.

In `server/src/index.ts`, remove the import and registration:
```
- import adminPrioritiesRouter from './routes/admin-priorities';
- app.use(adminPrioritiesRouter);
```

**Step 5: Clean up types**

Replace `server/src/types/index.ts` entirely:

```typescript
export interface Citizen {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  lives_in_bahamas: boolean;
  island: string;
  country: string | null;
  age_group: string;
  sector: string;
  created_at: string;
}

export interface Question {
  id: number;
  type: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'scale';
  label: string;
  description: string | null;
  required: boolean;
  sort_order: number;
  options: any;
  active: boolean;
  created_at: string;
}

export interface SurveyAnswer {
  question_id: number;
  value: string;
}

export interface CitizenSubmission {
  name: string;
  email: string;
  phone?: string;
  lives_in_bahamas: boolean;
  island: string;
  country?: string;
  age_group: string;
  sector: string;
  answers: SurveyAnswer[];
}
```

**Step 6: Verify**

Run: `cd /tmp/bahamas-town-hall/server && npx tsc --noEmit`
Expected: Clean compilation

**Step 7: Commit**

```bash
git add -A server/src/
git commit -m "feat: update all admin endpoints for dynamic questions, remove priorities route"
```

---

### Task 8: Client -- Shared Types and API Updates

**Files:**
- Create: `client/src/lib/types.ts`
- Modify: `client/src/lib/api.ts`
- Delete: `client/src/lib/constants.ts`
- Delete: `client/src/hooks/useSurvey.ts`

**Step 1: Create shared client types**

Create `client/src/lib/types.ts`:

```typescript
export interface Question {
  id: number;
  type: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'scale';
  label: string;
  description: string | null;
  required: boolean;
  options: string[] | { min: number; max: number; min_label: string; max_label: string } | null;
}

export interface SurveyData {
  name: string;
  email: string;
  phone: string;
  lives_in_bahamas: boolean;
  island: string;
  country: string;
  age_group: string;
  sector: string;
  answers: Record<number, string>; // question_id -> value (string or JSON array string)
}
```

**Step 2: Update api.ts**

Replace `client/src/lib/api.ts`:

```typescript
import type { Question } from './types';

const BASE_URL = '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.errors?.[0] || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('text/csv')) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
}

export const api = {
  // Public
  getQuestions: () => request<Question[]>('/api/questions'),
  submitSurvey: (data: any) =>
    request<{ id: number }>('/api/citizens', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin auth
  login: (password: string) =>
    request<{ success: boolean }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logout: () =>
    request<{ success: boolean }>('/api/admin/logout', { method: 'POST' }),
  checkAuth: () =>
    request<{ authenticated: boolean }>('/api/admin/check'),

  // Admin data
  getStats: () => request<any>('/api/admin/stats'),
  getResponses: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/admin/responses?${qs}`);
  },
  getResponse: (id: number) => request<any>(`/api/admin/responses/${id}`),
  getDemographics: () => request<any>('/api/admin/demographics'),
  generateInsights: () =>
    request<{ insights: string }>('/api/admin/insights', { method: 'POST' }),

  // Admin questions
  getAdminQuestions: () => request<any[]>('/api/admin/questions'),
  createQuestion: (data: any) =>
    request<any>('/api/admin/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateQuestion: (id: number, data: any) =>
    request<any>(`/api/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  reorderQuestions: (order: { id: number; sort_order: number }[]) =>
    request<any>('/api/admin/questions/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ order }),
    }),
  deleteQuestion: (id: number) =>
    request<any>(`/api/admin/questions/${id}`, { method: 'DELETE' }),

  // Export
  exportCsv: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `/api/admin/export/csv?${qs}`;
  },
  exportJson: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `/api/admin/export/json?${qs}`;
  },
};
```

**Step 3: Delete old files**

Delete `client/src/lib/constants.ts` and `client/src/hooks/useSurvey.ts`.

**Step 4: Commit**

```bash
git add -A client/src/lib/ client/src/hooks/
git commit -m "feat: client types, API updates, remove hardcoded constants"
```

---

### Task 9: Client -- Dynamic Survey Flow

**Files:**
- Rewrite: `client/src/pages/Survey.tsx`
- Rewrite: `client/src/pages/Signup.tsx`
- Delete: `client/src/pages/SelfAssessment.tsx`
- Delete: `client/src/pages/Priorities.tsx`
- Delete: `client/src/pages/InterestAreas.tsx`
- Rewrite: `client/src/pages/Confirmation.tsx`
- Create: `client/src/components/QuestionField.tsx`
- Modify: `client/src/components/ProgressBar.tsx`
- Modify: `client/src/components/SurveyLayout.tsx`

The survey becomes 3 steps: (1) Registration, (2) Questions (dynamically rendered), (3) Review & Submit.

**Step 1: Create QuestionField component**

Create `client/src/components/QuestionField.tsx` -- renders the appropriate input for each question type:

```tsx
import type { Question } from '../lib/types';

interface Props {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export default function QuestionField({ question, value, onChange }: Props) {
  switch (question.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-1">{question.description}</p>
          )}
          <input
            type="text"
            required={question.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-1">{question.description}</p>
          )}
          <textarea
            required={question.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder={question.description || ''}
          />
        </div>
      );

    case 'dropdown': {
      const options = question.options as string[];
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-1">{question.description}</p>
          )}
          <select
            required={question.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    case 'checkbox': {
      const options = question.options as string[];
      let selected: string[] = [];
      try { selected = value ? JSON.parse(value) : []; } catch { selected = []; }

      const toggle = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt];
        onChange(JSON.stringify(next));
      };

      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-2">{question.description}</p>
          )}
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selected.includes(opt)
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'scale': {
      const opts = question.options as { min: number; max: number; min_label: string; max_label: string };
      const levels = [];
      for (let i = opts.min; i <= opts.max; i++) levels.push(i);

      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {question.label}{question.required && ' *'}
          </label>
          {question.description && (
            <p className="text-xs text-gray-500 mb-2">{question.description}</p>
          )}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{opts.min_label}</span>
            <div className="flex gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange(String(level))}
                  className={`w-10 h-10 rounded-full font-semibold transition-colors ${
                    value === String(level)
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">{opts.max_label}</span>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
```

**Step 2: Rewrite Survey.tsx**

Three-step flow: Registration -> Questions -> Confirm.

```tsx
import { useState, useEffect } from 'react';
import type { Question, SurveyData } from '../lib/types';
import { api } from '../lib/api';
import Signup from './Signup';
import Confirmation from './Confirmation';
import QuestionField from '../components/QuestionField';
import SurveyLayout from '../components/SurveyLayout';

export default function Survey() {
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SurveyData>({
    name: '', email: '', phone: '',
    lives_in_bahamas: true, island: '', country: '',
    age_group: '', sector: '',
    answers: {},
  });

  useEffect(() => {
    api.getQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  const updateData = (updates: Partial<SurveyData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateAnswer = (questionId: number, value: string) => {
    setData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Loading survey...</p>
      </div>
    );
  }

  switch (step) {
    case 1:
      return <Signup data={data} updateData={updateData} onNext={() => setStep(2)} />;
    case 2:
      return (
        <SurveyLayout step={2} title="Survey Questions" totalSteps={3}>
          <form
            onSubmit={(e) => { e.preventDefault(); setStep(3); }}
            className="space-y-6"
          >
            {questions.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                value={data.answers[q.id] || ''}
                onChange={(val) => updateAnswer(q.id, val)}
              />
            ))}
            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
              >
                Next
              </button>
            </div>
          </form>
        </SurveyLayout>
      );
    case 3:
      return (
        <Confirmation
          data={data}
          questions={questions}
          onBack={() => setStep(2)}
        />
      );
    default:
      return null;
  }
}
```

**Step 3: Update Signup.tsx**

Keep as-is but update the imports. It no longer imports from `constants.ts`. Instead it receives islands/age_groups/sectors from the parent, OR we keep a minimal set of registration constants hardcoded since these are fixed demographic fields (not survey questions). Create a small `client/src/lib/registration-options.ts`:

```typescript
export const ISLANDS = [
  'New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Andros',
  'Eleuthera', 'Exuma', 'Long Island', 'Cat Island', 'San Salvador', 'Bimini',
  'Inagua', 'Acklins', 'Berry Islands', 'Crooked Island', 'Mayaguana',
  'Ragged Island', 'Rum Cay',
];

export const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

export const SECTORS = [
  'Tourism & Hospitality', 'Financial Services', 'Government / Public Sector',
  'Education', 'Healthcare', 'Technology / IT', 'Construction',
  'Agriculture & Fisheries', 'Retail & Commerce', 'Self-Employed / Entrepreneur',
  'Student', 'Retired', 'Other',
];
```

Update `Signup.tsx` imports from `../lib/constants` to `../lib/registration-options` and update the `SurveyData` import from `../lib/types` instead of `../hooks/useSurvey`. Also update the `SurveyLayout` call to include `totalSteps={3}`.

**Step 4: Rewrite Confirmation.tsx**

Update to display dynamic question/answer review:

```tsx
import { useState } from 'react';
import type { SurveyData, Question } from '../lib/types';
import SurveyLayout from '../components/SurveyLayout';
import { api } from '../lib/api';

interface Props {
  data: SurveyData;
  questions: Question[];
  onBack: () => void;
}

export default function Confirmation({ data, questions, onBack }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const answers = Object.entries(data.answers)
        .filter(([, value]) => value !== '' && value !== '[]')
        .map(([qid, value]) => ({ question_id: parseInt(qid), value }));

      await api.submitSurvey({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        lives_in_bahamas: data.lives_in_bahamas,
        island: data.island,
        country: data.country || undefined,
        age_group: data.age_group,
        sector: data.sector,
        answers,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAnswer = (q: Question, value: string): string => {
    if (!value) return '-';
    if (q.type === 'checkbox') {
      try { return JSON.parse(value).join(', '); } catch { return value; }
    }
    if (q.type === 'scale') {
      const opts = q.options as { max: number };
      return `${value}/${opts.max}`;
    }
    return value;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your feedback has been submitted successfully. Your voice matters in shaping
            the technology future of The Bahamas.
          </p>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Town Hall Details</h3>
            <p className="text-sm text-gray-600">
              Join us for the Bahamas Technology Town Hall to discuss these topics
              further with government officials and technology leaders.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SurveyLayout step={3} title="Review & Submit" totalSteps={3}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Your Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
            {data.phone && <p><strong>Phone:</strong> {data.phone}</p>}
            <p><strong>Resides in Bahamas:</strong> {data.lives_in_bahamas ? 'Yes' : 'No'}</p>
            {!data.lives_in_bahamas && data.country && (
              <p><strong>Country:</strong> {data.country}</p>
            )}
            <p><strong>{data.lives_in_bahamas ? 'Island' : 'Home Island'}:</strong> {data.island}</p>
            <p><strong>Age Group:</strong> {data.age_group}</p>
            <p><strong>Sector:</strong> {data.sector}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">Your Responses</h3>
          <div className="text-sm text-gray-600 space-y-2">
            {questions.map((q) => {
              const val = data.answers[q.id];
              if (!val || val === '[]') return null;
              return (
                <div key={q.id}>
                  <strong>{q.label}:</strong>{' '}
                  {formatAnswer(q, val)}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:bg-gray-300"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </div>
    </SurveyLayout>
  );
}
```

**Step 5: Update ProgressBar and SurveyLayout**

Update `ProgressBar.tsx` to accept dynamic step count:

```tsx
interface Props {
  currentStep: number;
  totalSteps?: number;
  labels?: string[];
}

export default function ProgressBar({ currentStep, totalSteps = 3, labels }: Props) {
  const steps = labels || ['Your Info', 'Questions', 'Confirm'];
  // ... rest stays the same but uses totalSteps for width calculation
```

Update `SurveyLayout.tsx` to pass `totalSteps`:

```tsx
interface Props {
  step: number;
  title: string;
  totalSteps?: number;
  children: React.ReactNode;
}

export default function SurveyLayout({ step, title, totalSteps, children }: Props) {
  // ... pass totalSteps to ProgressBar
```

**Step 6: Delete old pages**

Delete: `client/src/pages/SelfAssessment.tsx`, `client/src/pages/Priorities.tsx`, `client/src/pages/InterestAreas.tsx`

**Step 7: Verify**

Run: `cd /tmp/bahamas-town-hall/client && npx tsc --noEmit`

**Step 8: Commit**

```bash
git add -A client/src/
git commit -m "feat: dynamic survey flow with question renderer"
```

---

### Task 10: Client -- Admin Question Manager Page

**Files:**
- Create: `client/src/pages/admin/Questions.tsx`
- Modify: `client/src/components/AdminLayout.tsx` (add nav item)
- Modify: `client/src/App.tsx` (add route)

**Step 1: Create Questions.tsx**

Create the admin question management page with list, add/edit modal, reorder, and toggle active:

```tsx
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import QuestionField from '../../components/QuestionField';

const TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'scale', label: 'Scale' },
];

interface QuestionData {
  id?: number;
  type: string;
  label: string;
  description: string;
  required: boolean;
  options: any;
  active: boolean;
}

const emptyQuestion: QuestionData = {
  type: 'text', label: '', description: '', required: false, options: null, active: true,
};

export default function Questions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuestionData | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getAdminQuestions().then(setQuestions).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...emptyQuestion });

  const openEdit = (q: any) => setEditing({
    id: q.id, type: q.type, label: q.label,
    description: q.description || '', required: q.required,
    options: q.options, active: q.active,
  });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.updateQuestion(editing.id, editing);
      } else {
        await api.createQuestion(editing);
      }
      setEditing(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Deactivate this question? Existing responses will be preserved.')) return;
    await api.deleteQuestion(id);
    load();
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...questions];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const order = reordered.map((q, i) => ({ id: q.id, sort_order: i }));
    await api.reorderQuestions(order);
    load();
  };

  const moveDown = async (index: number) => {
    if (index === questions.length - 1) return;
    const reordered = [...questions];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    const order = reordered.map((q, i) => ({ id: q.id, sort_order: i }));
    await api.reorderQuestions(order);
    load();
  };

  const updateOptions = (value: string) => {
    if (!editing) return;
    const opts = value.split('\n').filter((s) => s.trim());
    setEditing({ ...editing, options: opts });
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-700',
      textarea: 'bg-purple-100 text-purple-700',
      dropdown: 'bg-green-100 text-green-700',
      checkbox: 'bg-amber-100 text-amber-700',
      scale: 'bg-cyan-100 text-cyan-700',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[type] || 'bg-gray-100'}`}>
        {TYPES.find((t) => t.value === type)?.label || type}
      </span>
    );
  };

  if (loading) return <div className="text-gray-500">Loading questions...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
        <button
          onClick={openNew}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
        >
          Add Question
        </button>
      </div>

      {/* Question list */}
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 ${
              !q.active ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-col gap-1">
              <button onClick={() => moveUp(i)} disabled={i === 0}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30">&uarr;</button>
              <button onClick={() => moveDown(i)} disabled={i === questions.length - 1}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30">&darr;</button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {typeBadge(q.type)}
                {q.required && <span className="text-xs text-red-500 font-medium">Required</span>}
                {!q.active && <span className="text-xs text-gray-500 font-medium">Inactive</span>}
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{q.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(q)}
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">Edit</button>
              {q.active && (
                <button onClick={() => remove(q.id)}
                  className="text-sm text-red-500 hover:text-red-600 font-medium">Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No questions yet. Click "Add Question" to get started.
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing.id ? 'Edit Question' : 'New Question'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select
                  value={editing.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    let options = editing.options;
                    if (type === 'dropdown' || type === 'checkbox') options = options || [];
                    if (type === 'scale') options = { min: 1, max: 5, min_label: 'Low', max_label: 'High' };
                    if (type === 'text' || type === 'textarea') options = null;
                    setEditing({ ...editing, type, options });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  type="text"
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter the question text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Helper text shown below the question"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.required}
                  onChange={(e) => setEditing({ ...editing, required: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600"
                />
                <span className="text-sm font-medium text-gray-700">Required</span>
              </label>

              {(editing.type === 'dropdown' || editing.type === 'checkbox') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options (one per line)
                  </label>
                  <textarea
                    value={Array.isArray(editing.options) ? editing.options.join('\n') : ''}
                    onChange={(e) => updateOptions(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              {editing.type === 'scale' && editing.options && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                    <input type="number" value={editing.options.min}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, min: parseInt(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
                    <input type="number" value={editing.options.max}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, max: parseInt(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Label</label>
                    <input type="text" value={editing.options.min_label}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, min_label: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Label</label>
                    <input type="text" value={editing.options.max_label}
                      onChange={(e) => setEditing({ ...editing, options: { ...editing.options, max_label: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              )}

              {/* Live preview */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-3">Preview</p>
                <QuestionField
                  question={{
                    id: 0,
                    type: editing.type as any,
                    label: editing.label || 'Question preview',
                    description: editing.description || null,
                    required: editing.required,
                    options: editing.options,
                  }}
                  value=""
                  onChange={() => {}}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !editing.label.trim()}
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-700 disabled:bg-gray-300">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add to AdminLayout nav and App routes**

In `client/src/components/AdminLayout.tsx`, add to `navItems`:
```typescript
{ path: '/admin/questions', label: 'Questions', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
```

In `client/src/App.tsx`, add import and route:
```tsx
import Questions from './pages/admin/Questions';
// Inside admin routes:
<Route path="questions" element={<Questions />} />
```

**Step 3: Verify**

Run: `cd /tmp/bahamas-town-hall/client && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add -A client/src/
git commit -m "feat: admin question manager with CRUD, reorder, and preview"
```

---

### Task 11: Client -- Dynamic Dashboard & Demographics

**Files:**
- Rewrite: `client/src/pages/admin/Dashboard.tsx`
- Rewrite: `client/src/pages/admin/Demographics.tsx`
- Rewrite: `client/src/pages/admin/ResponseBrowser.tsx` (update for dynamic)
- Rewrite: `client/src/pages/admin/ResponseDetail.tsx` (update for dynamic)
- Delete: `client/src/pages/admin/PrioritiesView.tsx`
- Modify: `client/src/components/AdminLayout.tsx` (remove Priorities nav)
- Modify: `client/src/App.tsx` (remove Priorities route)

**Step 1: Rewrite Dashboard.tsx**

Keep the overview stats (total, today) and citizen breakdowns. Remove fixed survey stats:

```tsx
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Stats {
  total_responses: number;
  today_responses: number;
  by_island: { island: string; count: string }[];
  by_age_group: { age_group: string; count: string }[];
  by_sector: { sector: string; count: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (!stats) return <div className="text-red-500">Failed to load stats</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Responses" value={stats.total_responses} />
        <StatCard label="Today" value={stats.today_responses} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BreakdownCard title="By Island" data={stats.by_island.map(r => ({ label: r.island, count: parseInt(r.count) }))} />
        <BreakdownCard title="By Age Group" data={stats.by_age_group.map(r => ({ label: r.age_group, count: parseInt(r.count) }))} />
        <BreakdownCard title="By Sector" data={stats.by_sector.map(r => ({ label: r.sector, count: parseInt(r.count) }))} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 truncate">{item.label}</span>
              <span className="text-gray-900 font-medium">{item.count}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-cyan-500 h-1.5 rounded-full"
                style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Rewrite Demographics.tsx with dynamic question charts**

Uses Recharts to auto-generate appropriate chart per question type based on the `questions` array from the demographics API:

```tsx
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#00778B', '#FFC72C', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#0e7490', '#155e75'];

export default function Demographics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDemographics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading demographics...</div>;
  if (!data) return <div className="text-red-500">Failed to load demographics</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Demographics & Survey Results</h1>

      {/* Citizen demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartCard title="By Island">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.by_island.map((r: any) => ({ name: r.island, value: parseInt(r.count) }))}
                cx="50%" cy="50%" outerRadius={100}
                dataKey="value" label={({ name, value }) => `${name}: ${value}`}
              >
                {data.by_island.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Age Group">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.by_age_group.map((r: any) => ({ name: r.age_group, count: parseInt(r.count) }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00778B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Dynamic question charts */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Survey Results by Question</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.questions.map((q: any) => (
          <QuestionChart key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}

function QuestionChart({ question }: { question: any }) {
  const { type, label, distribution, average, total_responses, recent } = question;

  if (type === 'scale' && distribution) {
    return (
      <ChartCard title={label}>
        <p className="text-sm text-gray-500 mb-3">Average: <strong>{average}</strong></p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={distribution.map((d: any) => ({ rating: d.value, count: parseInt(d.count) }))}>
            <XAxis dataKey="rating" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#00778B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if ((type === 'dropdown' || type === 'checkbox') && distribution) {
    return (
      <ChartCard title={label}>
        <ResponsiveContainer width="100%" height={Math.max(200, distribution.length * 35)}>
          <BarChart
            data={distribution.map((d: any) => ({
              name: d.value || d.item,
              count: parseInt(d.count),
            }))}
            layout="vertical"
          >
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#FFC72C" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  if ((type === 'text' || type === 'textarea') && recent) {
    return (
      <ChartCard title={label}>
        <p className="text-sm text-gray-500 mb-3">{total_responses} total responses</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recent.map((r: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-700">{r.value}</p>
              <p className="text-xs text-gray-400 mt-1">{r.island} &middot; {r.age_group}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    );
  }

  return null;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}
```

**Step 3: Update ResponseBrowser.tsx**

Remove imports of `ISLANDS`, `AGE_GROUPS`, `SECTORS` from `constants.ts`. Replace with imports from `registration-options.ts`. The table columns stay the same (citizen fields).

**Step 4: Rewrite ResponseDetail.tsx for dynamic answers**

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ResponseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) api.getResponse(parseInt(id)).then(setData).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!data) return <div className="text-red-500">Response not found</div>;

  const { citizen, answers } = data;

  const formatValue = (answer: any): string => {
    if (!answer.value) return '-';
    if (answer.type === 'checkbox') {
      try { return JSON.parse(answer.value).join(', '); } catch { return answer.value; }
    }
    if (answer.type === 'scale') {
      const opts = answer.options as { max: number };
      return `${answer.value}/${opts?.max || 5}`;
    }
    return answer.value;
  };

  return (
    <div>
      <button
        onClick={() => navigate('/admin/responses')}
        className="text-sm text-cyan-600 hover:text-cyan-700 mb-4 inline-flex items-center gap-1"
      >
        &larr; Back to Responses
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{citizen.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Personal Information">
          <Field label="Email" value={citizen.email} />
          <Field label="Phone" value={citizen.phone} />
          <Field label="Lives in Bahamas" value={citizen.lives_in_bahamas ? 'Yes' : 'No'} />
          {!citizen.lives_in_bahamas && <Field label="Country" value={citizen.country} />}
          <Field label={citizen.lives_in_bahamas ? 'Island' : 'Home Island'} value={citizen.island} />
          <Field label="Age Group" value={citizen.age_group} />
          <Field label="Sector" value={citizen.sector} />
          <Field label="Submitted" value={new Date(citizen.created_at).toLocaleString()} />
        </Section>

        <Section title="Survey Responses">
          {answers.length === 0 ? (
            <p className="text-sm text-gray-500">No survey responses recorded</p>
          ) : (
            answers.map((a: any) => (
              <Field key={a.question_id} label={a.label} value={formatValue(a)} />
            ))
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm text-gray-800">{value || '-'}</p>
    </div>
  );
}
```

**Step 5: Delete PrioritiesView.tsx, remove from nav and routes**

Delete `client/src/pages/admin/PrioritiesView.tsx`.

In `AdminLayout.tsx`: remove the Priorities nav item.
In `App.tsx`: remove the priorities route and import.

**Step 6: Verify**

Run: `cd /tmp/bahamas-town-hall/client && npx tsc --noEmit`

**Step 7: Commit**

```bash
git add -A client/src/
git commit -m "feat: dynamic dashboard, demographics charts, response detail"
```

---

### Task 12: Bahamas Branding

**Files:**
- Modify: `client/src/pages/Landing.tsx`
- Modify: `client/src/components/SurveyLayout.tsx`
- Modify: `client/src/components/AdminLayout.tsx`
- Modify: `client/src/components/QuestionField.tsx` (swap cyan -> aquamarine)
- Modify: All pages using `cyan-600` -> Bahamas aquamarine/gold

**Step 1: Define the brand colors in Tailwind**

In `client/src/index.css` (which should contain the Tailwind import), add custom theme colors via CSS variables:

```css
@import "tailwindcss";

@theme {
  --color-bahamas-aqua: #00778B;
  --color-bahamas-aqua-light: #e0f4f7;
  --color-bahamas-gold: #FFC72C;
  --color-bahamas-gold-light: #fff8e1;
  --color-bahamas-black: #1a1a2e;
}
```

**Step 2: Update Landing.tsx with Bahamas branding**

Replace the landing page with stronger national identity:
- Bahamas flag colors (aquamarine, gold, black triangle)
- Government/official feel
- Replace generic computer icon with a Bahamas-themed header

```tsx
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <div className="mb-6">
          {/* Bahamas flag-inspired emblem */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-bahamas-aqua" />
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-bahamas-black"
              style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
            <span className="relative text-white text-3xl font-bold z-10">BS</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-bahamas-black mb-2">
          Bahamas Technology Town Hall
        </h1>
        <p className="text-sm font-medium text-bahamas-aqua uppercase tracking-wide mb-4">
          Commonwealth of The Bahamas
        </p>
        <p className="text-lg text-gray-600 mb-2">
          Share your voice on the future of technology in The Bahamas
        </p>
        <p className="text-gray-500 mb-8">
          Your feedback will help shape national technology policy, infrastructure
          investment, and digital skills programs. This survey takes about 5 minutes.
        </p>
        <button
          onClick={() => navigate('/survey')}
          className="bg-bahamas-aqua text-white px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
        >
          Take the Survey
        </button>
        <p className="mt-6 text-sm text-gray-400">
          Your responses are collected for policy research purposes only.
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Update SurveyLayout.tsx**

Replace cyan with bahamas-aqua:

```tsx
import ProgressBar from './ProgressBar';

interface Props {
  step: number;
  title: string;
  totalSteps?: number;
  children: React.ReactNode;
}

export default function SurveyLayout({ step, title, totalSteps, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bahamas-aqua-light to-white flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-8 w-full flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-bahamas-aqua rounded-xl mb-3">
            <span className="text-white font-bold text-lg">BS</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Bahamas Technology Town Hall
          </h1>
        </div>
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Global color swap**

Across all files, replace:
- `bg-cyan-600` -> `bg-bahamas-aqua`
- `bg-cyan-50` -> `bg-bahamas-aqua-light`
- `text-cyan-600` -> `text-bahamas-aqua`
- `text-cyan-700` -> `text-bahamas-aqua`
- `text-cyan-800` -> `text-bahamas-aqua`
- `border-cyan-500` -> `border-bahamas-aqua`
- `border-cyan-300` -> `border-bahamas-aqua`
- `bg-cyan-100` -> `bg-bahamas-aqua-light`
- `focus:ring-cyan-500` -> `focus:ring-bahamas-aqua`
- `hover:bg-cyan-700` -> `hover:opacity-90`

In AdminLayout.tsx sidebar, update the active state color and add gold accent:
- `bg-cyan-600` -> `bg-bahamas-aqua`
- Add gold border-left to active nav items

In chart colors (Demographics.tsx), use `#00778B` (aquamarine) and `#FFC72C` (gold) as primary chart colors.

**Step 5: Update ProgressBar.tsx with brand colors**

Replace cyan colors with bahamas-aqua:

```tsx
const steps = labels || ['Your Info', 'Questions', 'Confirm'];
// ...
// isCurrent: 'bg-bahamas-aqua text-white'
// isActive: 'bg-bahamas-aqua-light text-bahamas-aqua'
// progress bar: 'bg-bahamas-aqua'
// active label: 'text-bahamas-aqua'
```

**Step 6: Update ErrorBoundary.tsx**

Replace `bg-cyan-600` with `bg-bahamas-aqua`.

**Step 7: Verify**

Run: `cd /tmp/bahamas-town-hall/client && npx tsc --noEmit`

**Step 8: Commit**

```bash
git add -A client/src/
git commit -m "feat: Bahamas national branding with aquamarine and gold theme"
```

---

### Task 13: Update Seed Data for Dynamic Schema

**Files:**
- Modify: `db/seed.sql`
- Modify: `server/src/scripts/seed.ts`

**Step 1: Update seed.sql**

Update `db/seed.sql` to insert into `questions` and `responses` tables instead of the old tables. Keep the same citizen data. Insert question seeds first, then map old survey data to dynamic responses.

The seed should:
1. TRUNCATE `responses`, `questions`, `citizens` (with CASCADE)
2. Insert citizens (same as current)
3. Insert questions (from seed-questions.sql)
4. Insert responses mapped from the old seed data values

**Step 2: Update seed.ts**

Update `server/src/scripts/seed.ts` to also run `db/seed-questions.sql` before `db/seed.sql`.

**Step 3: Commit**

```bash
git add db/seed.sql db/seed-questions.sql server/src/scripts/seed.ts
git commit -m "feat: update seed data for dynamic survey schema"
```

---

### Task 14: Clean Up Old Tables and Files

**Files:**
- Create: `db/drop-old-tables.sql`
- Delete: `client/src/lib/constants.ts` (if not already deleted)
- Delete: `client/src/hooks/useSurvey.ts` (if not already deleted)
- Delete: `client/src/pages/SelfAssessment.tsx` (if not already deleted)
- Delete: `client/src/pages/Priorities.tsx` (if not already deleted)
- Delete: `client/src/pages/InterestAreas.tsx` (if not already deleted)
- Delete: `client/src/pages/admin/PrioritiesView.tsx` (if not already deleted)
- Delete: `server/src/routes/admin-priorities.ts` (if not already deleted)

**Step 1: Create drop script**

```sql
-- Run AFTER data migration is confirmed successful
-- This drops the old fixed-schema tables
DROP TABLE IF EXISTS interest_areas;
DROP TABLE IF EXISTS topic_votes;
DROP TABLE IF EXISTS survey_responses;
```

**Step 2: Verify all old file references are removed**

Search for any remaining imports of deleted files. Fix any that remain.

**Step 3: Final type-check**

Run: `cd /tmp/bahamas-town-hall/server && npx tsc --noEmit`
Run: `cd /tmp/bahamas-town-hall/client && npx tsc --noEmit`
Both should compile cleanly.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up old tables and deprecated files"
```

---

### Task 15: Final Verification

**Step 1: Full build test**

```bash
cd /tmp/bahamas-town-hall && npm run build
```

Expected: Both client and server build successfully.

**Step 2: Review all routes registered**

Verify `server/src/index.ts` has:
- healthRouter
- questionsRouter (new - public)
- citizensRouter
- adminAuthRouter
- adminQuestionsRouter (new)
- adminStatsRouter
- adminResponsesRouter
- adminDemographicsRouter
- adminInsightsRouter
- adminExportRouter

NO: adminPrioritiesRouter (removed)

**Step 3: Review all client routes**

Verify `client/src/App.tsx` has:
- `/` -> Landing
- `/survey` -> Survey
- `/admin/login` -> Login
- `/admin` -> AdminLayout with:
  - index -> Dashboard
  - `questions` -> Questions (new)
  - `responses` -> ResponseBrowser
  - `responses/:id` -> ResponseDetail
  - `demographics` -> Demographics
  - `insights` -> AIInsights
  - `export` -> Export

NO: `priorities` (removed)

**Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```
