-- ========================================================================================
-- ZOOGUIDE - ADD USER PASSWORDCHANGEDAT & BACKFILL EXISTING ADMIN/STAFF ACCOUNTS
-- Migration: 20261126_Add_User_PasswordChangedAt.sql
-- Description: Adds nullable TIMESTAMPTZ column PasswordChangedAt to USERS table and
--              backfills existing Admin and Staff accounts from CreatedAt (not LastLoginAt
--              or UpdatedAt) to enforce the mandatory 24-hour password change policy.
-- ========================================================================================

ALTER TABLE public."USERS"
ADD COLUMN IF NOT EXISTS "PasswordChangedAt" TIMESTAMPTZ NULL;

UPDATE public."USERS"
SET "PasswordChangedAt" = "CreatedAt"
WHERE "PasswordChangedAt" IS NULL
  AND "Role" IN ('Admin', 'Staff');
