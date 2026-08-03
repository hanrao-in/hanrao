export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          ip_address: string | null;
          action: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          ip_address?: string | null;
          action: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          ip_address?: string | null;
          action?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          project_id: string | null;
          project_name: string | null;
          plot_id: string | null;
          plot_number: string | null;
          total_amount: number;
          paid_amount: number;
          status: string;
          booking_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          project_id?: string | null;
          project_name?: string | null;
          plot_id?: string | null;
          plot_number?: string | null;
          total_amount?: number;
          paid_amount?: number;
          status?: string;
          booking_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          project_id?: string | null;
          project_name?: string | null;
          plot_id?: string | null;
          plot_number?: string | null;
          total_amount?: number;
          paid_amount?: number;
          status?: string;
          booking_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_plot_id_fkey";
            columns: ["plot_id"];
            isOneToOne: false;
            referencedRelation: "plots";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          source: string;
          status: string;
          notes: string | null;
          enquiry_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          source?: string;
          status?: string;
          notes?: string | null;
          enquiry_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          source?: string;
          status?: string;
          notes?: string | null;
          enquiry_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_enquiry_id_fkey";
            columns: ["enquiry_id"];
            isOneToOne: false;
            referencedRelation: "enquiries";
            referencedColumns: ["id"];
          },
        ];
      };
      enquiries: {
        Row: {
          budget: string | null;
          created_at: string;
          email: string | null;
          id: string;
          interested_plot_id: string | null;
          lead_status: string;
          message: string | null;
          name: string;
          notes: string | null;
          phone: string;
          project_id: string | null;
          status: string;
        };
        Insert: {
          budget?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          interested_plot_id?: string | null;
          lead_status?: string;
          message?: string | null;
          name: string;
          notes?: string | null;
          phone: string;
          project_id?: string | null;
          status?: string;
        };
        Update: {
          budget?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          interested_plot_id?: string | null;
          lead_status?: string;
          message?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string;
          project_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enquiries_interested_plot_id_fkey";
            columns: ["interested_plot_id"];
            isOneToOne: false;
            referencedRelation: "plots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          parent_id: string | null;
          state: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          parent_id?: string | null;
          state?: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
          state?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          entity_type: string | null;
          entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          type?: string;
          read?: boolean;
          entity_type?: string | null;
          entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
          entity_type?: string | null;
          entity_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      plots: {
        Row: {
          area_sqyd: number;
          availability: string;
          created_at: string;
          facing: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          plot_number: string;
          plot_type: string;
          price_per_sqyd: number;
          project_id: string;
          images: string[] | null;
        };
        Insert: {
          area_sqyd: number;
          availability?: string;
          created_at?: string;
          facing?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          plot_number: string;
          plot_type?: string;
          price_per_sqyd: number;
          project_id: string;
          images?: string[] | null;
        };
        Update: {
          area_sqyd?: number;
          availability?: string;
          created_at?: string;
          facing?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          plot_number?: string;
          plot_type?: string;
          price_per_sqyd?: number;
          project_id?: string;
          images?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "plots_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          amenities: string[];
          approval_types: string[];
          brochure_url: string | null;
          city: string;
          created_at: string;
          description: string;
          district: string;
          featured: boolean;
          gallery_urls: string[];
          id: string;
          location_id: string | null;
          map_embed_url: string | null;
          map_lat: number | null;
          map_lng: number | null;
          name: string;
          nearby: Json;
          slug: string;
          state: string;
          status: string;
          thumbnail_url: string;
          village: string;
          video_url: string | null;
          video_urls: string[] | null;
          updated_at: string | null;
          updated_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          amenities?: string[];
          approval_types?: string[];
          brochure_url?: string | null;
          city?: string;
          created_at?: string;
          description?: string;
          district?: string;
          featured?: boolean;
          gallery_urls?: string[];
          id?: string;
          location_id?: string | null;
          map_embed_url?: string | null;
          map_lat?: number | null;
          map_lng?: number | null;
          name: string;
          nearby?: Json;
          slug: string;
          state?: string;
          status?: string;
          thumbnail_url?: string;
          village?: string;
          video_url?: string | null;
          video_urls?: string[] | null;
          updated_at?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          amenities?: string[];
          approval_types?: string[];
          brochure_url?: string | null;
          city?: string;
          created_at?: string;
          description?: string;
          district?: string;
          featured?: boolean;
          gallery_urls?: string[];
          id?: string;
          location_id?: string | null;
          map_embed_url?: string | null;
          map_lat?: number | null;
          map_lng?: number | null;
          name?: string;
          nearby?: Json;
          slug?: string;
          state?: string;
          status?: string;
          thumbnail_url?: string;
          village?: string;
          video_url?: string | null;
          video_urls?: string[] | null;
          updated_at?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      site_visits: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          message: string | null;
          name: string;
          phone: string;
          preferred_date: string;
          preferred_time: string;
          project_id: string | null;
          project_name: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string | null;
          name: string;
          phone: string;
          preferred_date: string;
          preferred_time: string;
          project_id?: string | null;
          project_name?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string | null;
          name?: string;
          phone?: string;
          preferred_date?: string;
          preferred_time?: string;
          project_id?: string | null;
          project_name?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_visits_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          url: string;
          bucket: string;
          file_path: string;
          size_bytes: number | null;
          content_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          bucket: string;
          file_path: string;
          size_bytes?: number | null;
          content_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          bucket?: string;
          file_path?: string;
          size_bytes?: number | null;
          content_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          ip_address: string;
          attempts: number;
          reset_at: string;
        };
        Insert: {
          ip_address: string;
          attempts?: number;
          reset_at: string;
        };
        Update: {
          ip_address?: string;
          attempts?: number;
          reset_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const;
