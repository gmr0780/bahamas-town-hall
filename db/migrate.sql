CREATE TABLE IF NOT EXISTS citizens (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  lives_in_bahamas BOOLEAN NOT NULL DEFAULT TRUE,
  island VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  age_group VARCHAR(50) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table already exists (idempotent)
DO $$ BEGIN
  ALTER TABLE citizens ADD COLUMN IF NOT EXISTS lives_in_bahamas BOOLEAN NOT NULL DEFAULT TRUE;
  ALTER TABLE citizens ADD COLUMN IF NOT EXISTS country VARCHAR(100);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  citizen_id INTEGER NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  tech_comfort_level INTEGER NOT NULL CHECK (tech_comfort_level BETWEEN 1 AND 5),
  primary_barrier VARCHAR(255),
  interested_in_careers BOOLEAN DEFAULT FALSE,
  desired_skill VARCHAR(255),
  biggest_concern TEXT,
  best_opportunity TEXT,
  gov_tech_suggestion TEXT,
  preferred_gov_service VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topic_votes (
  id SERIAL PRIMARY KEY,
  citizen_id INTEGER NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  topic VARCHAR(255) NOT NULL,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3)
);

CREATE TABLE IF NOT EXISTS interest_areas (
  id SERIAL PRIMARY KEY,
  citizen_id INTEGER NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  area VARCHAR(255) NOT NULL
);
