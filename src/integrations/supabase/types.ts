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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          amount_paid: number
          balance_due: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          details: Json
          fulfillment: Database["public"]["Enums"]["booking_status"]
          id: string
          lines: Json
          payment_status: Database["public"]["Enums"]["payment_status"]
          reference: string
          total: number
          type: Database["public"]["Enums"]["booking_type"]
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          details?: Json
          fulfillment?: Database["public"]["Enums"]["booking_status"]
          id?: string
          lines?: Json
          payment_status?: Database["public"]["Enums"]["payment_status"]
          reference: string
          total?: number
          type: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          details?: Json
          fulfillment?: Database["public"]["Enums"]["booking_status"]
          id?: string
          lines?: Json
          payment_status?: Database["public"]["Enums"]["payment_status"]
          reference?: string
          total?: number
          type?: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
        }
        Relationships: []
      }
      branding: {
        Row: {
          brand_name: string
          id: string
          primary_accent: string
          tagline: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          id?: string
          primary_accent: string
          tagline: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          id?: string
          primary_accent?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          order: number
          published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          order?: number
          published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          order?: number
          published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      halls: {
        Row: {
          amenities: string[]
          capacity: number
          created_at: string
          hotel_id: string
          id: string
          image: string
          name: string
          price_per_hour: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          capacity?: number
          created_at?: string
          hotel_id: string
          id?: string
          image?: string
          name: string
          price_per_hour?: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          capacity?: number
          created_at?: string
          hotel_id?: string
          id?: string
          image?: string
          name?: string
          price_per_hour?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "halls_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          amenities: string[]
          created_at: string
          id: string
          image: string
          location: string
          name: string
          rating: number
          tagline: string
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          created_at?: string
          id?: string
          image?: string
          location: string
          name: string
          rating?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          created_at?: string
          id?: string
          image?: string
          location?: string
          name?: string
          rating?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          at: string
          handled_by: string | null
          id: string
          item_id: string
          location: string | null
          note: string
          qty: number
          reference: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          at?: string
          handled_by?: string | null
          id?: string
          item_id: string
          location?: string | null
          note?: string
          qty: number
          reference?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          at?: string
          handled_by?: string | null
          id?: string
          item_id?: string
          location?: string | null
          note?: string
          qty?: number
          reference?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string
          hotel_id: string
          id: string
          items: string[]
          kind: Database["public"]["Enums"]["package_kind"]
          name: string
          price_per_person: number
          time_slots: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          hotel_id: string
          id?: string
          items?: string[]
          kind?: Database["public"]["Enums"]["package_kind"]
          name: string
          price_per_person?: number
          time_slots?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          hotel_id?: string
          id?: string
          items?: string[]
          kind?: Database["public"]["Enums"]["package_kind"]
          name?: string
          price_per_person?: number
          time_slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rentals: {
        Row: {
          available: boolean
          category: string
          created_at: string
          deposit_pct: number
          description: string
          id: string
          image: string
          location: string
          name: string
          ownership: Database["public"]["Enums"]["rental_ownership"]
          price_per_day: number
          stock_available: number
          stock_total: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category: string
          created_at?: string
          deposit_pct?: number
          description?: string
          id?: string
          image?: string
          location?: string
          name: string
          ownership?: Database["public"]["Enums"]["rental_ownership"]
          price_per_day?: number
          stock_available?: number
          stock_total?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category?: string
          created_at?: string
          deposit_pct?: number
          description?: string
          id?: string
          image?: string
          location?: string
          name?: string
          ownership?: Database["public"]["Enums"]["rental_ownership"]
          price_per_day?: number
          stock_available?: number
          stock_total?: number
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          id: string
          name: string
          tabs: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tabs?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tabs?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          description: string
          hotel_id: string
          id: string
          image: string
          price: number
          type: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string
          hotel_id: string
          id?: string
          image?: string
          price?: number
          type: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string
          hotel_id?: string
          id?: string
          image?: string
          price?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_arrangements: {
        Row: {
          created_at: string
          description: string
          id: string
          image: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data: Json
          id?: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      bootstrap_owner: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      lookup_bookings: {
        Args: { _query: string }
        Returns: {
          amount_paid: number
          balance_due: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          details: Json
          fulfillment: Database["public"]["Enums"]["booking_status"]
          id: string
          lines: Json
          payment_status: Database["public"]["Enums"]["payment_status"]
          reference: string
          total: number
          type: Database["public"]["Enums"]["booking_type"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      lookup_customer: {
        Args: { _email: string }
        Returns: {
          email: string
          name: string
          phone: string
        }[]
      }
      owner_exists: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "staff"
      booking_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "completed"
        | "cancelled"
      booking_type: "reservation" | "rental"
      movement_type: "out" | "in" | "damaged" | "restock"
      package_kind: "coffee" | "food"
      payment_status: "unpaid" | "deposit" | "paid" | "refunded"
      rental_ownership: "internal" | "vendor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["owner", "admin", "staff"],
      booking_status: [
        "pending",
        "confirmed",
        "processing",
        "completed",
        "cancelled",
      ],
      booking_type: ["reservation", "rental"],
      movement_type: ["out", "in", "damaged", "restock"],
      package_kind: ["coffee", "food"],
      payment_status: ["unpaid", "deposit", "paid", "refunded"],
      rental_ownership: ["internal", "vendor"],
    },
  },
} as const
