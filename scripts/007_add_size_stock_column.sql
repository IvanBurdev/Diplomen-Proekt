ALTER TABLE products
ADD COLUMN IF NOT EXISTS size_stock JSONB DEFAULT '{}'::jsonb;

UPDATE products
SET size_stock = '{}'::jsonb
WHERE size_stock IS NULL;
