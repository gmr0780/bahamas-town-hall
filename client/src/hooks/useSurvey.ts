import { useState } from 'react';

export interface SurveyData {
  // Step 1: Citizen info
  name: string;
  email: string;
  phone: string;
  island: string;
  age_group: string;
  sector: string;
  // Step 2: Self-assessment
  tech_comfort_level: number;
  primary_barrier: string;
  interested_in_careers: boolean;
  desired_skill: string;
  // Step 3: Open-ended
  biggest_concern: string;
  best_opportunity: string;
  gov_tech_suggestion: string;
  preferred_gov_service: string;
  // Step 4: Priorities
  topic_votes: { topic: string; rank: number }[];
  // Step 5: Interest areas
  interest_areas: string[];
}

const initialData: SurveyData = {
  name: '',
  email: '',
  phone: '',
  island: '',
  age_group: '',
  sector: '',
  tech_comfort_level: 3,
  primary_barrier: '',
  interested_in_careers: false,
  desired_skill: '',
  biggest_concern: '',
  best_opportunity: '',
  gov_tech_suggestion: '',
  preferred_gov_service: '',
  topic_votes: [],
  interest_areas: [],
};

export function useSurvey() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SurveyData>(initialData);

  const updateData = (updates: Partial<SurveyData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return { step, setStep, data, updateData, nextStep, prevStep };
}
