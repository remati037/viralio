-- Rename why_it_works column to concept in templates table
ALTER TABLE templates 
RENAME COLUMN why_it_works TO concept;

