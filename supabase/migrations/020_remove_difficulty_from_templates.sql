-- Remove difficulty column from templates table
ALTER TABLE templates 
DROP COLUMN IF EXISTS difficulty;

