import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ailvrqwpsjumhsszbnlw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHZycXdwc2p1bWhzc3pibmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODAyMDQsImV4cCI6MjA4Mzg1NjIwNH0.9kUNT1lgKH_rGWIdMD_ZLlyP6TR5YEkIRn1bmXcDqvA' // ← DÁN ANON KEY VÀO ĐÂY

export const supabase = createClient(supabaseUrl, supabaseKey)