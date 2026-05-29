-- AlterEnum: add MANUAL to InsightTrigger
-- ALTER TYPE ADD VALUE is non-transactional in Postgres — it cannot run inside
-- an explicit transaction block, which is why this migration uses a plain statement.
ALTER TYPE "InsightTrigger" ADD VALUE 'MANUAL';
