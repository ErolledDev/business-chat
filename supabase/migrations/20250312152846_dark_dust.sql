/*
  # Add Pinned Column to Chat Sessions

  1. Changes
    - Add pinned boolean column to chat_sessions table
    - Add index for better query performance
*/

-- Add pinned column to chat_sessions
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_pinned ON chat_sessions(pinned);