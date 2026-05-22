-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║ Glory Hair RIOT — Seed wigs Issue N°01                                 ║
-- ║ Date : 2026-05-22                                                      ║
-- ║                                                                        ║
-- ║ Insère les 6 perruques LIVE_WIGS (source de vérité tryon-live.jsx).    ║
-- ║ Prix en cents (259€ → 25900).                                          ║
-- ╚════════════════════════════════════════════════════════════════════════╝

INSERT INTO wigs (slug, name, description, base_price, category, hair_type, length, color, sku, featured, active)
VALUES
  ('velours',  'Velours 14"',    'Curly bob chocolat — Closure, lace front HD invisible', 25900, 'wavy',     'human', 'medium', 'Châtain',    'GH-VEL-14', true,  true),
  ('mocha',    'Moka 20"',       'Body wave moka — Lace Front, 180% densité',              33900, 'straight', 'human', 'long',   'Moka',       'GH-MOC-20', false, true),
  ('ginger',   'Ginger 18"',     'Wavy cuivre flame — Lace Front HD, cover Issue N°01',    31900, 'wavy',     'human', 'long',   'Ginger',     'GH-GIN-18', true,  true),
  ('bordeaux', 'Bordeaux 22"',   'Body wave plum profond — 360 Lace, baby hair pré-épilé', 41900, 'wavy',     'human', 'long',   'Plum',       'GH-BOR-22', false, true),
  ('argent',   'Argent 18"',     'Straight argent métallique — Full Lace HD',              38900, 'straight', 'human', 'long',   'Argent',     'GH-ARG-18', false, true),
  ('creme',    'Café Crème 16"', 'Wavy blond doré — Closure, calotte respirante',          28900, 'wavy',     'human', 'medium', 'Blond doré', 'GH-CRE-16', true,  true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  sku = EXCLUDED.sku,
  featured = EXCLUDED.featured,
  updated_at = now();

-- Note : les images sont gérées via wig_images. Pour le MVP on utilise les
-- chemins locaux /public/images/{slug}.jpg côté Next.js. Pour la prod,
-- migrer vers Cloudinary et remplir wig_images.
