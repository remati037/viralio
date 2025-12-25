-- Create task_categories table
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6', -- Default blue color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, name) -- Prevent duplicate category names per user
);

-- Add category_id to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_categories_user_id ON task_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_task_categories_updated_at ON task_categories;
CREATE TRIGGER update_task_categories_updated_at BEFORE UPDATE ON task_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Users can view their own categories" ON task_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON task_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON task_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON task_categories;

-- RLS Policies for task_categories
CREATE POLICY "Users can view their own categories"
  ON task_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON task_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON task_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON task_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_task_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default categories for new user
  INSERT INTO task_categories (user_id, name, color) VALUES
    (NEW.id, 'Marketing', '#3b82f6'),
    (NEW.id, 'Edukacija', '#8b5cf6'),
    (NEW.id, 'Fitness', '#ef4444'),
    (NEW.id, 'E-commerce', '#f59e0b'),
    (NEW.id, 'Nekretnine', '#10b981'),
    (NEW.id, 'Kočing', '#ec4899'),
    (NEW.id, 'Tehnologija', '#06b6d4'),
    (NEW.id, 'Zabava', '#f97316')
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS create_default_categories_on_profile ON profiles;
CREATE TRIGGER create_default_categories_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_task_categories();

