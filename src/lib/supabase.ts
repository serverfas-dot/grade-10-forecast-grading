import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Subject = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type GradeOption = {
  id: string;
  value: string;
  sort_order: number;
  is_active: boolean;
};

export type GenderOption = {
  id: string;
  value: string;
  sort_order: number;
  is_active: boolean;
};

export type Student = {
  id: string;
  index_number: string;
  name: string;
  gender: string;
  created_at: string;
  updated_at: string;
};

export type Submission = {
  id: string;
  academic_year: number;
  student_index: string;
  student_name: string;
  gender: string;
  subject: string;
  forecast_grade: string;
  created_at: string;
  updated_at: string;
};

export type Settings = {
  id: boolean;
  title: string;
  subtitle: string;
  academic_year: number;
  updated_at: string;
};
