export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      airbnb_calendars: {
        Row: {
          created_at: string
          ical_url: string
          id: string
          last_sync_status: string | null
          last_synced_at: string | null
          property_id: string
        }
        Insert: {
          created_at?: string
          ical_url: string
          id?: string
          last_sync_status?: string | null
          last_synced_at?: string | null
          property_id: string
        }
        Update: {
          created_at?: string
          ical_url?: string
          id?: string
          last_sync_status?: string | null
          last_synced_at?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "airbnb_calendars_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          created_at: string
          end_date: string
          id: string
          note: string | null
          property_id: string
          reason: Database["public"]["Enums"]["block_reason"]
          start_date: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          note?: string | null
          property_id: string
          reason?: Database["public"]["Enums"]["block_reason"]
          start_date: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          note?: string | null
          property_id?: string
          reason?: Database["public"]["Enums"]["block_reason"]
          start_date?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_dates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_due_now: number
          balance_amount: number
          balance_due_date: string | null
          cancellation_reason: string | null
          check_in: string
          check_out: string
          cleaning_fee: number
          created_at: string
          discount_amount: number
          discount_code: string | null
          extra_guest_fee: number
          guest_email: string
          guest_name: string
          guest_phone: string | null
          guests: number
          id: string
          nightly_subtotal: number
          nights: number
          notes: string | null
          pay_deposit: boolean
          property_id: string
          reference: string
          security_deposit: number
          service_fee: number
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          unit_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_due_now: number
          balance_amount?: number
          balance_due_date?: string | null
          cancellation_reason?: string | null
          check_in: string
          check_out: string
          cleaning_fee?: number
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          extra_guest_fee?: number
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          guests?: number
          id?: string
          nightly_subtotal: number
          nights: number
          notes?: string | null
          pay_deposit?: boolean
          property_id: string
          reference: string
          security_deposit?: number
          service_fee?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          unit_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_due_now?: number
          balance_amount?: number
          balance_due_date?: string | null
          cancellation_reason?: string | null
          check_in?: string
          check_out?: string
          cleaning_fee?: number
          created_at?: string
          discount_amount?: number
          discount_code?: string | null
          extra_guest_fee?: number
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          guests?: number
          id?: string
          nightly_subtotal?: number
          nights?: number
          notes?: string | null
          pay_deposit?: boolean
          property_id?: string
          reference?: string
          security_deposit?: number
          service_fee?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          unit_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          amount_off: number | null
          code: string
          created_at: string
          end_date: string | null
          id: string
          min_amount: number | null
          min_nights: number | null
          percent_off: number | null
          property_id: string | null
          start_date: string | null
          times_used: number
          usage_limit: number | null
        }
        Insert: {
          active?: boolean
          amount_off?: number | null
          code: string
          created_at?: string
          end_date?: string | null
          id?: string
          min_amount?: number | null
          min_nights?: number | null
          percent_off?: number | null
          property_id?: string | null
          start_date?: string | null
          times_used?: number
          usage_limit?: number | null
        }
        Update: {
          active?: boolean
          amount_off?: number | null
          code?: string
          created_at?: string
          end_date?: string | null
          id?: string
          min_amount?: number | null
          min_nights?: number | null
          percent_off?: number | null
          property_id?: string | null
          start_date?: string | null
          times_used?: number
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          booking_id: string | null
          channel: string
          created_at: string
          id: string
          recipient: string
          sent_at: string | null
          status: string
          template: string
        }
        Insert: {
          booking_id?: string | null
          channel: string
          created_at?: string
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string
          template: string
        }
        Update: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          is_deposit: boolean
          paid_at: string | null
          provider: string
          raw_response: Json | null
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          is_deposit?: boolean
          paid_at?: string | null
          provider?: string
          raw_response?: Json | null
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          is_deposit?: boolean
          paid_at?: string | null
          provider?: string
          raw_response?: Json | null
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          label: string | null
          min_nights: number | null
          nightly_price: number | null
          price_modifier_percent: number | null
          property_id: string
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          label?: string | null
          min_nights?: number | null
          nightly_price?: number | null
          price_modifier_percent?: number | null
          property_id: string
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          label?: string | null
          min_nights?: number | null
          nightly_price?: number | null
          price_modifier_percent?: number | null
          property_id?: string
          rule_type?: Database["public"]["Enums"]["pricing_rule_type"]
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          airbnb_listing_url: string | null
          balance_due_days: number
          base_price: number
          bathrooms: number
          bedrooms: number
          cancellation_policy: string | null
          check_in_time: string
          check_out_time: string
          city: string
          cleaning_fee: number
          country: string
          created_at: string
          deposit_fixed: number | null
          deposit_percent: number
          deposit_required: boolean
          description: string | null
          email: string | null
          extra_guest_fee: number
          featured: boolean
          house_rules: string | null
          id: string
          included_guests: number
          latitude: number | null
          longitude: number | null
          max_guests: number
          min_nights: number
          name: string
          phone: string | null
          property_type: string
          security_deposit: number
          service_fee_percent: number
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["property_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          airbnb_listing_url?: string | null
          balance_due_days?: number
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          cancellation_policy?: string | null
          check_in_time?: string
          check_out_time?: string
          city: string
          cleaning_fee?: number
          country?: string
          created_at?: string
          deposit_fixed?: number | null
          deposit_percent?: number
          deposit_required?: boolean
          description?: string | null
          email?: string | null
          extra_guest_fee?: number
          featured?: boolean
          house_rules?: string | null
          id?: string
          included_guests?: number
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          min_nights?: number
          name: string
          phone?: string | null
          property_type?: string
          security_deposit?: number
          service_fee_percent?: number
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          airbnb_listing_url?: string | null
          balance_due_days?: number
          base_price?: number
          bathrooms?: number
          bedrooms?: number
          cancellation_policy?: string | null
          check_in_time?: string
          check_out_time?: string
          city?: string
          cleaning_fee?: number
          country?: string
          created_at?: string
          deposit_fixed?: number | null
          deposit_percent?: number
          deposit_required?: boolean
          description?: string | null
          email?: string | null
          extra_guest_fee?: number
          featured?: boolean
          house_rules?: string | null
          id?: string
          included_guests?: number
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          min_nights?: number
          name?: string
          phone?: string | null
          property_type?: string
          security_deposit?: number
          service_fee_percent?: number
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      property_amenities: {
        Row: {
          amenity_id: string
          property_id: string
        }
        Insert: {
          amenity_id: string
          property_id: string
        }
        Update: {
          amenity_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt_text: string | null
          id: string
          is_primary: boolean
          property_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          id?: string
          is_primary?: boolean
          property_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          id?: string
          is_primary?: boolean
          property_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_units: {
        Row: {
          base_price: number | null
          bedrooms: number | null
          created_at: string
          id: string
          is_bookable: boolean
          max_guests: number | null
          name: string
          property_id: string
        }
        Insert: {
          base_price?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          is_bookable?: boolean
          max_guests?: number | null
          name: string
          property_id: string
        }
        Update: {
          base_price?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          is_bookable?: boolean
          max_guests?: number | null
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          payment_id: string | null
          reason: string | null
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          payment_id?: string | null
          reason?: string | null
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          payment_id?: string | null
          reason?: string | null
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_response: string | null
          approved: boolean
          booking_id: string | null
          comment: string | null
          created_at: string
          guest_name: string
          id: string
          property_id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          approved?: boolean
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          guest_name: string
          id?: string
          property_id: string
          rating: number
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          approved?: boolean
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          guest_name?: string
          id?: string
          property_id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_discount_usage: { Args: { code: string }; Returns: undefined }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "property_manager" | "guest"
      block_reason:
        | "manual"
        | "maintenance"
        | "owner_use"
        | "airbnb"
        | "external"
      booking_status:
        | "pending"
        | "confirmed"
        | "partially_paid"
        | "fully_paid"
        | "cancelled"
        | "refunded"
        | "completed"
      payment_status: "pending" | "success" | "failed" | "refunded"
      pricing_rule_type:
        | "weekend"
        | "seasonal"
        | "date_specific"
        | "promotional"
      property_status: "active" | "inactive" | "draft" | "maintenance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "property_manager", "guest"],
      block_reason: [
        "manual",
        "maintenance",
        "owner_use",
        "airbnb",
        "external",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "partially_paid",
        "fully_paid",
        "cancelled",
        "refunded",
        "completed",
      ],
      payment_status: ["pending", "success", "failed", "refunded"],
      pricing_rule_type: [
        "weekend",
        "seasonal",
        "date_specific",
        "promotional",
      ],
      property_status: ["active", "inactive", "draft", "maintenance"],
    },
  },
} as const
