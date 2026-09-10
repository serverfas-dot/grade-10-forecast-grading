/*
# Lock down admin self-registration

1. Security Changes
- Drop the "first_admin_insert" policy on forecast_admins that allowed any authenticated user to self-register as admin.
- Replace with an admin-only insert policy so only existing admins can authorize new admins.
- This prevents unauthorized users from creating accounts and gaining admin access.

2. Notes
- The initial admin account (admin@forecast.mv) has already been created and registered in forecast_admins.
- No further self-registration is possible.
*/

DROP POLICY IF EXISTS "first_admin_insert" ON forecast_admins;
DROP POLICY IF EXISTS "admins_insert_admins" ON forecast_admins;

CREATE POLICY "admins_insert_admins" ON forecast_admins FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM forecast_admins WHERE user_id = auth.uid()));
