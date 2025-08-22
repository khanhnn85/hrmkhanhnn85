/*
  # Fix RLS policy for anonymous candidate applications

  1. Security Changes
    - Drop existing INSERT policies that may be blocking anonymous users
    - Create new policy to allow anonymous users to insert candidate applications
    - Ensure RLS is enabled on candidates table

  This migration fixes the 401 error when anonymous users try to submit job applications.
*/

-- Drop any existing INSERT policies that might conflict
DROP POLICY IF EXISTS "Allow anonymous candidate applications" ON candidates;
DROP POLICY IF EXISTS "Anonymous can create candidates" ON candidates;
DROP POLICY IF EXISTS "Public can insert candidates" ON candidates;

-- Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert candidate applications
CREATE POLICY "Allow anonymous candidate applications"
  ON candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also ensure anonymous users can read open positions (if not already allowed)
DROP POLICY IF EXISTS "Anyone can read open positions" ON positions;
CREATE POLICY "Anyone can read open positions"
  ON positions
  FOR SELECT
  TO anon, authenticated
  USING (is_open = true);