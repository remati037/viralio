-- Allow all authenticated users to view inspiration_links for admin case study tasks
-- (so case study list/detail can show links when fetching tasks with embedded inspiration_links)
CREATE POLICY "Users can view inspiration links for admin case studies"
  ON inspiration_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = inspiration_links.task_id
      AND tasks.is_admin_case_study = true
    )
  );

-- Allow all authenticated users to view task_categories that are used by admin case study tasks
-- (so case study list/detail can show category when fetching tasks with embedded category)
CREATE POLICY "Users can view categories for admin case studies"
  ON task_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.category_id = task_categories.id
      AND tasks.is_admin_case_study = true
    )
  );
