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
