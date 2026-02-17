-- Site settings (key-value store for app configuration)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES ('survey_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- Admin accounts
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Survey mode tracking
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS survey_mode VARCHAR(10) DEFAULT 'standard';

-- Page view tracking
CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
