/*
  # Fix Profiles Table RLS Policy

  ## Issue
  The current RLS policy for the profiles table only allows users to read and update their own profiles.
  However, when creating a new user account, the profile record needs to be inserted by the newly authenticated user,
  but the RLS policy prevents INSERT operations.

  ## Solution
  Add an INSERT policy that allows authenticated users to create their own profile record.
  This policy ensures that users can only insert a profile where the id matches their authenticated user id.
*/

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);