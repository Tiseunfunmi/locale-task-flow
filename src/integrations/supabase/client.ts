import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kpruinjujqzmsxfpntpo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcnVpbmp1anF6bXN4ZnBudHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NDM4NDAsImV4cCI6MjA5OTExOTg0MH0.uDuuCAqNczTzTGTYIgNULf6aSbsvQ-em5WvF595gL6I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)