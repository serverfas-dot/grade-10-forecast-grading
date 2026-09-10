-- Allow teachers (anon/authenticated) to update submissions via upsert.
-- The INSERT policy already allows anyone; the UPDATE side of upsert was blocked because
-- only admins had UPDATE. Since there is no per-teacher ownership on submissions,
-- we allow public UPDATE to match the public INSERT policy.
DROP POLICY IF EXISTS "public_update_submissions" ON forecast_submissions;
CREATE POLICY "public_update_submissions" ON forecast_submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
