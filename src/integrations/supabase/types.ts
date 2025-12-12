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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agrochemicals_used: {
        Row: {
          application_order: number
          created_at: string
          dose: number
          id: string
          job_id: string
          notes: string | null
          product_name: string
          unit: string
        }
        Insert: {
          application_order?: number
          created_at?: string
          dose: number
          id?: string
          job_id: string
          notes?: string | null
          product_name: string
          unit: string
        }
        Update: {
          application_order?: number
          created_at?: string
          dose?: number
          id?: string
          job_id?: string
          notes?: string | null
          product_name?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrochemicals_used_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contacto_principal: string | null
          created_at: string
          cuit: string | null
          id: string
          idcliente: string | null
          name: string
          notes: string | null
          otro_contacto_1: string | null
          otro_contacto_2: string | null
          phone: string | null
          puesto: string | null
          razon_social: string | null
          telefono_1: string | null
          telefono_2: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contacto_principal?: string | null
          created_at?: string
          cuit?: string | null
          id?: string
          idcliente?: string | null
          name: string
          notes?: string | null
          otro_contacto_1?: string | null
          otro_contacto_2?: string | null
          phone?: string | null
          puesto?: string | null
          razon_social?: string | null
          telefono_1?: string | null
          telefono_2?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contacto_principal?: string | null
          created_at?: string
          cuit?: string | null
          id?: string
          idcliente?: string | null
          name?: string
          notes?: string | null
          otro_contacto_1?: string | null
          otro_contacto_2?: string | null
          phone?: string | null
          puesto?: string | null
          razon_social?: string | null
          telefono_1?: string | null
          telefono_2?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farms: {
        Row: {
          area_hectares: number | null
          client_id: string
          created_at: string
          cultivo: string | null
          id: string
          localidad: string | null
          location: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          area_hectares?: number | null
          client_id: string
          created_at?: string
          cultivo?: string | null
          id?: string
          localidad?: string | null
          location?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          area_hectares?: number | null
          client_id?: string
          created_at?: string
          cultivo?: string | null
          id?: string
          localidad?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_dose: string | null
          client_id: string
          created_at: string
          cuadro: string | null
          cultivo: string | null
          description: string | null
          due_date: string | null
          farm_id: string
          id: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"]
          superficie_aplicada_has: number | null
          superficie_teorica_has: number | null
          task: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_dose?: string | null
          client_id: string
          created_at?: string
          cuadro?: string | null
          cultivo?: string | null
          description?: string | null
          due_date?: string | null
          farm_id: string
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          superficie_aplicada_has?: number | null
          superficie_teorica_has?: number | null
          task?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_dose?: string | null
          client_id?: string
          created_at?: string
          cuadro?: string | null
          cultivo?: string | null
          description?: string | null
          due_date?: string | null
          farm_id?: string
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          superficie_aplicada_has?: number | null
          superficie_teorica_has?: number | null
          task?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_status: "pending" | "in_progress" | "done"
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
      job_status: ["pending", "in_progress", "done"],
    },
  },
} as const
