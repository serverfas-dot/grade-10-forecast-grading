/*
# Create Forecast Grades workspace

1. New Tables
- `forecast_settings`: editable application heading, subheading, and academic year.
- `forecast_subjects`: editable subject list used by teacher submissions and the admin results grid.
- `forecast_grade_options`: editable forecast grade choices.
- `forecast_gender_options`: editable gender choices.
- `forecast_students`: admin-managed Grade 10 student roster with index number, name, and gender.
- `forecast_submissions`: teacher forecast entries, one current forecast per student and subject for each academic year.
- `forecast_admins`: authorized administrator accounts linked to Supabase Auth users.

2. Security
- RLS is enabled on every table.
- Teachers using the public form can create submissions only; they cannot read, edit, or delete submissions.
- Only authenticated users listed in `forecast_admins` can manage roster, settings, options, and submissions.
- The first authenticated account may create the first administrator record, allowing one-time administrator bootstrap. Further accounts cannot self-authorize.

3. Notes
- Student and subject names are stored with each submission so historical entries remain readable if an admin later changes labels.
- Unique constraints prevent duplicate current forecasts for the same student, subject, and academic year.
*/

CREATE TABLE IF NOT EXISTS forecast_settings (
  id boolean PRIMARY KEY DEFAULT true,
  title text NOT NULL DEFAULT 'Forecast Grades',
  subtitle text NOT NULL DEFAULT 'Grade 10 student forecast grade collection',
  academic_year integer NOT NULL DEFAULT 2026 CHECK (academic_year BETWEEN 2000 AND 2100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forecast_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forecast_grade_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS forecast_gender_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS forecast_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_number text NOT NULL UNIQUE,
  name text NOT NULL,
  gender text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forecast_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forecast_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year integer NOT NULL DEFAULT 2026 CHECK (academic_year BETWEEN 2000 AND 2100),
  student_index text NOT NULL,
  student_name text NOT NULL,
  gender text NOT NULL,
  subject text NOT NULL,
  forecast_grade text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year, student_index, subject)
);

INSERT INTO forecast_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

INSERT INTO forecast_subjects (name, sort_order) VALUES
  ('Dhivehi', 1), ('Islam', 2), ('English', 3), ('Mathematics', 4), ('Physics', 5),
  ('Science', 6), ('Computer Science', 7), ('Business Studies', 8), ('Biology', 9),
  ('Marine Science', 10), ('Accounting', 11), ('Chemistry', 12), ('Economics', 13)
ON CONFLICT (name) DO NOTHING;

INSERT INTO forecast_grade_options (value, sort_order) VALUES
  ('A*', 1), ('A', 2), ('B', 3), ('C', 4), ('D', 5), ('E', 6), ('F', 7), ('G', 8), ('U', 9), ('X', 10)
ON CONFLICT (value) DO NOTHING;

INSERT INTO forecast_gender_options (value, sort_order) VALUES
  ('Male', 1), ('Female', 2), ('Other', 3)
ON CONFLICT (value) DO NOTHING;

ALTER TABLE forecast_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_grade_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_gender_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON forecast_settings;
CREATE POLICY "public_read_settings" ON forecast_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins_update_settings" ON forecast_settings;
CREATE POLICY "admins_update_settings" ON forecast_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_read_subjects" ON forecast_subjects;
CREATE POLICY "public_read_subjects" ON forecast_subjects FOR SELECT TO anon, authenticated USING (is_active = true OR EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_insert_subjects" ON forecast_subjects;
CREATE POLICY "admins_insert_subjects" ON forecast_subjects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_subjects" ON forecast_subjects;
CREATE POLICY "admins_update_subjects" ON forecast_subjects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_subjects" ON forecast_subjects;
CREATE POLICY "admins_delete_subjects" ON forecast_subjects FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_read_grades" ON forecast_grade_options;
CREATE POLICY "public_read_grades" ON forecast_grade_options FOR SELECT TO anon, authenticated USING (is_active = true OR EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_insert_grades" ON forecast_grade_options;
CREATE POLICY "admins_insert_grades" ON forecast_grade_options FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_grades" ON forecast_grade_options;
CREATE POLICY "admins_update_grades" ON forecast_grade_options FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_grades" ON forecast_grade_options;
CREATE POLICY "admins_delete_grades" ON forecast_grade_options FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_read_genders" ON forecast_gender_options;
CREATE POLICY "public_read_genders" ON forecast_gender_options FOR SELECT TO anon, authenticated USING (is_active = true OR EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_insert_genders" ON forecast_gender_options;
CREATE POLICY "admins_insert_genders" ON forecast_gender_options FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_genders" ON forecast_gender_options;
CREATE POLICY "admins_update_genders" ON forecast_gender_options FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_genders" ON forecast_gender_options;
CREATE POLICY "admins_delete_genders" ON forecast_gender_options FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_read_students" ON forecast_students;
CREATE POLICY "public_read_students" ON forecast_students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins_insert_students" ON forecast_students;
CREATE POLICY "admins_insert_students" ON forecast_students FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_students" ON forecast_students;
CREATE POLICY "admins_update_students" ON forecast_students FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_students" ON forecast_students;
CREATE POLICY "admins_delete_students" ON forecast_students FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "first_admin_insert" ON forecast_admins;
CREATE POLICY "first_admin_insert" ON forecast_admins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM forecast_admins));
DROP POLICY IF EXISTS "admins_read_admins" ON forecast_admins;
CREATE POLICY "admins_read_admins" ON forecast_admins FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_insert_submissions" ON forecast_submissions;
CREATE POLICY "public_insert_submissions" ON forecast_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins_read_submissions" ON forecast_submissions;
CREATE POLICY "admins_read_submissions" ON forecast_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_update_submissions" ON forecast_submissions;
CREATE POLICY "admins_update_submissions" ON forecast_submissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "admins_delete_submissions" ON forecast_submissions;
CREATE POLICY "admins_delete_submissions" ON forecast_submissions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS forecast_submissions_student_idx ON forecast_submissions (academic_year, student_name, student_index);
CREATE INDEX IF NOT EXISTS forecast_submissions_subject_idx ON forecast_submissions (academic_year, subject);
