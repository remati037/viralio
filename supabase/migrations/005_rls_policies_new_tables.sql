-- Create function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_id
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for profiles (update to allow admin access)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

DROP POLICY IF EXISTS "Admins can view all templates" ON templates;
DROP POLICY IF EXISTS "Users can view published templates for their tier" ON templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON templates;
DROP POLICY IF EXISTS "Admins can update templates" ON templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON templates;

DROP POLICY IF EXISTS "Admins can view all template visibility" ON template_visibility;
DROP POLICY IF EXISTS "Users can view template visibility for their tier" ON template_visibility;
DROP POLICY IF EXISTS "Admins can manage template visibility" ON template_visibility;

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "System can insert payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;

DROP POLICY IF EXISTS "Users can view their own statistics" ON user_statistics;
DROP POLICY IF EXISTS "Admins can view all statistics" ON user_statistics;
DROP POLICY IF EXISTS "System can insert statistics" ON user_statistics;
DROP POLICY IF EXISTS "System can update statistics" ON user_statistics;

DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view admin case studies" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can insert admin case studies" ON tasks;
DROP POLICY IF EXISTS "Admins can update admin case studies" ON tasks;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true); -- Allow trigger to insert profiles

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- RLS Policies for templates
CREATE POLICY "Admins can view all templates"
  ON templates FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view published templates for their tier"
  ON templates FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM template_visibility tv
      JOIN profiles p ON p.id = auth.uid()
      WHERE tv.template_id = templates.id
      AND tv.tier = p.tier
    )
  );

CREATE POLICY "Admins can insert templates"
  ON templates FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update templates"
  ON templates FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete templates"
  ON templates FOR DELETE
  USING (is_admin(auth.uid()));

-- RLS Policies for template_visibility
CREATE POLICY "Admins can view all template visibility"
  ON template_visibility FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view template visibility for their tier"
  ON template_visibility FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND template_visibility.tier = p.tier
    )
  );

CREATE POLICY "Admins can manage template visibility"
  ON template_visibility FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  WITH CHECK (true); -- Handled by trigger

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (is_admin(auth.uid()));

-- RLS Policies for user_statistics
CREATE POLICY "Users can view their own statistics"
  ON user_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statistics"
  ON user_statistics FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert statistics"
  ON user_statistics FOR INSERT
  WITH CHECK (true); -- Handled by trigger

CREATE POLICY "System can update statistics"
  ON user_statistics FOR UPDATE
  USING (true); -- Can be updated by triggers or admins

-- RLS Policies for tasks (update to allow admin case studies)
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id OR is_admin_case_study = true);

CREATE POLICY "Users can view admin case studies"
  ON tasks FOR SELECT
  USING (is_admin_case_study = true);

CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin case studies"
  ON tasks FOR INSERT
  WITH CHECK (
    is_admin(auth.uid()) AND is_admin_case_study = true
  );

CREATE POLICY "Admins can update admin case studies"
  ON tasks FOR UPDATE
  USING (
    is_admin(auth.uid()) AND is_admin_case_study = true
  );

