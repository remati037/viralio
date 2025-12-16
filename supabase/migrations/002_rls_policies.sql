-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for social_links
CREATE POLICY "Users can view their own social links"
  ON social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = social_links.profile_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own social links"
  ON social_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = social_links.profile_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own social links"
  ON social_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = social_links.profile_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own social links"
  ON social_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = social_links.profile_id
      AND profiles.id = auth.uid()
    )
  );

-- RLS Policies for competitors
CREATE POLICY "Users can view their own competitors"
  ON competitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitors"
  ON competitors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitors"
  ON competitors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitors"
  ON competitors FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for inspiration_links
CREATE POLICY "Users can view their own inspiration links"
  ON inspiration_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = inspiration_links.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own inspiration links"
  ON inspiration_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = inspiration_links.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own inspiration links"
  ON inspiration_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = inspiration_links.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own inspiration links"
  ON inspiration_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = inspiration_links.task_id
      AND tasks.user_id = auth.uid()
    )
  );

