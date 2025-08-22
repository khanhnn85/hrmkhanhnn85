/*
  # Fix RLS policy for anonymous candidate applications

  1. Security Changes
    - Drop existing INSERT policy that may be conflicting
    - Create new policy allowing anonymous users to insert candidates
    - Ensure RLS is properly enabled
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow anonymous candidate applications" ON candidates;
DROP POLICY IF EXISTS "Anonymous can create candidates" ON candidates;

-- Create a new policy that allows anonymous users to insert candidates
CREATE POLICY "Allow anonymous candidate applications"
  ON candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;