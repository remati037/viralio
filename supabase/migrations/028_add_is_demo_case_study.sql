-- Mark demo (seeded) case studies so they can be hidden when real Sanity case studies exist
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_demo_case_study BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tasks_is_demo_case_study ON tasks(is_demo_case_study) WHERE is_admin_case_study = true;
