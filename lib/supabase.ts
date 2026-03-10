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

// Database Types
export type DatabaseType = 'hfc_862' | 'hfc_integration' | 'fttx'

// HFC 862 (Original)
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

// HFC Integration Database
export interface HFCIntegration {
  id: number
  bundesland: string
  gebiet: string
  block: string
  nummer: string
  lv_ev: 'LV' | 'EV'
  typ_hfc: string
  plz: string
  ort: string
  strasse: string
  hausnummer: string
  fsk_adresse: string
  pre_stage_attenuator: number | null
  pre_stage_equaliser: number | null
  rw_a1: number | null
  rw_a2: number | null
  rw_a3: number | null
  referenz: string | null
  projektant: string | null
  info_location: string | null
  techniker: string | null
  wartungsdatum: string | null
  created_at: string
  updated_at: string
}

// FTTX Database
export interface FTTX {
  id: number
  bundesland: string
  gebiet: string
  block: string
  nummer: string
  hec_nummer: string | null
  mac_adresse: string | null
  typ: 'ONB' | 'ONH' | 'OLT'
  plz: string
  ort: string
  strasse: string
  hausnummer: string
  projektant: string | null
  referenz: string | null
  info_location: string | null
  techniker: string | null
  wartungsdatum: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  notification_email: string | null
  receive_notifications: boolean
  created_at: string
}

// Helper to get table name
export const getTableName = (dbType: DatabaseType): string => {
  switch (dbType) {
    case 'hfc_862':
      return 'amplifiers'
    case 'hfc_integration':
      return 'hfc_integration'
    case 'fttx':
      return 'fttx'
  }
}

// Helper to get display name
export const getDisplayName = (dbType: DatabaseType): string => {
  switch (dbType) {
    case 'hfc_862':
      return '📡 HFC 862'
    case 'hfc_integration':
      return '🔧 HFC Integration'
    case 'fttx':
      return '💡 FTTX'
  }
}
