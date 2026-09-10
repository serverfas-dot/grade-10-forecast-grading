/*
# Add a reliable public forecast submission operation

1. Purpose
- Replace the browser-side upsert path that is still being rejected by the live row-security layer.
- Keep forecast submission available to teachers without requiring an account.

2. Database function
- `submit_forecast` accepts one forecast and atomically inserts or updates the matching student, subject, and academic-year record.
- The function validates the academic year, student roster entry, active subject, active grade, and active gender before writing.
- Student names and index numbers must match the administrator-managed roster.

3. Security
- The function runs with controlled owner privileges so the public form is not dependent on the table's direct upsert policy evaluation.
- The function uses a fixed `public` search path and does not accept a caller identity parameter.
- Execution is granted only to the public API roles used by the application.
- Direct table policies remain in place for administrator access and existing clients.

4. Important notes
- This is intentionally a public operation because the teacher form has no teacher sign-in.
- Validation limits the operation to configured roster and active option values.
*/

CREATE OR REPLACE FUNCTION public.submit_forecast(
  p_academic_year integer,
  p_student_index text,
  p_student_name text,
  p_gender text,
  p_subject text,
  p_forecast_grade text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_academic_year IS NULL OR p_academic_year < 2000 OR p_academic_year > 2100 THEN
    RAISE EXCEPTION 'Invalid forecast details';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.forecast_students
    WHERE index_number = p_student_index
      AND name = p_student_name
      AND gender = p_gender
  ) THEN
    RAISE EXCEPTION 'Invalid forecast details';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.forecast_subjects
    WHERE name = p_subject AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid forecast details';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.forecast_grade_options
    WHERE value = p_forecast_grade AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid forecast details';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.forecast_gender_options
    WHERE value = p_gender AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid forecast details';
  END IF;

  INSERT INTO public.forecast_submissions (
    academic_year,
    student_index,
    student_name,
    gender,
    subject,
    forecast_grade
  ) VALUES (
    p_academic_year,
    p_student_index,
    p_student_name,
    p_gender,
    p_subject,
    p_forecast_grade
  )
  ON CONFLICT (academic_year, student_index, subject)
  DO UPDATE SET
    student_name = EXCLUDED.student_name,
    gender = EXCLUDED.gender,
    forecast_grade = EXCLUDED.forecast_grade,
    updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_forecast(integer, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_forecast(integer, text, text, text, text, text) TO anon, authenticated;
