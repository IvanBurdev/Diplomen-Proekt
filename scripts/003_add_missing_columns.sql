-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Copy existing data if columns existed with different names
UPDATE products SET is_featured = featured WHERE featured IS NOT NULL;
UPDATE products SET is_active = TRUE WHERE is_active IS NULL;

-- Add is_active to discount_codes
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Copy existing active data
UPDATE discount_codes SET is_active = active WHERE active IS NOT NULL;
