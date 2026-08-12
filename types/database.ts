export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          avatar_url: string | null
          user_type: string
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          user_type?: string
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          user_type?: string
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          id: string
          name: string
          slug: string | null
          name_he: string | null
          icon: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          name_he?: string | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          name_he?: string | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          id: string
          user_id: string | null
          category_id: string | null
          title: string
          description: string | null
          rating: number | null
          reviews_count: number | null
          hourly_price: number | null
          city: string | null
          available: boolean | null
          profile_image: string | null
          subscription_tier: string
          lead_credits: number
          subscription_until: string | null
          stripe_customer_id: string | null
          tranzila_token: string | null
          tranzila_sto_id: string | null
          tranzila_subscription_until: string | null
          is_verified: boolean
          verified_at: string | null
          phone: string | null
          whatsapp_number: string | null
          avg_response_minutes: number | null
          response_sample_count: number
          referral_code: string | null
          availability_summary: string | null
          midrag_profile_url: string | null
          midrag_rating: number | null
          midrag_reviews_count: number | null
          midrag_last_synced_at: string | null
          midrag_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          category_id?: string | null
          title: string
          description?: string | null
          rating?: number | null
          reviews_count?: number | null
          hourly_price?: number | null
          city?: string | null
          available?: boolean | null
          profile_image?: string | null
          subscription_tier?: string
          lead_credits?: number
          subscription_until?: string | null
          stripe_customer_id?: string | null
          tranzila_token?: string | null
          tranzila_sto_id?: string | null
          tranzila_subscription_until?: string | null
          is_verified?: boolean
          verified_at?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          avg_response_minutes?: number | null
          response_sample_count?: number
          referral_code?: string | null
          availability_summary?: string | null
          midrag_profile_url?: string | null
          midrag_rating?: number | null
          midrag_reviews_count?: number | null
          midrag_last_synced_at?: string | null
          midrag_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          category_id?: string | null
          title?: string
          description?: string | null
          rating?: number | null
          reviews_count?: number | null
          hourly_price?: number | null
          city?: string | null
          available?: boolean | null
          profile_image?: string | null
          subscription_tier?: string
          lead_credits?: number
          subscription_until?: string | null
          stripe_customer_id?: string | null
          tranzila_token?: string | null
          tranzila_sto_id?: string | null
          tranzila_subscription_until?: string | null
          is_verified?: boolean
          verified_at?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          avg_response_minutes?: number | null
          response_sample_count?: number
          referral_code?: string | null
          availability_summary?: string | null
          midrag_profile_url?: string | null
          midrag_rating?: number | null
          midrag_reviews_count?: number | null
          midrag_last_synced_at?: string | null
          midrag_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'professionals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'professionals_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'service_categories'
            referencedColumns: ['id']
          },
        ]
      }
      requests: {
        Row: {
          id: string
          customer_id: string | null
          professional_id: string | null
          category_id: string | null
          title: string
          description: string | null
          address: string | null
          city: string | null
          status: string
          quoted_amount: number | null
          platform_fee_agorot: number | null
          paid_at: string | null
          destination_lat: number | null
          destination_lng: number | null
          pro_lat: number | null
          pro_lng: number | null
          pro_location_updated_at: string | null
          live_tracking_active: boolean
          cancellation_reason: string | null
          match_mode: string
          accepted_at: string | null
          preferred_date: string | null
          preferred_time: string | null
          referral_code: string | null
          review_prompted_at: string | null
          payment_status: string | null
          payment_amount_agorot: number | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          source: string
          external_system: string | null
          external_ticket_id: string | null
          external_ticket_number: number | null
          external_client_id: string | null
          external_client_name: string | null
          building_name: string | null
          reporter_phone: string | null
          manager_phone: string | null
          manager_notes: string | null
          callback_url: string | null
          assignment_mode: string
          priority: string
          media_urls: Json
          matched_providers_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          professional_id?: string | null
          category_id?: string | null
          title: string
          description?: string | null
          address?: string | null
          city?: string | null
          status?: string
          quoted_amount?: number | null
          platform_fee_agorot?: number | null
          paid_at?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          pro_lat?: number | null
          pro_lng?: number | null
          pro_location_updated_at?: string | null
          live_tracking_active?: boolean
          cancellation_reason?: string | null
          match_mode?: string
          accepted_at?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          referral_code?: string | null
          review_prompted_at?: string | null
          payment_status?: string | null
          payment_amount_agorot?: number | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          source?: string
          external_system?: string | null
          external_ticket_id?: string | null
          external_ticket_number?: number | null
          external_client_id?: string | null
          external_client_name?: string | null
          building_name?: string | null
          reporter_phone?: string | null
          manager_phone?: string | null
          manager_notes?: string | null
          callback_url?: string | null
          assignment_mode?: string
          priority?: string
          media_urls?: Json
          matched_providers_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          professional_id?: string | null
          category_id?: string | null
          title?: string
          description?: string | null
          address?: string | null
          city?: string | null
          status?: string
          quoted_amount?: number | null
          platform_fee_agorot?: number | null
          paid_at?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          pro_lat?: number | null
          pro_lng?: number | null
          pro_location_updated_at?: string | null
          live_tracking_active?: boolean
          cancellation_reason?: string | null
          match_mode?: string
          accepted_at?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          referral_code?: string | null
          review_prompted_at?: string | null
          payment_status?: string | null
          payment_amount_agorot?: number | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          source?: string
          external_system?: string | null
          external_ticket_id?: string | null
          external_ticket_number?: number | null
          external_client_id?: string | null
          external_client_name?: string | null
          building_name?: string | null
          reporter_phone?: string | null
          manager_phone?: string | null
          manager_notes?: string | null
          callback_url?: string | null
          assignment_mode?: string
          priority?: string
          media_urls?: Json
          matched_providers_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'requests_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'requests_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'requests_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'service_categories'
            referencedColumns: ['id']
          },
        ]
      }
      external_reviews: {
        Row: {
          id: string
          professional_id: string
          source: string
          source_url: string | null
          source_review_id: string | null
          rating: number
          review_text: string | null
          reviewer_name: string | null
          review_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          source?: string
          source_url?: string | null
          source_review_id?: string | null
          rating: number
          review_text?: string | null
          reviewer_name?: string | null
          review_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          source?: string
          source_url?: string | null
          source_review_id?: string | null
          rating?: number
          review_text?: string | null
          reviewer_name?: string | null
          review_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'external_reviews_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          request_id: string | null
          professional_id: string | null
          customer_id: string | null
          rating: number
          text: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          request_id?: string | null
          professional_id?: string | null
          customer_id?: string | null
          rating: number
          text?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string | null
          professional_id?: string | null
          customer_id?: string | null
          rating?: number
          text?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'requests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      billing_events: {
        Row: {
          id: string
          professional_id: string
          request_id: string | null
          event_type: string
          amount_agorot: number
          currency: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          request_id?: string | null
          event_type: string
          amount_agorot?: number
          currency?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          request_id?: string | null
          event_type?: string
          amount_agorot?: number
          currency?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'billing_events_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'billing_events_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'requests'
            referencedColumns: ['id']
          },
        ]
      }
      request_candidates: {
        Row: {
          id: string
          request_id: string
          professional_id: string
          rank: number
          status: string
          invited_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          professional_id: string
          rank?: number
          status?: string
          invited_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          professional_id?: string
          rank?: number
          status?: string
          invited_at?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'request_candidates_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'requests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'request_candidates_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      request_events: {
        Row: {
          id: string
          request_id: string
          status: string
          event_type: string
          payload_json: Json
          webhook_delivered: boolean | null
          webhook_http_status: number | null
          webhook_error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          status: string
          event_type?: string
          payload_json?: Json
          webhook_delivered?: boolean | null
          webhook_http_status?: number | null
          webhook_error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          status?: string
          event_type?: string
          payload_json?: Json
          webhook_delivered?: boolean | null
          webhook_http_status?: number | null
          webhook_error?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'request_events_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'requests'
            referencedColumns: ['id']
          },
        ]
      }
      referral_redemptions: {
        Row: {
          id: string
          referral_code: string
          referrer_user_id: string | null
          referred_user_id: string | null
          request_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          referral_code: string
          referrer_user_id?: string | null
          referred_user_id?: string | null
          request_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          referral_code?: string
          referrer_user_id?: string | null
          referred_user_id?: string | null
          request_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'referral_redemptions_referrer_user_id_fkey'
            columns: ['referrer_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referral_redemptions_referred_user_id_fkey'
            columns: ['referred_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referral_redemptions_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'requests'
            referencedColumns: ['id']
          },
        ]
      }
      request_images: {
        Row: {
          id: string
          request_id: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          image_url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'request_images_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'requests'
            referencedColumns: ['id']
          },
        ]
      }
      pro_waitlist: {
        Row: {
          id: string
          full_name: string
          phone: string
          email: string | null
          category: string | null
          city: string | null
          referral_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone: string
          email?: string | null
          category?: string | null
          city?: string | null
          referral_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          email?: string | null
          category?: string | null
          city?: string | null
          referral_code?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          sender_role: string
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          sender_id: string
          sender_role: string
          body: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          sender_id?: string
          sender_role?: string
          body?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'requests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      pro_availability_rules: {
        Row: {
          id: string
          professional_id: string
          day_of_week: number
          start_time: string
          end_time: string
          timezone: string
        }
        Insert: {
          id?: string
          professional_id: string
          day_of_week: number
          start_time: string
          end_time: string
          timezone?: string
        }
        Update: {
          id?: string
          professional_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pro_availability_rules_professional_id_fkey'
            columns: ['professional_id']
            isOneToOne: false
            referencedRelation: 'professionals'
            referencedColumns: ['id']
          },
        ]
      }
      referral_codes: {
        Row: {
          id: string
          user_id: string
          code: string
          reward_type: string
          uses_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          reward_type?: string
          uses_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          reward_type?: string
          uses_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'referral_codes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
