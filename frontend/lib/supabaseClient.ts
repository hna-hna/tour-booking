// file: lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ailvrqwpsjumhsszbnlw.supabase.co' // Thay bằng URL của bạn
const supabaseKey = 'sb_publishable_NLVhT5ZKEzTsQvoEZYY_Zw_WbJA5n3J' // Thay bằng Key anon/public của bạn

export const supabase = createClient(supabaseUrl, supabaseKey)