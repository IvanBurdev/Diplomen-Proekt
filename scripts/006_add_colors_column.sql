-- Add colors column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';

-- Update existing products with some default colors based on category
UPDATE products
SET colors = ARRAY['Red', 'White']
WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('home-kits', 'away-kits'));

UPDATE products
SET colors = ARRAY['Black', 'Navy']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'training-gear');

UPDATE products
SET colors = ARRAY['Blue', 'Green', 'Red', 'Black']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'accessories');

UPDATE products
SET colors = ARRAY['Yellow', 'Blue', 'White']
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'retro-kits');
