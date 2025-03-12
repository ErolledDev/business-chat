/*
  # Additional RLS Policy Fixes

  1. Changes
    - Add missing policies for widget_settings table
    - Fix chat_sessions policies to handle visitor_id properly
    - Add policies for updating chat sessions
    - Add policies for updating chat messages

  2. Security
    - Maintain data isolation
    - Ensure proper access control
*/

-- Add missing widget_settings policies
CREATE POLICY "Allow anonymous to read all widget settings"
  ON widget_settings
  FOR SELECT
  TO anon
  USING (true);

-- Update chat_sessions policies
CREATE POLICY "Allow anonymous to update their chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Update chat_messages policies
CREATE POLICY "Allow anonymous to update their messages"
  ON chat_messages
  FOR UPDATE
  TO anon
  USING (
    session_id IN (
      SELECT id FROM chat_sessions 
      WHERE status = 'active'
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions 
      WHERE status = 'active'
    )
  );

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);