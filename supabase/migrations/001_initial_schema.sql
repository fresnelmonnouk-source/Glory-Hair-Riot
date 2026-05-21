-- Glory Hair MVP - Initial Schema
-- Created: 2026-05-21
-- This migration creates all tables, indexes, RLS policies, and triggers for the MVP

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users (extended profile, linked to Supabase Auth)
-- Auth.uid() is provided by Supabase Auth, we store extended profile data
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,

  -- Address fields
  street_address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,

  -- Preferences
  hair_type TEXT, -- texture preference for recommendations
  skin_tone TEXT,
  preferred_currency TEXT DEFAULT 'EUR',

  -- Metadata
  accepts_marketing BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wigs (product catalog)
CREATE TABLE IF NOT EXISTS wigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,

  -- Pricing (always in cents: 50.00€ = 5000)
  base_price INT NOT NULL CHECK (base_price > 0),

  -- Metadata
  category TEXT NOT NULL, -- 'straight', 'curly', 'wavy', 'braided', etc.
  hair_type TEXT, -- 'human', 'synthetic', 'blend'
  length TEXT, -- 'short', 'medium', 'long'
  color TEXT,

  -- Stock
  stock_quantity INT DEFAULT 0,
  sku TEXT UNIQUE,

  -- SEO
  meta_description TEXT,
  meta_keywords TEXT,

  -- Flags
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wig Variants (size, color variants per wig)
CREATE TABLE IF NOT EXISTS wig_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,

  variant_name TEXT NOT NULL, -- e.g., "Lace Front - Blonde"
  variant_sku TEXT,

  -- Variant-specific price override (in cents, null = use wig base_price)
  price_override INT,

  stock_quantity INT DEFAULT 0,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wig Images (product images for try-on overlays and display)
CREATE TABLE IF NOT EXISTS wig_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES wig_variants(id) ON DELETE CASCADE,

  image_url TEXT NOT NULL, -- Cloudinary URL
  alt_text TEXT,

  -- For try-on: face mesh overlay PNG
  is_try_on_overlay BOOLEAN DEFAULT false,
  overlay_adjust_json JSONB, -- { "scaleX": 1.2, "offsetY": -20 }

  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cart Items (user shopping carts)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES wig_variants(id) ON DELETE SET NULL,

  quantity INT NOT NULL CHECK (quantity > 0),

  -- Snapshot of price at add time (in cents)
  price_at_added INT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders (completed purchases)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Order metadata
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'

  -- Amounts (all in cents)
  subtotal_cents INT NOT NULL,
  shipping_cents INT NOT NULL,
  discount_cents INT DEFAULT 0,
  total_cents INT NOT NULL,

  -- Delivery
  shipping_method TEXT DEFAULT 'standard', -- 'standard', 'express'
  tracking_number TEXT,

  -- Delivery address snapshot
  delivery_name TEXT,
  delivery_street TEXT,
  delivery_city TEXT,
  delivery_postal_code TEXT,
  delivery_country TEXT,

  -- Payment info
  payment_method TEXT, -- 'stripe', 'fedapay'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'succeeded', 'failed'
  stripe_payment_intent_id TEXT,
  fedapay_transaction_id TEXT,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order Items (line items in orders)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES wig_variants(id) ON DELETE SET NULL,

  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_cents INT NOT NULL, -- Price when order was placed

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Wishlist Items (saved for later)
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(user_id, wig_id)
);

-- Try-On Results (saved virtual try-on snapshots)
CREATE TABLE IF NOT EXISTS tryon_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wig_id UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,

  -- Stored snapshot
  snapshot_url TEXT, -- Cloudinary URL of try-on result image
  face_landmarks JSONB, -- Face mesh coordinates for replay

  shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ELODIE Conversations (chat history with AI)
CREATE TABLE IF NOT EXISTS elodie_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT,
  context JSONB DEFAULT '{}', -- { "sessionProduct": "...", "lastIntent": "..." }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ELODIE Messages (conversation messages)
CREATE TABLE IF NOT EXISTS elodie_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES elodie_conversations(id) ON DELETE CASCADE,

  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,

  tokens_used INT, -- For cost tracking

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Discount Codes
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,

  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value INT NOT NULL, -- percentage: 20 (20%), fixed: 5000 (50€ in cents)

  max_uses INT,
  current_uses INT DEFAULT 0,

  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Processed Webhook Events (idempotency for payment webhooks)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL, -- 'stripe.payment_intent.succeeded', 'fedapay.transaction.approved'

  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wigs_slug ON wigs(slug);
CREATE INDEX IF NOT EXISTS idx_wigs_category ON wigs(category);
CREATE INDEX IF NOT EXISTS idx_wigs_active ON wigs(active);

CREATE INDEX IF NOT EXISTS idx_wig_variants_wig_id ON wig_variants(wig_id);
CREATE INDEX IF NOT EXISTS idx_wig_images_wig_id ON wig_images(wig_id);
CREATE INDEX IF NOT EXISTS idx_wig_images_variant_id ON wig_images(variant_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_wig_id ON cart_items(wig_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_created ON cart_items(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_fedapay_txn ON orders(fedapay_transaction_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_wig_id ON order_items(wig_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);

CREATE INDEX IF NOT EXISTS idx_tryon_results_user_id ON tryon_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_results_user_created ON tryon_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tryon_results_shared ON tryon_results(shared, share_token);

CREATE INDEX IF NOT EXISTS idx_elodie_conversations_user_id ON elodie_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_elodie_messages_conversation_id ON elodie_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_elodie_messages_created ON elodie_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_event_id ON processed_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_type ON processed_webhook_events(event_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wig_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE wig_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryon_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE elodie_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE elodie_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Users: SELECT/UPDATE own profile
CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Wigs: Public SELECT (anyone can see wigs)
CREATE POLICY "wigs_public_select" ON wigs FOR SELECT
  USING (true);

-- Admin-only mutations (INSERT/UPDATE/DELETE) via service role
CREATE POLICY "wigs_admin_mutations" ON wigs FOR ALL
  USING (false) -- Deny by default, only service role can bypass
  WITH CHECK (false);

-- Wig Variants: Public SELECT
CREATE POLICY "wig_variants_public_select" ON wig_variants FOR SELECT
  USING (true);

-- Wig Variants: Admin-only mutations via service role
CREATE POLICY "wig_variants_admin_mutations" ON wig_variants FOR ALL
  USING (false)
  WITH CHECK (false);

-- Wig Images: Public SELECT
CREATE POLICY "wig_images_public_select" ON wig_images FOR SELECT
  USING (true);

-- Wig Images: Admin-only mutations via service role
CREATE POLICY "wig_images_admin_mutations" ON wig_images FOR ALL
  USING (false)
  WITH CHECK (false);

-- Cart Items: Users can see/modify only their own
CREATE POLICY "cart_items_user_select" ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cart_items_user_insert" ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items_user_update" ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "cart_items_user_delete" ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Orders: Users can see only their own; admins can see all
CREATE POLICY "orders_user_select" ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_user_insert" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service role can update/delete orders (via admin or webhook)
CREATE POLICY "orders_admin_mutations" ON orders FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Order Items: Users can see items from their orders
CREATE POLICY "order_items_user_select" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Wishlist Items: Users see only their own
CREATE POLICY "wishlist_items_user_select" ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wishlist_items_user_insert" ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_items_user_delete" ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- Try-On Results: Users see their own; public access if shared
CREATE POLICY "tryon_results_user_select" ON tryon_results FOR SELECT
  USING (auth.uid() = user_id OR shared = true);

CREATE POLICY "tryon_results_user_insert" ON tryon_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tryon_results_user_update" ON tryon_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "tryon_results_user_delete" ON tryon_results FOR DELETE
  USING (auth.uid() = user_id);

-- ELODIE Conversations: Users see only their own
CREATE POLICY "elodie_conversations_user_select" ON elodie_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "elodie_conversations_user_insert" ON elodie_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "elodie_conversations_user_update" ON elodie_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- ELODIE Messages: Users see messages from their conversations
CREATE POLICY "elodie_messages_user_select" ON elodie_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM elodie_conversations WHERE elodie_conversations.id = elodie_messages.conversation_id AND elodie_conversations.user_id = auth.uid()));

CREATE POLICY "elodie_messages_user_insert" ON elodie_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM elodie_conversations WHERE elodie_conversations.id = elodie_messages.conversation_id AND elodie_conversations.user_id = auth.uid()));

-- Discount Codes: Public SELECT (for validation)
CREATE POLICY "discount_codes_public_select" ON discount_codes FOR SELECT
  USING (active = true AND (valid_from IS NULL OR valid_from <= now()) AND (valid_until IS NULL OR valid_until >= now()));

-- Processed Webhook Events: Service role only
CREATE POLICY "processed_webhook_events_service_only" ON processed_webhook_events FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER wigs_updated_at BEFORE UPDATE ON wigs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER wig_variants_updated_at BEFORE UPDATE ON wig_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER elodie_conversations_updated_at BEFORE UPDATE ON elodie_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sync user creation with Supabase Auth
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
