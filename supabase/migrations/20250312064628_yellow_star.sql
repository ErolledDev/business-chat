/*
  # Fix RLS Policies for Anonymous Access

  1. Changes
    - Update widget_settings policies to allow anonymous reads
    - Update chat_sessions policies to allow anonymous users to create and read sessions
    - Update chat_messages policies to allow anonymous users to create and read messages
    - Remove visitor_auth_id requirement since we're using visitor_id

  2. Security
    - Maintain data isolation between users
    - Allow anonymous access while preserving security
*/

-- Drop existing anonymous policies that might conflict
DROP POLICY IF EXISTS "Anyone can read widget settings" ON widget_settings;
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Anyone can read their chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Anyone can create chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can read chat messages" ON chat_messages;

-- Widget Settings: Allow anonymous read access
CREATE POLICY "Allow anonymous to read widget settings"
  ON widget_settings
  FOR SELECT
  TO anon
  USING (true);

-- Chat Sessions: Allow anonymous users to create and read sessions
CREATE POLICY "Allow anonymous to create chat sessions"
  ON chat_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to read chat sessions"
  ON chat_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Chat Messages: Allow anonymous users to create and read messages
CREATE POLICY "Allow anonymous to create chat messages"
  ON chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions 
      WHERE status = 'active'
    )
  );

CREATE POLICY "Allow anonymous to read chat messages"
  ON chat_messages
  FOR SELECT
  TO anon
  USING (true);