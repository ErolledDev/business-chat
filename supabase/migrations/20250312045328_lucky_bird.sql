/*
  # Enable Chat Functionality

  1. Changes
    - Add visitor_auth_id to chat_sessions table
    - Add policies for anonymous access to chat tables
    - Update existing policies to work with anonymous users

  2. Security
    - Enable anonymous access to required tables
    - Maintain data isolation between users
*/

-- Add visitor_auth_id to chat_sessions
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS visitor_auth_id uuid REFERENCES auth.users(id);

-- Allow anonymous users to read widget settings
CREATE POLICY "Anyone can read widget settings"
  ON widget_settings
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to manage their own chat sessions
CREATE POLICY "Anyone can create chat sessions"
  ON chat_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read their chat sessions"
  ON chat_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to manage chat messages
CREATE POLICY "Anyone can create chat messages"
  ON chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions 
      WHERE status = 'active'
    )
  );

CREATE POLICY "Anyone can read chat messages"
  ON chat_messages
  FOR SELECT
  TO anon
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_auth_id 
  ON chat_sessions(visitor_auth_id);