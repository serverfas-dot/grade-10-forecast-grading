-- Fix infinite recursion: the SELECT policy on forecast_admins queries forecast_admins itself.
-- Replace the self-referencing EXISTS with a simple ownership check.
DROP POLICY IF EXISTS "admins_read_admins" ON forecast_admins;
CREATE POLICY "admins_read_admins" ON forecast_admins FOR SELECT
  TO authenticated USING (user_id = auth.uid());
