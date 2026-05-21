export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          street_address: string | null;
          city: string | null;
          postal_code: string | null;
          country: string | null;
          hair_type: string | null;
          skin_tone: string | null;
          preferred_currency: string;
          accepts_marketing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          street_address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          country?: string | null;
          hair_type?: string | null;
          skin_tone?: string | null;
          preferred_currency?: string;
          accepts_marketing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          street_address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          country?: string | null;
          hair_type?: string | null;
          skin_tone?: string | null;
          preferred_currency?: string;
          accepts_marketing?: boolean;
          updated_at?: string;
        };
      };
      wigs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          long_description: string | null;
          base_price: number;
          category: string;
          hair_type: string | null;
          length: string | null;
          color: string | null;
          stock_quantity: number;
          sku: string | null;
          meta_description: string | null;
          meta_keywords: string | null;
          featured: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          long_description?: string | null;
          base_price: number;
          category: string;
          hair_type?: string | null;
          length?: string | null;
          color?: string | null;
          stock_quantity?: number;
          sku?: string | null;
          meta_description?: string | null;
          meta_keywords?: string | null;
          featured?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          long_description?: string | null;
          base_price?: number;
          category?: string;
          hair_type?: string | null;
          length?: string | null;
          color?: string | null;
          stock_quantity?: number;
          sku?: string | null;
          meta_description?: string | null;
          meta_keywords?: string | null;
          featured?: boolean;
          active?: boolean;
          updated_at?: string;
        };
      };
      wig_variants: {
        Row: {
          id: string;
          wig_id: string;
          variant_name: string;
          variant_sku: string | null;
          price_override: number | null;
          stock_quantity: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wig_id: string;
          variant_name: string;
          variant_sku?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wig_id?: string;
          variant_name?: string;
          variant_sku?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          active?: boolean;
          updated_at?: string;
        };
      };
      wig_images: {
        Row: {
          id: string;
          wig_id: string;
          variant_id: string | null;
          image_url: string;
          alt_text: string | null;
          is_try_on_overlay: boolean;
          overlay_adjust_json: Json | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          wig_id: string;
          variant_id?: string | null;
          image_url: string;
          alt_text?: string | null;
          is_try_on_overlay?: boolean;
          overlay_adjust_json?: Json | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          wig_id?: string;
          variant_id?: string | null;
          image_url?: string;
          alt_text?: string | null;
          is_try_on_overlay?: boolean;
          overlay_adjust_json?: Json | null;
          display_order?: number;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          wig_id: string;
          variant_id: string | null;
          quantity: number;
          price_at_added: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wig_id: string;
          variant_id?: string | null;
          quantity: number;
          price_at_added: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wig_id?: string;
          variant_id?: string | null;
          quantity?: number;
          price_at_added?: number;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          subtotal_cents: number;
          shipping_cents: number;
          discount_cents: number;
          total_cents: number;
          shipping_method: string | null;
          tracking_number: string | null;
          delivery_name: string | null;
          delivery_street: string | null;
          delivery_city: string | null;
          delivery_postal_code: string | null;
          delivery_country: string | null;
          payment_method: 'stripe' | 'fedapay' | null;
          payment_status: 'pending' | 'succeeded' | 'failed';
          stripe_payment_intent_id: string | null;
          fedapay_transaction_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          subtotal_cents: number;
          shipping_cents: number;
          discount_cents?: number;
          total_cents: number;
          shipping_method?: string | null;
          tracking_number?: string | null;
          delivery_name?: string | null;
          delivery_street?: string | null;
          delivery_city?: string | null;
          delivery_postal_code?: string | null;
          delivery_country?: string | null;
          payment_method?: 'stripe' | 'fedapay' | null;
          payment_status?: 'pending' | 'succeeded' | 'failed';
          stripe_payment_intent_id?: string | null;
          fedapay_transaction_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          shipping_method?: string | null;
          tracking_number?: string | null;
          delivery_name?: string | null;
          delivery_street?: string | null;
          delivery_city?: string | null;
          delivery_postal_code?: string | null;
          delivery_country?: string | null;
          payment_method?: 'stripe' | 'fedapay' | null;
          payment_status?: 'pending' | 'succeeded' | 'failed';
          stripe_payment_intent_id?: string | null;
          fedapay_transaction_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          wig_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          wig_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price_cents: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
          unit_price_cents?: number;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          wig_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wig_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          wig_id?: string;
        };
      };
      tryon_results: {
        Row: {
          id: string;
          user_id: string;
          wig_id: string;
          snapshot_url: string | null;
          face_landmarks: Json | null;
          shared: boolean;
          share_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wig_id: string;
          snapshot_url?: string | null;
          face_landmarks?: Json | null;
          shared?: boolean;
          share_token?: string | null;
          created_at?: string;
        };
        Update: {
          snapshot_url?: string | null;
          face_landmarks?: Json | null;
          shared?: boolean;
          share_token?: string | null;
        };
      };
      elodie_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          context: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          context?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          context?: Json;
          updated_at?: string;
        };
      };
      elodie_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          tokens_used?: number | null;
        };
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          max_uses: number | null;
          current_uses: number;
          valid_from: string | null;
          valid_until: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          max_uses?: number | null;
          current_uses?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          discount_type?: 'percentage' | 'fixed';
          discount_value?: number;
          max_uses?: number | null;
          current_uses?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          active?: boolean;
        };
      };
      processed_webhook_events: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          processed_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
      payment_status: 'pending' | 'succeeded' | 'failed';
      payment_method: 'stripe' | 'fedapay';
      message_role: 'user' | 'assistant';
      discount_type: 'percentage' | 'fixed';
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
