-- Store Sanity document _id so sync can update existing case studies instead of creating duplicates
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS sanity_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_sanity_id ON tasks(sanity_id) WHERE sanity_id IS NOT NULL;

COMMENT ON COLUMN tasks.sanity_id IS 'Sanity CMS document _id for case studies; used by sync to upsert.';
