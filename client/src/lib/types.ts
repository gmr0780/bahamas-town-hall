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
  answers: Record<number, string>;
}
