ALTER TABLE "Transaction"
ALTER COLUMN "salesMethod" TYPE text USING "salesMethod"::text;
DROP TYPE "SalesMethod";
