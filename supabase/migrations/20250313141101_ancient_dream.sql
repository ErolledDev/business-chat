/*
  # Fix Chat Functionality Issues

  1. Changes
    - Add message_status to chat_messages
    - Add visitor_name to chat_sessions
    - Add notes to chat_sessions
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add message_status to chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('sent', 'delivered', 'read'));

-- Add visitor_name and notes to chat_sessions
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS visitor_name text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_name ON chat_sessions(visitor_name);