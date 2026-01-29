-- Align database schema with application expectations

-- Add is_active column to products (some products may be disabled)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Rename featured to is_featured for consistency
ALTER TABLE products RENAME COLUMN featured TO is_featured;

-- Add stock_quantity alias (or use existing stock)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE products RENAME COLUMN stock TO stock_quantity;
  END IF;
END $$;

-- Add colors column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}';

-- Add is_active column to discount_codes (rename from active)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discount_codes' AND column_name = 'active') THEN
    ALTER TABLE discount_codes RENAME COLUMN active TO is_active;
  END IF;
END $$;

-- Add is_approved column to reviews (for moderation)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Add foreign key from reviews.user_id to profiles.id for the nested select to work
-- Note: reviews already references auth.users, but we need to reference profiles for the join
-- We'll add a separate profile_id column that references profiles

-- Actually, since profiles.id = auth.users.id, we can create a view or just use the user_id
-- The issue is Supabase PostgREST needs a FK relationship to do nested selects
-- Let's add a FK relationship from reviews to profiles

-- First ensure there's a FK constraint (if not already there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_user_id_profiles_fkey' 
    AND table_name = 'reviews'
  ) THEN
    ALTER TABLE reviews 
    ADD CONSTRAINT reviews_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add image_url to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
