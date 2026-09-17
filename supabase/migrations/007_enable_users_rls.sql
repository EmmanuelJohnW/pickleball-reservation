-- Re-enable RLS on public.users (contains password_hash) with no policies.
-- 004_fix_rls.sql disabled RLS entirely to work around a recursive policy
-- ("Admins full access to users" queried users to evaluate access to users).
-- Nothing in the app queries public.users directly: admin auth goes through
-- Supabase Auth (auth.users), and every server action that touches app
-- tables uses the service-role client, which bypasses RLS regardless.
-- Default-deny is therefore safe and closes the anon/authenticated read
-- exposure on password_hash.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
