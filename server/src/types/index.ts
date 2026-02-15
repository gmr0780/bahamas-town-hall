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
