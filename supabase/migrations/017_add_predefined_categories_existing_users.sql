-- Add predefined categories for existing users who don't have any categories
INSERT INTO task_categories (user_id, name, color)
SELECT 
  p.id,
  category_data.name,
  category_data.color
FROM profiles p
CROSS JOIN (
  VALUES
    ('Marketing', '#3b82f6'),
    ('Edukacija', '#8b5cf6'),
    ('Fitness', '#ef4444'),
    ('E-commerce', '#f59e0b'),
    ('Nekretnine', '#10b981'),
    ('Kočing', '#ec4899'),
    ('Tehnologija', '#06b6d4'),
    ('Zabava', '#f97316')
) AS category_data(name, color)
WHERE NOT EXISTS (
  SELECT 1 
  FROM task_categories tc 
  WHERE tc.user_id = p.id
)
ON CONFLICT (user_id, name) DO NOTHING;

