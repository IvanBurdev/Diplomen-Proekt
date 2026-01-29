-- Seed data for Football Kit Store

-- Insert categories
INSERT INTO categories (name, slug, description) VALUES
  ('Home Kits', 'home-kits', 'Official home match jerseys'),
  ('Away Kits', 'away-kits', 'Official away match jerseys'),
  ('Third Kits', 'third-kits', 'Third and alternate match jerseys'),
  ('Training Wear', 'training-wear', 'Training shirts, jackets and gear'),
  ('Retro Classics', 'retro-classics', 'Classic and vintage football kits'),
  ('Accessories', 'accessories', 'Socks, shin guards, and accessories')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, price, original_price, image_url, category_id, team, season, sizes, stock, featured) VALUES
  (
    'Manchester United Home Kit 2025/26',
    'manchester-united-home-2025-26',
    'Official Manchester United home jersey for the 2025/26 season. Features the iconic red design with advanced moisture-wicking technology.',
    89.99,
    NULL,
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'home-kits'),
    'Manchester United',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    50,
    TRUE
  ),
  (
    'Real Madrid Away Kit 2025/26',
    'real-madrid-away-2025-26',
    'Official Real Madrid away jersey for the 2025/26 season. Sleek black design with gold accents.',
    94.99,
    109.99,
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'away-kits'),
    'Real Madrid',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL'],
    35,
    TRUE
  ),
  (
    'Barcelona Third Kit 2025/26',
    'barcelona-third-2025-26',
    'Official Barcelona third jersey. Bold design with premium fabric technology.',
    84.99,
    NULL,
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'third-kits'),
    'Barcelona',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    40,
    FALSE
  ),
  (
    'Liverpool Home Kit 2025/26',
    'liverpool-home-2025-26',
    'Official Liverpool home jersey. Classic red with modern performance features.',
    89.99,
    99.99,
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'home-kits'),
    'Liverpool',
    '2025/26',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    60,
    TRUE
  ),
  (
    'Bayern Munich Training Jacket',
    'bayern-munich-training-jacket',
    'Official Bayern Munich training jacket. Perfect for warm-ups and casual wear.',
    74.99,
    NULL,
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'training-wear'),
    'Bayern Munich',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL'],
    25,
    FALSE
  ),
  (
    'AC Milan Retro Kit 1994',
    'ac-milan-retro-1994',
    'Classic AC Milan jersey from the legendary 1994 season. Authentic retro design.',
    69.99,
    79.99,
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'retro-classics'),
    'AC Milan',
    '1994',
    ARRAY['M', 'L', 'XL'],
    15,
    TRUE
  ),
  (
    'Chelsea Away Kit 2025/26',
    'chelsea-away-2025-26',
    'Official Chelsea away jersey for the 2025/26 season. Modern design with traditional elements.',
    89.99,
    NULL,
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'away-kits'),
    'Chelsea',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    45,
    FALSE
  ),
  (
    'PSG Home Kit 2025/26',
    'psg-home-2025-26',
    'Official Paris Saint-Germain home jersey. Elegant navy design with signature red stripe.',
    94.99,
    NULL,
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'home-kits'),
    'Paris Saint-Germain',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL'],
    30,
    TRUE
  ),
  (
    'Juventus Third Kit 2025/26',
    'juventus-third-2025-26',
    'Official Juventus third jersey. Unique design inspired by Turin heritage.',
    84.99,
    94.99,
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'third-kits'),
    'Juventus',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    38,
    FALSE
  ),
  (
    'Premium Football Socks Pack',
    'premium-football-socks',
    'Professional-grade football socks. Pack of 3 pairs in team colors.',
    24.99,
    NULL,
    'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'accessories'),
    NULL,
    NULL,
    ARRAY['S', 'M', 'L'],
    100,
    FALSE
  ),
  (
    'Arsenal Home Kit 2025/26',
    'arsenal-home-2025-26',
    'Official Arsenal home jersey for the 2025/26 season. Iconic red and white design.',
    89.99,
    NULL,
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'home-kits'),
    'Arsenal',
    '2025/26',
    ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    55,
    TRUE
  ),
  (
    'Borussia Dortmund Training Kit',
    'dortmund-training-kit',
    'Official BVB training jersey. Breathable fabric perfect for practice sessions.',
    59.99,
    69.99,
    'https://images.unsplash.com/photo-1551854838-212c50b4c184?w=600&h=600&fit=crop',
    (SELECT id FROM categories WHERE slug = 'training-wear'),
    'Borussia Dortmund',
    '2025/26',
    ARRAY['S', 'M', 'L', 'XL'],
    42,
    FALSE
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert sample discount codes
INSERT INTO discount_codes (code, discount_percent, valid_until, max_uses, active) VALUES
  ('WELCOME10', 10, '2026-12-31', 1000, TRUE),
  ('SUMMER20', 20, '2026-08-31', 500, TRUE),
  ('VIP25', 25, '2026-06-30', 100, TRUE)
ON CONFLICT (code) DO NOTHING;
