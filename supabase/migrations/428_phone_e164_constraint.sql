-- Migration 428: Add phone_e164 format CHECK constraint
-- P1-22 follow-up: phone_e164 format was listed in the audit but not included
-- in migration 424. E.164 format: +[country code][number], 8-15 digits total.
-- Date: 2026-03-18

DO $$ BEGIN
  ALTER TABLE attorneys
    ADD CONSTRAINT chk_attorneys_phone_e164
    CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9]\d{7,14}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
