-- Add phone_source column to track the origin of each provider's phone number
ALTER TABLE providers
  ADD COLUMN phone_source TEXT;

ALTER TABLE providers
  ADD CONSTRAINT providers_phone_source_check
  CHECK (phone_source IN ('google_maps', 'pagesjaunes', 'enrichment_script', 'user_input', 'claim', 'manual', 'sirene'));

COMMENT ON COLUMN providers.phone_source
  IS 'Tracks the origin of the phone number: google_maps, pagesjaunes, enrichment_script, user_input, claim, manual, or sirene';

-- Backfill based on source and claim status
UPDATE providers
  SET phone_source = 'user_input'
  WHERE phone IS NOT NULL
    AND claimed_at IS NOT NULL
    AND phone_source IS NULL;

UPDATE providers
  SET phone_source = 'google_maps'
  WHERE phone IS NOT NULL
    AND source IN ('google_maps', 'google')
    AND phone_source IS NULL;

UPDATE providers
  SET phone_source = 'enrichment_script'
  WHERE phone IS NOT NULL
    AND source = 'annuaire_entreprises'
    AND phone_source IS NULL;
