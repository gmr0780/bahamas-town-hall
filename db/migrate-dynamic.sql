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
