import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

if (!url) throw new Error('SUPABASE_URL mancante in .env.local')
if (!key) throw new Error('SUPABASE_ANON_KEY mancante in .env.local')

export const supabase = createClient(url, key)