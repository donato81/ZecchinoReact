import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'

const url = SUPABASE_URL
const key = SUPABASE_ANON_KEY

if (!url) throw new Error('SUPABASE_URL mancante in .env')
if (!key) throw new Error('SUPABASE_ANON_KEY mancante in .env')

export const supabase = createClient(url, key)