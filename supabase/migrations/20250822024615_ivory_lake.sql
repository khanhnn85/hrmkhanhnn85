/*
  # Fix RLS policy for anonymous candidate insertion

  1. Security Changes
    - Drop existing restrictive INSERT policy on candidates table
    - Create new policy allowing anonymous users to insert candidate records
    - Maintain existing SELECT and UPDATE policies for HR/Admin access

  2. Changes
    - Allow `anon` role to INSERT into candidates table
    - This enables the public application form to work without authentication
*/

-- Drop any existing INSERT policies that might be blocking anonymous access
DROP POLICY IF EXISTS "Anyone can create candidates" ON candidates;
DROP POLICY IF EXISTS "Users can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Anonymous can create candidates" ON candidates;

-- Create a new policy that explicitly allows anonymous users to insert candidates
CREATE POLICY "Allow anonymous candidate applications"
  ON candidates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the candidates table has RLS enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;