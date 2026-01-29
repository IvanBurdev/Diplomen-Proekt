-- Add "All Kits" category for viewing all kit types together

INSERT INTO categories (name, slug, description) VALUES
  ('All Kits', 'all-kits', 'View all home, away, and third kits in one place')
ON CONFLICT (slug) DO NOTHING;
