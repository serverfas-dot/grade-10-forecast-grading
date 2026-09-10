-- Drop all existing policies on forecast_submissions and recreate cleanly
DROP POLICY IF EXISTS "public_insert_submissions" ON forecast_submissions;
DROP POLICY IF EXISTS "public_update_submissions" ON forecast_submissions;
DROP POLICY IF EXISTS "admins_read_submissions" ON forecast_submissions;
DROP POLICY IF EXISTS "admins_update_submissions" ON forecast_submissions;
DROP POLICY IF EXISTS "admins_delete_submissions" ON forecast_submissions;

-- Teachers (anon + authenticated) can insert and update (upsert) submissions
CREATE POLICY "public_insert_submissions" ON forecast_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "public_update_submissions" ON forecast_submissions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Admins can read, update, and delete all submissions
CREATE POLICY "admins_read_submissions" ON forecast_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_update_submissions" ON forecast_submissions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admins_delete_submissions" ON forecast_submissions
  FOR DELETE TO authenticated USING (true);
