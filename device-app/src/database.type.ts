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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string | null
          created_at: string | null
          end_time: string
          host_user_id: string | null
          id: string
          notes: string | null
          organization_id: string
          pass_code: string
          purpose: string
          start_time: string
          status: string | null
          updated_at: string | null
          visitor_id: string | null
        }
        Insert: {
          appointment_date: string
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          end_time: string
          host_user_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          pass_code: string
          purpose: string
          start_time: string
          status?: string | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          appointment_date?: string
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          end_time?: string
          host_user_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          pass_code?: string
          purpose?: string
          start_time?: string
          status?: string | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          branch_id: string | null
          clock_in: string
          clock_out: string | null
          confidence_score: number | null
          created_at: string | null
          date: string
          department_id: string | null
          device_id: string | null
          face_match_score: number | null
          id: string
          organization_id: string | null
          photo_url: string | null
          shift_id: string | null
          status: string | null
          synced: boolean | null
          updated_at: string | null
          user_id: string | null
          verification_method: string | null
        }
        Insert: {
          branch_id?: string | null
          clock_in: string
          clock_out?: string | null
          confidence_score?: number | null
          created_at?: string | null
          date: string
          department_id?: string | null
          device_id?: string | null
          face_match_score?: number | null
          id?: string
          organization_id?: string | null
          photo_url?: string | null
          shift_id?: string | null
          status?: string | null
          synced?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verification_method?: string | null
        }
        Update: {
          branch_id?: string | null
          clock_in?: string
          clock_out?: string | null
          confidence_score?: number | null
          created_at?: string | null
          date?: string
          department_id?: string | null
          device_id?: string | null
          face_match_score?: number | null
          id?: string
          organization_id?: string | null
          photo_url?: string | null
          shift_id?: string | null
          status?: string | null
          synced?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          attended_students: number | null
          course_code: string | null
          created_at: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          session_date: string
          start_time: string
          status: string | null
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          attended_students?: number | null
          course_code?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          session_date: string
          start_time: string
          status?: string | null
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          attended_students?: number | null
          course_code?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          session_date?: string
          start_time?: string
          status?: string | null
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_appointments: {
        Row: {
          appointment_date: string
          assigned_staff_id: string | null
          branch_id: string | null
          created_at: string | null
          customer_id: string
          end_time: string
          id: string
          notes: string | null
          organization_id: string
          service_type: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          assigned_staff_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          customer_id: string
          end_time: string
          id?: string
          notes?: string | null
          organization_id: string
          service_type?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          assigned_staff_id?: string | null
          branch_id?: string | null
          created_at?: string | null
          customer_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          organization_id?: string
          service_type?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_appointments_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          customer_type: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          phone: string
          photo_url: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          customer_type?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          phone: string
          photo_url?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          customer_type?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          phone?: string
          photo_url?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          branch_id: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          branch_id: string | null
          created_at: string | null
          device_code: string
          device_ip: unknown
          device_name: string
          device_token: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          last_seen: string | null
          location_note: string | null
          organization_id: string | null
          pairing_code: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          device_code: string
          device_ip?: unknown
          device_name: string
          device_token?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          location_note?: string | null
          organization_id?: string | null
          pairing_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          device_code?: string
          device_ip?: unknown
          device_name?: string
          device_token?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          location_note?: string | null
          organization_id?: string | null
          pairing_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_notifications: {
        Row: {
          created_at: string | null
          document_type: string
          expiry_date: string
          id: string
          message_sent: string | null
          notification_sent_at: string | null
          notification_type: string | null
          sent_to_phone: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          expiry_date: string
          id?: string
          message_sent?: string | null
          notification_sent_at?: string | null
          notification_type?: string | null
          sent_to_phone?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          expiry_date?: string
          id?: string
          message_sent?: string | null
          notification_sent_at?: string | null
          notification_type?: string | null
          sent_to_phone?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_notifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          meta: Json | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          meta?: Json | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          meta?: Json | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      face_enrollments: {
        Row: {
          capture_device: string | null
          created_at: string | null
          embedding: string
          enrollment_location: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          organization_id: string | null
          photo_url: string
          quality_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          capture_device?: string | null
          created_at?: string | null
          embedding: string
          enrollment_location?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          organization_id?: string | null
          photo_url: string
          quality_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          capture_device?: string | null
          created_at?: string | null
          embedding?: string
          enrollment_location?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          organization_id?: string | null
          photo_url?: string
          quality_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "face_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      face_match_logs: {
        Row: {
          capture_device: string | null
          confidence_score: number
          created_at: string | null
          device_id: string | null
          id: string
          is_match: boolean
          organization_id: string | null
          photo_url: string | null
          threshold_score: number
          user_id: string | null
          verification_result: string | null
        }
        Insert: {
          capture_device?: string | null
          confidence_score: number
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_match: boolean
          organization_id?: string | null
          photo_url?: string | null
          threshold_score: number
          user_id?: string | null
          verification_result?: string | null
        }
        Update: {
          capture_device?: string | null
          confidence_score?: number
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_match?: boolean
          organization_id?: string | null
          photo_url?: string | null
          threshold_score?: number
          user_id?: string | null
          verification_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "face_match_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_match_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_match_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_date: string
          id: string
          leave_type: string
          organization_id: string
          reason: string
          rejection_reason: string | null
          start_date: string
          status: string | null
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          leave_type: string
          organization_id: string
          reason: string
          rejection_reason?: string | null
          start_date: string
          status?: string | null
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          organization_id?: string
          reason?: string
          rejection_reason?: string | null
          start_date?: string
          status?: string | null
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          heading: number | null
          id: number
          lat: number
          lng: number
          speed: number | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          heading?: number | null
          id?: number
          lat: number
          lng: number
          speed?: number | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          heading?: number | null
          id?: number
          lat?: number
          lng?: number
          speed?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          attachments: string[] | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          id: string
          mechanic_name: string | null
          mileage_at_service: number | null
          next_service_date: string | null
          notes: string | null
          organization_id: string
          service_center: string | null
          service_date: string
          service_type: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          attachments?: string[] | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          mechanic_name?: string | null
          mileage_at_service?: number | null
          next_service_date?: string | null
          notes?: string | null
          organization_id: string
          service_center?: string | null
          service_date: string
          service_type: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          attachments?: string[] | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          mechanic_name?: string | null
          mileage_at_service?: number | null
          next_service_date?: string | null
          notes?: string | null
          organization_id?: string
          service_center?: string | null
          service_date?: string
          service_type?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string | null
          id: string
          trigger_type: string | null
          type: string
          url: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          trigger_type?: string | null
          type: string
          url: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          trigger_type?: string | null
          type?: string
          url?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          branding: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          subdomain: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          branding?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          subdomain?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          branding?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          subdomain?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      screen_pairs: {
        Row: {
          connected_at: string | null
          created_at: string | null
          device_id: string | null
          disconnected_at: string | null
          id: string
          last_activity: string | null
          pair_code: string
          screen_name: string | null
          status: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          device_id?: string | null
          disconnected_at?: string | null
          id?: string
          last_activity?: string | null
          pair_code: string
          screen_name?: string | null
          status?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          device_id?: string | null
          disconnected_at?: string | null
          id?: string
          last_activity?: string | null
          pair_code?: string
          screen_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screen_pairs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          branch_id: string | null
          code: string
          created_at: string | null
          end_time: string
          grace_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          code: string
          created_at?: string | null
          end_time: string
          grace_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          code?: string
          created_at?: string | null
          end_time?: string
          grace_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          created_at: string | null
          data: Json
          device_id: string | null
          error_message: string | null
          id: string
          operation: string
          organization_id: string | null
          processed: boolean | null
          processed_at: string | null
          record_id: string
          retry_count: number | null
          table_name: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          device_id?: string | null
          error_message?: string | null
          id?: string
          operation: string
          organization_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          record_id: string
          retry_count?: number | null
          table_name: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          device_id?: string | null
          error_message?: string | null
          id?: string
          operation?: string
          organization_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          record_id?: string
          retry_count?: number | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checkpoints: {
        Row: {
          actual_time: string | null
          checkpoint_name: string
          created_at: string | null
          expected_time: string | null
          id: string
          location: string | null
          notes: string | null
          status: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          actual_time?: string | null
          checkpoint_name: string
          created_at?: string | null
          expected_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          actual_time?: string | null
          checkpoint_name?: string
          created_at?: string | null
          expected_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_checkpoints_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "vehicle_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          branch_id: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          enrollment_status: string | null
          face_embedding: string | null
          face_embedding_stored: boolean | null
          face_enrolled_at: string | null
          face_photo_url: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          phone: string | null
          staff_id: string | null
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          enrollment_status?: string | null
          face_embedding?: string | null
          face_embedding_stored?: boolean | null
          face_enrolled_at?: string | null
          face_photo_url?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          staff_id?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          enrollment_status?: string | null
          face_embedding?: string | null
          face_embedding_stored?: boolean | null
          face_enrolled_at?: string | null
          face_photo_url?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          staff_id?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_trips: {
        Row: {
          actual_duration_minutes: number | null
          actual_end_time: string | null
          actual_start_time: string | null
          branch_id: string | null
          created_at: string | null
          distance_km: number | null
          driver_check_in_time: string | null
          driver_check_out_time: string | null
          driver_id: string
          end_location: string | null
          estimated_duration_minutes: number | null
          google_maps_link: string | null
          id: string
          organization_id: string
          purpose: string | null
          scheduled_end_time: string | null
          scheduled_start_time: string | null
          security_check_in_time: string | null
          security_check_out_time: string | null
          security_notes: string | null
          start_location: string | null
          status: string | null
          trip_name: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_end_time?: string | null
          actual_start_time?: string | null
          branch_id?: string | null
          created_at?: string | null
          distance_km?: number | null
          driver_check_in_time?: string | null
          driver_check_out_time?: string | null
          driver_id: string
          end_location?: string | null
          estimated_duration_minutes?: number | null
          google_maps_link?: string | null
          id?: string
          organization_id: string
          purpose?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          security_check_in_time?: string | null
          security_check_out_time?: string | null
          security_notes?: string | null
          start_location?: string | null
          status?: string | null
          trip_name: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_end_time?: string | null
          actual_start_time?: string | null
          branch_id?: string | null
          created_at?: string | null
          distance_km?: number | null
          driver_check_in_time?: string | null
          driver_check_out_time?: string | null
          driver_id?: string
          end_location?: string | null
          estimated_duration_minutes?: number | null
          google_maps_link?: string | null
          id?: string
          organization_id?: string
          purpose?: string | null
          scheduled_end_time?: string | null
          scheduled_start_time?: string | null
          security_check_in_time?: string | null
          security_check_out_time?: string | null
          security_notes?: string | null
          start_location?: string | null
          status?: string | null
          trip_name?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_trips_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          branch_id: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          current_driver_id: string | null
          fuel_type: string | null
          id: string
          inspection_expiry: string | null
          insurance_expiry: string | null
          last_service_date: string | null
          license_plate: string
          make: string | null
          mileage: number | null
          model: string | null
          next_service_date: string | null
          organization_id: string
          permit_expiry: string | null
          registration_expiry: string | null
          road_tax_expiry: string | null
          status: string | null
          transmission: string | null
          updated_at: string | null
          updated_by: string | null
          vehicle_name: string
          vehicle_type: string
          vin: string | null
          year: number | null
        }
        Insert: {
          branch_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          current_driver_id?: string | null
          fuel_type?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          last_service_date?: string | null
          license_plate: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          next_service_date?: string | null
          organization_id: string
          permit_expiry?: string | null
          registration_expiry?: string | null
          road_tax_expiry?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_name: string
          vehicle_type?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          branch_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          current_driver_id?: string | null
          fuel_type?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          last_service_date?: string | null
          license_plate?: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          next_service_date?: string | null
          organization_id?: string
          permit_expiry?: string | null
          registration_expiry?: string | null
          road_tax_expiry?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vehicle_name?: string
          vehicle_type?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_current_driver_id_fkey"
            columns: ["current_driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          id_type: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_attendance_summary: {
        Row: {
          absent_count: number | null
          avg_confidence: number | null
          date: string | null
          late_count: number | null
          organization_id: string | null
          organization_name: string | null
          present_count: number | null
          total_staff: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_activity_log: {
        Row: {
          active_days: number | null
          branch_name: string | null
          device_code: string | null
          device_name: string | null
          device_status: string | null
          first_activity: string | null
          last_activity: string | null
          last_seen: string | null
          organization_id: string | null
          total_scans: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance_history: {
        Row: {
          absent_days: number | null
          branch_name: string | null
          department_name: string | null
          first_clock_in: string | null
          full_name: string | null
          last_clock_out: string | null
          late_days: number | null
          organization_id: string | null
          present_days: number | null
          staff_id: string | null
          total_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_document_expiry: {
        Row: {
          current_driver_id: string | null
          days_until_expiry: number | null
          document_type: string | null
          driver_name: string | null
          driver_phone: string | null
          expiry_date: string | null
          license_plate: string | null
          vehicle_id: string | null
          vehicle_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_document_expiry_notifications: { Args: never; Returns: undefined }
      generate_device_token: { Args: never; Returns: string }
      generate_pairing_code: { Args: never; Returns: string }
      generate_pass_code: { Args: never; Returns: string }
      match_users_by_face: {
        Args: {
          filter_organization_id: string
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          face_photo_url: string
          full_name: string
          id: string
          similarity: number
          staff_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
