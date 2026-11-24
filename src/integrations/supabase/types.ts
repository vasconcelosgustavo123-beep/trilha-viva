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
      app_settings: {
        Row: {
          accent_color: string
          id: number
          primary_color: string
        }
        Insert: {
          accent_color?: string
          id?: number
          primary_color?: string
        }
        Update: {
          accent_color?: string
          id?: number
          primary_color?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          archived: boolean
          body: string
          created_at: string
          id: string
          target_id: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          body: string
          created_at?: string
          id?: string
          target_id: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          body?: string
          created_at?: string
          id?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      dm_requests: {
        Row: {
          created_at: string
          from_id: string
          id: string
          room_id: string | null
          status: string
          to_id: string
        }
        Insert: {
          created_at?: string
          from_id?: string
          id?: string
          room_id?: string | null
          status?: string
          to_id: string
        }
        Update: {
          created_at?: string
          from_id?: string
          id?: string
          room_id?: string | null
          status?: string
          to_id?: string
        }
        Relationships: []
      }
      library_pdfs: {
        Row: {
          category: string
          created_at: string
          created_by: string
          file_url: string
          id: string
          storage_path: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string
          file_url: string
          id?: string
          storage_path: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          file_url?: string
          id?: string
          storage_path?: string
          title?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          caption: string | null
          id: string
          pdf_url: string | null
          position: number
          subject_id: string
          theory: string
          title: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          id?: string
          pdf_url?: string | null
          position?: number
          subject_id: string
          theory?: string
          title: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          id?: string
          pdf_url?: string | null
          position?: number
          subject_id?: string
          theory?: string
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          room_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string
          avatar_emoji: string
          avatar_url: string | null
          banned: boolean
          created_at: string
          display_name: string
          id: string
          points: number
        }
        Insert: {
          avatar_color?: string
          avatar_emoji?: string
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          display_name?: string
          id: string
          points?: number
        }
        Update: {
          avatar_color?: string
          avatar_emoji?: string
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          display_name?: string
          id?: string
          points?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_index: number
          id: string
          image_url: string | null
          lesson_id: string
          options: Json
          position: number
          prompt: string
        }
        Insert: {
          correct_index?: number
          id?: string
          image_url?: string | null
          lesson_id: string
          options?: Json
          position?: number
          prompt: string
        }
        Update: {
          correct_index?: number
          id?: string
          image_url?: string | null
          lesson_id?: string
          options?: Json
          position?: number
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          score: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          emoji: string
          target_id: string
          user_id: string
        }
        Insert: {
          emoji: string
          target_id: string
          user_id?: string
        }
        Update: {
          emoji?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id?: string
          status?: string
          target_id: string
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          room_id: string
          user_id: string
        }
        Insert: {
          room_id: string
          user_id: string
        }
        Update: {
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          icon: string
          id: string
          name: string
          position: number
        }
        Insert: {
          color?: string
          icon?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          color?: string
          icon?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      user_quizzes: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          id: string
          owner_id: string
          published: boolean
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          published?: boolean
          questions?: Json
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          published?: boolean
          questions?: Json
          title?: string
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
      admin_questions: {
        Args: { _lesson: string }
        Returns: {
          correct_index: number
          id: string
          image_url: string | null
          lesson_id: string
          options: Json
          position: number
          prompt: string
        }[]
        SetofOptions: {
          from: "*"
          to: "questions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_set_ban: {
        Args: { _banned: boolean; _user: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_banned: { Args: { _uid: string }; Returns: boolean }
      is_room_member: {
        Args: { _room: string; _uid: string }
        Returns: boolean
      }
      respond_dm: { Args: { _accept: boolean; _req: string }; Returns: string }
      submit_quiz: {
        Args: { _answers: number[]; _lesson: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
