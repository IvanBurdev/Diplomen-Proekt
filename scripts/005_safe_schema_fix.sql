-- Safe schema migration - only add columns that don't exist
-- and handle the reviews-profiles relationship

-- Add is_approved to reviews if not exists
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Add colors array to products if not exists  
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}';

-- Add image_url to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;

-- Update existing products to have is_active = true and copy from featured if it exists
UPDATE products SET is_active = true WHERE is_active IS NULL;
UPDATE products SET is_featured = false WHERE is_featured IS NULL;

-- Update discount_codes to have is_active if it doesn't exist
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Set all existing discount codes as active
UPDATE discount_codes SET is_active = true WHERE is_active IS NULL;

-- Approve all existing reviews
UPDATE reviews SET is_approved = true WHERE is_approved IS NULL;

-- Create a view for reviews with profile info since we can't easily add FK to profiles
CREATE OR REPLACE VIEW reviews_with_profiles AS
SELECT 
  r.id,
  r.product_id,
  r.user_id,
  r.rating,
  r.comment,
  r.is_approved,
  r.created_at,
  p.full_name,
  p.avatar_url
FROM reviews r
LEFT JOIN profiles p ON r.user_id = p.id;
