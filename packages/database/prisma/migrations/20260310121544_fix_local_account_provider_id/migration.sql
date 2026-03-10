-- Migrate LOCAL accounts to use userId instead of email as providerAccountId.
-- This makes the identifier stable across email changes.
-- Login never queries by providerAccountId, so this is a safe data-only change.
UPDATE "Account"
SET   "providerAccountId" = "userId"
WHERE provider = 'LOCAL';
