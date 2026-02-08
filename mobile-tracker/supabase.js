import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vpliofrxoalpihmebhrk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGlvZnJ4b2FscGlobWViaHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDE2OTgsImV4cCI6MjA4NTYxNzY5OH0.8ycqRYouT_6VxS2rSjBgOOQy6SovNQ7Nd1qBoowc-WY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
