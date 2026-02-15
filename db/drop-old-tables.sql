-- Run AFTER data migration is confirmed successful
-- This drops the old fixed-schema tables
DROP TABLE IF EXISTS interest_areas;
DROP TABLE IF EXISTS topic_votes;
DROP TABLE IF EXISTS survey_responses;
