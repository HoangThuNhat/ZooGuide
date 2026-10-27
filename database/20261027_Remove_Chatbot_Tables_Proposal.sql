-- ==============================================================================
-- ZOOGUIDE DATABASE SCHEMA MIGRATION PROPOSAL
-- Purpose: Safely decommission and drop obsolete Chatbot tables (CHAT_MESSAGES, CHAT_SESSIONS)
-- Requirement: Task F - Complete Chatbot Removal
-- Execution Policy: This is a standalone proposal script. 
--                   Per business requirements, do not execute destructive table drops 
--                   against live Supabase database automatically. 
--                   Run only after formal administrator approval and data archiving.
-- ==============================================================================

BEGIN;

-- 1. Check if backup / archiving is desired before dropping
-- CREATE TABLE IF NOT EXISTS ARCHIVE_CHAT_MESSAGES AS SELECT * FROM "CHAT_MESSAGES";
-- CREATE TABLE IF NOT EXISTS ARCHIVE_CHAT_SESSIONS AS SELECT * FROM "CHAT_SESSIONS";

-- 2. Drop foreign key constraints referencing chat sessions if any
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'CHAT_MESSAGES'
    ) THEN
        DROP TABLE IF EXISTS "CHAT_MESSAGES" CASCADE;
        RAISE NOTICE 'Table CHAT_MESSAGES has been dropped.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'CHAT_SESSIONS'
    ) THEN
        DROP TABLE IF EXISTS "CHAT_SESSIONS" CASCADE;
        RAISE NOTICE 'Table CHAT_SESSIONS has been dropped.';
    END IF;
END $$;

COMMIT;
