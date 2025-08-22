/*
  # Fix RLS policy for anonymous candidate applications

  1. Security Changes
    - Drop existing conflicting INSERT policies on candidates table
    - Create new policy to allow anonymous users to insert candidate records
    - Ensure RLS is properly enabled

  This migration fixes the 401 error when anonymous users try to submit job applications.
*/

-- Drop any existing INSERT policies that might be conflicting
DROP POLICY IF EXISTS "Allow anonymous candidate applications" ON candidates;
DROP POLICY IF EXISTS "Allow public insert for candidates" ON candidates;

-- Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert candidate records
CREATE POLICY "Allow anonymous candidate applications" 
ON candidates 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);