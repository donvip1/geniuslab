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
      access_pins: {
        Row: {
          batch_id: string
          created_at: string | null
          created_by: string
          exam_category_id: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          pin_code: string
          used_at: string | null
          used_by: string | null
          used_by_email: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          created_by: string
          exam_category_id?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          pin_code: string
          used_at?: string | null
          used_by?: string | null
          used_by_email?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          created_by?: string
          exam_category_id?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          pin_code?: string
          used_at?: string | null
          used_by?: string | null
          used_by_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_pins_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "pin_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_pins_exam_category_id_fkey"
            columns: ["exam_category_id"]
            isOneToOne: false
            referencedRelation: "exam_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clicks: {
        Row: {
          advertisement_id: string
          created_at: string
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          advertisement_id: string
          created_at?: string
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          advertisement_id?: string
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_advertisement_id_fkey"
            columns: ["advertisement_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_credentials: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          click_count: number
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cached_api_questions: {
        Row: {
          correct_answer_index: number
          created_at: string
          exam_level: string
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          subject: string
          year: string | null
        }
        Insert: {
          correct_answer_index?: number
          created_at?: string
          exam_level: string
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          subject: string
          year?: string | null
        }
        Update: {
          correct_answer_index?: number
          created_at?: string
          exam_level?: string
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          subject?: string
          year?: string | null
        }
        Relationships: []
      }
      document_uploads: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          processing_status: string
          questions_generated: number | null
          storage_path: string
          subject_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          processing_status?: string
          questions_generated?: number | null
          storage_path: string
          subject_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          processing_status?: string
          questions_generated?: number | null
          storage_path?: string
          subject_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_uploads_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          score: number
          subject_id: string
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          score: number
          subject_id: string
          time_taken_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          score?: number
          subject_id?: string
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      exam_categories: {
        Row: {
          access_mode: string
          created_at: string
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          access_mode?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          access_mode?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_settings: {
        Row: {
          active_semester: string
          allow_semester_selection: boolean
          created_at: string
          exam_duration_minutes: number
          exam_end_time: string | null
          exam_start_time: string | null
          id: string
          is_exam_mode: boolean
          is_exams_locked: boolean | null
          is_pin_required: boolean | null
          lock_message: string | null
          manual_payment_enabled: boolean
          payment_account_holder: string | null
          payment_account_number: string | null
          payment_amount: number | null
          payment_bank_name: string | null
          payment_contact: string | null
          trial_duration_days: number
          trial_max_questions: number
          trials_enabled: boolean
          updated_at: string
        }
        Insert: {
          active_semester?: string
          allow_semester_selection?: boolean
          created_at?: string
          exam_duration_minutes?: number
          exam_end_time?: string | null
          exam_start_time?: string | null
          id?: string
          is_exam_mode?: boolean
          is_exams_locked?: boolean | null
          is_pin_required?: boolean | null
          lock_message?: string | null
          manual_payment_enabled?: boolean
          payment_account_holder?: string | null
          payment_account_number?: string | null
          payment_amount?: number | null
          payment_bank_name?: string | null
          payment_contact?: string | null
          trial_duration_days?: number
          trial_max_questions?: number
          trials_enabled?: boolean
          updated_at?: string
        }
        Update: {
          active_semester?: string
          allow_semester_selection?: boolean
          created_at?: string
          exam_duration_minutes?: number
          exam_end_time?: string | null
          exam_start_time?: string | null
          id?: string
          is_exam_mode?: boolean
          is_exams_locked?: boolean | null
          is_pin_required?: boolean | null
          lock_message?: string | null
          manual_payment_enabled?: boolean
          payment_account_holder?: string | null
          payment_account_number?: string | null
          payment_amount?: number | null
          payment_bank_name?: string | null
          payment_contact?: string | null
          trial_duration_days?: number
          trial_max_questions?: number
          trials_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      nigerian_universities: {
        Row: {
          abbreviation: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string | null
          type: string
        }
        Insert: {
          abbreviation?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state?: string | null
          type?: string
        }
        Update: {
          abbreviation?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string | null
          type?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          exam_category_id: string
          id: string
          paystack_reference: string | null
          reference: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          exam_category_id: string
          id?: string
          paystack_reference?: string | null
          reference: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          exam_category_id?: string
          id?: string
          paystack_reference?: string | null
          reference?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_exam_category_id_fkey"
            columns: ["exam_category_id"]
            isOneToOne: false
            referencedRelation: "exam_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_batches: {
        Row: {
          batch_name: string | null
          created_at: string | null
          created_by: string
          id: string
          pin_count: number
        }
        Insert: {
          batch_name?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          pin_count: number
        }
        Update: {
          batch_name?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          pin_count?: number
        }
        Relationships: []
      }
      pin_generator_settings: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          created_by: string | null
          explanation: string | null
          id: string
          is_active: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          contributors: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          exam_category_id: string | null
          id: string
          is_active: boolean
          level: string | null
          name: string
          semester: string | null
          updated_at: string
        }
        Insert: {
          contributors?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          exam_category_id?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          name: string
          semester?: string | null
          updated_at?: string
        }
        Update: {
          contributors?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          exam_category_id?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          name?: string
          semester?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_exam_category_id_fkey"
            columns: ["exam_category_id"]
            isOneToOne: false
            referencedRelation: "exam_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          exam_category_id: string
          expires_at: string
          id: string
          payment_reference: string | null
          plan_type: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_category_id: string
          expires_at: string
          id?: string
          payment_reference?: string | null
          plan_type?: string
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_category_id?: string
          expires_at?: string
          id?: string
          payment_reference?: string | null
          plan_type?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_exam_category_id_fkey"
            columns: ["exam_category_id"]
            isOneToOne: false
            referencedRelation: "exam_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      success_stories: {
        Row: {
          color_theme: string
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          program: string
          quote: string
          quote_author: string | null
          review: string
          student_name: string
          updated_at: string
        }
        Insert: {
          color_theme?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          program: string
          quote: string
          quote_author?: string | null
          review: string
          student_name: string
          updated_at?: string
        }
        Update: {
          color_theme?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          program?: string
          quote?: string
          quote_author?: string | null
          review?: string
          student_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_experts: {
        Row: {
          alias: string | null
          created_at: string
          description: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          title: string
          updated_at: string
        }
        Insert: {
          alias?: string | null
          created_at?: string
          description: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          title: string
          updated_at?: string
        }
        Update: {
          alias?: string | null
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_restrictions: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          reason: string | null
          restricted_by: string
          restriction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          restricted_by: string
          restriction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          restricted_by?: string
          restriction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_trials: {
        Row: {
          created_at: string
          exam_category_id: string
          id: string
          last_question_date: string | null
          questions_used_today: number
          total_questions_used: number
          trial_start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_category_id: string
          id?: string
          last_question_date?: string | null
          questions_used_today?: number
          total_questions_used?: number
          trial_start_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_category_id?: string
          id?: string
          last_question_date?: string | null
          questions_used_today?: number
          total_questions_used?: number
          trial_start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trials_exam_category_id_fkey"
            columns: ["exam_category_id"]
            isOneToOne: false
            referencedRelation: "exam_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      questions_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_active: boolean | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question_text: string | null
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_text?: string | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_text?: string | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_category_leaderboard: {
        Args: { p_category_id: string; p_mode?: string }
        Returns: {
          created_at: string
          full_name: string
          percentage: number
          rank: number
          score: number
          subject_name: string
          total_questions: number
          user_id: string
          username: string
        }[]
      }
      get_email_by_username: { Args: { p_username: string }; Returns: string }
      get_leaderboard: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          percentage: number
          rank: number
          score: number
          subject_name: string
          total_questions: number
          user_id: string
          username: string
        }[]
      }
      get_user_rank: {
        Args: { p_user_id: string }
        Returns: {
          percentage: number
          rank: number
          score: number
          total_questions: number
        }[]
      }
      get_user_rank_by_category: {
        Args: { p_category_id: string; p_mode?: string; p_user_id: string }
        Returns: {
          percentage: number
          rank: number
          score: number
          total_questions: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_click: { Args: { ad_id: string }; Returns: undefined }
      set_pin_generator_password: {
        Args: { new_password: string; old_password?: string }
        Returns: boolean
      }
      verify_pin_generator_password: {
        Args: { input_password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
