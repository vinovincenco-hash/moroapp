import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Types
export interface Amplifier {
  id: number
  name: string
  strecke_bezeichnung: string | null
  lv_ev_bezeichnung: string | null
  verstaerker_bezeichnung: string | null
  hub: string | null
  node_neu: string | null
  node_alt: string | null
  parents: string | null
  strasse: string | null
  hausnummer: string | null
  location_plz: string | null
  location_ort: string | null
  location_address: string | null
  verstaerker_type: string | null
  regelung: string | null
  fsk_address: string | null
  firmware_version: string | null
  datum: string | null
  in_txnms: string | null
  pegelkonzept_neu: string | null
  bemerkungen: string | null
  created_at: string
  created_by: string | null
}

export interface User {
  id: string
  email: string
  notification_email: string | null
  receive_notifications: boolean
  created_at: string
}
