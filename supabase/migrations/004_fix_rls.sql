-- =====================================================
-- Fix RLS infinite recursion on users table
-- =====================================================

-- Disable RLS on users table (admin access via service role key + middleware)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop the recursive admin policies that query users table
DROP POLICY IF EXISTS "Admins full access to users" ON users;
DROP POLICY IF EXISTS "Admins full access to courts" ON courts;
DROP POLICY IF EXISTS "Admins full access to customers" ON customers;
DROP POLICY IF EXISTS "Admins full access to reservations" ON reservations;
DROP POLICY IF EXISTS "Admins full access to payments" ON payments;
DROP POLICY IF EXISTS "Admins full access to court_blocks" ON court_blocks;
DROP POLICY IF EXISTS "Admins full access to settings" ON settings;
DROP POLICY IF EXISTS "Admins full access to notifications" ON notifications;

-- Admin operations use service role key which bypasses RLS entirely
-- No admin RLS policies needed — security is handled by:
-- 1. requireAdmin() middleware check
-- 2. Supabase Auth session validation
-- 3. Service role key for all admin server actions
