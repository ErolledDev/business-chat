/*
  # Add Read Status to Chat Messages

  1. Changes
    - Add read_at timestamp to chat_messages table
    - Add unread_count to chat_sessions table
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add read_at column to chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Add unread_count to chat_sessions
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_at ON chat_messages(read_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_unread_count ON chat_sessions(unread_count);