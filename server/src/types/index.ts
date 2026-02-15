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

export interface SurveyResponse {
  id: number;
  citizen_id: number;
  tech_comfort_level: number;
  primary_barrier: string | null;
  interested_in_careers: boolean;
  desired_skill: string | null;
  biggest_concern: string | null;
  best_opportunity: string | null;
  gov_tech_suggestion: string | null;
  preferred_gov_service: string | null;
  created_at: string;
}

export interface TopicVote {
  id: number;
  citizen_id: number;
  topic: string;
  rank: number;
}

export interface InterestArea {
  id: number;
  citizen_id: number;
  area: string;
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
  tech_comfort_level: number;
  primary_barrier?: string;
  interested_in_careers: boolean;
  desired_skill?: string;
  biggest_concern?: string;
  best_opportunity?: string;
  gov_tech_suggestion?: string;
  preferred_gov_service?: string;
  topic_votes: { topic: string; rank: number }[];
  interest_areas: string[];
}
