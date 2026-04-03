-- Add color support to cart items and ensure uniqueness per variant.
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS color TEXT;

UPDATE cart_items
SET color = ''
WHERE color IS NULL;

ALTER TABLE cart_items
ALTER COLUMN color SET DEFAULT '';

ALTER TABLE cart_items
ALTER COLUMN color SET NOT NULL;

ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_size_key;

ALTER TABLE cart_items
ADD CONSTRAINT cart_items_user_id_product_id_size_color_key
UNIQUE(user_id, product_id, size, color);
