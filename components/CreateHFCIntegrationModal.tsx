import React, { useState, useEffect } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Colors, Shadows } from '../constants/Colors'
import { supabase } from '../lib/supabase'
import PhotoUpload, { PhotoSet, EMPTY_PHOTOS } from './PhotoUpload'
import OrderNumber from './OrderNumber'

interface CreateHFCIntegrationModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

const BUNDESLAENDER = [
  { value: '01', label: '01 – Wien' },
  { value: '02', label: '02 – Niederösterreich' },
  { value: '03', label: '03 – Steiermark' },
  { value: '04', label: '04 – Tirol' },
  { value: '05', label: '05 – Vorarlberg' },
  { value: '06', label: '06 – Kärnten' },
  { value: '08', label: '08 – Oberösterreich' },
]

const PROJEKTANTEN_DEFAULT = [
  'Wetchy Schulz', 'Buttinger', 'Tury', 'Knotzinger', 'Helm', 'Bödi',
  'Pasterniak', 'Konrad R.Figl', 'Manzl Christian', 'Hakan Karakas',
  'Jace', 'Geri Dominguez', 'Daniel'
]

const LOCATIONS_DEFAULT = [
  'vor dem Haus', 'hinter dem Haus', 'Keller', 'Dachboden', 'Tiefgarage', 'Stiegenhaus'
]

// Dropdown Options (from AmpXWeb)
const ATTENUATOR_OPTIONS = Array.from({ length: 64 }, (_, i) => (i * 0.5).toFixed(1))
const EQUALISER_OPTIONS = Array.from({ length: 37 }, (_, i) => (i * 0.5).toFixed(1))
const I_DAEMPFER_OPTIONS = ['0', '0,5', '1,0', '1,5', '2,0', '2,5', '3,0', '3,5', '4,0', '4,5', '5,0', '5,5', '6,0', '6,5', '7,0', '7,5', '8,0', '8,5', '9,0', '9,5', '10,0', '10,5', '11,0', '11,5', '12,0', '12,5', '13,0', '13,5', '14,0', '14,5', '15,0']
const I_ENTZERRER_OPTIONS = I_DAEMPFER_OPTIONS
const PRODUKTIONSDATUM_OPTIONS = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026']
const A3_EINGANG_OPTIONS = ['0', '4/4', '2/12', '5/8', '1/8', '1/6']
const TAB_OPTIONS = ['0', '4/4', '2/12', '5/8', '1/8', '1/6']
const FIRMWARE_OPTIONS = ['2.00', '2.22', '1.06', '2.40', '2.60']
const FSK_261_OPTIONS = ['Ja', 'Nein']

interface FormData {
  // Netzstruktur
  bundesland: string
  gebiet: string
  block: string
  nummer: string
  // Standort
  plz: string
  ort: string
  strasse: string
  hausnummer: string
  // Verstärkertyp
  lv_ev: string
  typ_hfc: string
  typ_gis: string
  bauteilname: string
  // Hardware
  fsk_adresse: string
  firmware_version: string
  fsk_261_geaendert: string
  // Technische Parameter - Pre-stage
  pre_stage_attenuator: string
  pre_stage_equaliser: string
  // Technische Parameter - Inter-stage
  i_daempfer: string
  i_entzerrer: string
  a_pegel: string
  a_rw_pegel: string
  // RW Module
  rw_a1: string
  rw_a2: string
  rw_a3: string
  a3_eingang: string
  tab_value: string
  // Datum
  produktionsdatum: string
  aenderungsdatum: string
  referenz: string
  // Zusatzfelder
  projektant: string
  info_location: string
  kommentar: string
}

const INITIAL: FormData = {
  bundesland: '', gebiet: '', block: '', nummer: '',
  plz: '', ort: '', strasse: '', hausnummer: '',
  lv_ev: '', typ_hfc: '', typ_gis: '', bauteilname: '',
  fsk_adresse: '', firmware_version: '', fsk_261_geaendert: '',
  pre_stage_attenuator: '', pre_stage_equaliser: '',
  i_daempfer: '', i_entzerrer: '', a_pegel: '', a_rw_pegel: '',
  rw_a1: '0', rw_a2: '0', rw_a3: '0', a3_eingang: '', tab_value: '',
  produktionsdatum: '', aenderungsdatum: '', referenz: '0/0/0',
  projektant: '', info_location: '', kommentar: '',
}

export default function CreateHFCIntegrationModal({ visible, onClose, onSuccess }: CreateHFCIntegrationModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [photos, setPhotos] = useState<PhotoSet>(EMPTY_PHOTOS)
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState<string>('')
  const [dbProjektanten, setDbProjektanten] = useState<string[]>(PROJEKTANTEN_DEFAULT)
  const [dbLocations, setDbLocations] = useState<string[]>(LOCATIONS_DEFAULT)
  const [dbTypHfc, setDbTypHfc] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (visible) {
      loadDropdownOptions()
    }
  }, [visible])

  const loadDropdownOptions = async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('hfc_integration')
        .select('projektant, info_location, typ_hfc')

      if (data && data.length > 0) {
        const proj = Array.from(new Set([...PROJEKTANTEN_DEFAULT, ...data.map(d => d.projektant).filter(Boolean)])).sort()
        setDbProjektanten(proj)
        const locs = Array.from(new Set([...LOCATIONS_DEFAULT, ...data.map(d => d.info_location).filter(Boolean)])).sort()
        setDbLocations(locs)
        const typs = Array.from(new Set(data.map(d => d.typ_hfc).filter(Boolean))).sort()
        setDbTypHfc(typs)
      }
    } catch (err) {
      console.error('Error loading options:', err)
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.bundesland) e.bundesland = 'Pflichtfeld'
    if (!form.gebiet) e.gebiet = 'Pflichtfeld'
    if (!form.block) e.block = 'Pflichtfeld'
    if (!form.nummer) e.nummer = 'Pflichtfeld'
    if (!form.plz) e.plz = 'Pflichtfeld'
    if (!form.ort) e.ort = 'Pflichtfeld'
    if (!form.strasse) e.strasse = 'Pflichtfeld'
    if (!form.hausnummer) e.hausnummer = 'Pflichtfeld'
    if (!form.lv_ev) e.lv_ev = 'Pflichtfeld'
    if (!form.typ_hfc) e.typ_hfc = 'Pflichtfeld'
    if (!form.fsk_adresse) e.fsk_adresse = 'Pflichtfeld'
    if (!form.pre_stage_attenuator) e.pre_stage_attenuator = 'Pflichtfeld'
    if (!form.pre_stage_equaliser) e.pre_stage_equaliser = 'Pflichtfeld'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!photos.nahaufnahme || !photos.kastenfoto || !photos.standortansicht) {
      Alert.alert('Fotos fehlen', 'Bitte alle 3 Fotos hinzufügen (Nahaufnahme, Kastenfoto, Standortansicht)')
      return
    }

    if (!validateForm()) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen!')
      return
    }

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const rw_combined = `${form.rw_a1}/${form.rw_a2}/${form.rw_a3}`
      const today = new Date().toLocaleDateString('de-AT')

      const { error } = await supabase.from('hfc_integration').insert({
        // Netzstruktur
        bundesland: form.bundesland,
        gebiet: form.gebiet,
        block: form.block,
        nummer: form.nummer,
        // Standort
        plz: form.plz,
        ort: form.ort,
        strasse: form.strasse,
        hausnummer: form.hausnummer,
        // Verstärkertyp
        lv_ev: form.lv_ev,
        typ_hfc: form.typ_hfc,
        typ_gis: form.typ_gis || null,
        bauteilname: form.bauteilname || null,
        // Hardware
        fsk_adresse: form.fsk_adresse,
        firmware_version: form.firmware_version || null,
        fsk_261_geaendert: form.fsk_261_geaendert || null,
        // Technische Parameter
        pre_stage_attenuator: form.pre_stage_attenuator ? parseFloat(form.pre_stage_attenuator) : null,
        pre_stage_equaliser: form.pre_stage_equaliser ? parseFloat(form.pre_stage_equaliser) : null,
        i_daempfer: form.i_daempfer ? form.i_daempfer.replace(',', '.') : null,
        i_entzerrer: form.i_entzerrer ? form.i_entzerrer.replace(',', '.') : null,
        a_pegel: form.a_pegel || null,
        a_rw_pegel: form.a_rw_pegel || null,
        // RW Module
        rw_a1: form.rw_a1 ? parseFloat(form.rw_a1) : 0,
        rw_a2: form.rw_a2 ? parseFloat(form.rw_a2) : 0,
        rw_a3: form.rw_a3 ? parseFloat(form.rw_a3) : 0,
        rw_combined: rw_combined,
        a3_eingang: form.a3_eingang || null,
        tab_value: form.tab_value || null,
        // Datum
        produktionsdatum: form.produktionsdatum || null,
        aenderungsdatum: form.aenderungsdatum || null,
        referenz: form.referenz || '0/0/0',
        // Zusatzfelder
        projektant: form.projektant || null,
        info_location: form.info_location || null,
        kommentar: form.kommentar
          ? `${form.kommentar}; ${generatedOrderNumber}`
          : generatedOrderNumber,
        // Auto
        techniker: user?.email || null,
        wartungsdatum: today,
      })

      if (error) throw error

      Alert.alert('Erfolg', 'HFC Integration Verstärker erstellt!')
      setForm(INITIAL)
      onSuccess()
      onClose()
    } catch (err: any) {
      Alert.alert('Fehler', err.message || 'Konnte nicht speichern')
    } finally {
      setCreating(false)
    }
  }

  const fieldClass = (key: keyof FormData) =>
    `${errors[key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`

  const isComplete = () => form.bundesland && form.gebiet && form.block && form.nummer && form.lv_ev && form.typ_hfc && form.plz && form.ort && form.strasse && form.hausnummer && form.fsk_adresse && form.pre_stage_attenuator && form.pre_stage_equaliser

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Lädt Optionen...</Text>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🔧 HFC Integration</Text>
            <Text style={styles.headerSubtitle}>0,2/1,2 Umbau — 32 Felder</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ fontSize: 24, color: Colors.white }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* AUFTRAGSNUMMER */}
          <OrderNumber onGenerated={setGeneratedOrderNumber} />

          {/* NETZSTRUKTUR */}
          <SectionHeader icon="🏗" title="Netzstruktur" />
          <Field label="Bundesland *" error={errors.bundesland}>
            <PickerField value={form.bundesland} onChange={(v) => set('bundesland', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {BUNDESLAENDER.map(b => <Picker.Item key={b.value} label={b.label} value={b.value} />)}
            </PickerField>
          </Field>
          <Field label="Gebiet *" error={errors.gebiet}>
            <TextInputField placeholder="z.B. 227" value={form.gebiet} onChangeText={(v) => set('gebiet', v)} />
          </Field>
          <Field label="Block *" error={errors.block}>
            <TextInputField placeholder="z.B. 01" value={form.block} onChangeText={(v) => set('block', v)} />
          </Field>
          <Field label="Nummer *" error={errors.nummer}>
            <TextInputField placeholder="z.B. 01" value={form.nummer} onChangeText={(v) => set('nummer', v)} />
          </Field>

          {/* STANDORT */}
          <SectionHeader icon="📍" title="Standort" />
          <Field label="PLZ *" error={errors.plz}>
            <TextInputField keyboardType="number-pad" placeholder="z.B. 6300" value={form.plz} onChangeText={(v) => set('plz', v)} />
          </Field>
          <Field label="Ort *" error={errors.ort}>
            <TextInputField placeholder="z.B. Wörgl" value={form.ort} onChangeText={(v) => set('ort', v)} />
          </Field>
          <Field label="Straße *" error={errors.strasse}>
            <TextInputField placeholder="z.B. Hauptstraße" value={form.strasse} onChangeText={(v) => set('strasse', v)} />
          </Field>
          <Field label="Hausnummer *" error={errors.hausnummer}>
            <TextInputField placeholder="z.B. 18" value={form.hausnummer} onChangeText={(v) => set('hausnummer', v)} />
          </Field>

          {/* VERSTÄRKERTYP */}
          <SectionHeader icon="⚡" title="Verstärkertyp" />
          <Field label="LV/EV *" error={errors.lv_ev}>
            <PickerField value={form.lv_ev} onChange={(v) => set('lv_ev', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              <Picker.Item label="LV" value="LV" />
              <Picker.Item label="EV" value="EV" />
            </PickerField>
          </Field>
          <Field label="Typ HFC *" error={errors.typ_hfc}>
            <TextInputField placeholder="z.B. EV/DBC1200/1,2 GHZ/1" value={form.typ_hfc} onChangeText={(v) => set('typ_hfc', v)} />
          </Field>
          <Field label="Typ GIS">
            <TextInputField placeholder="z.B. Typ GIS" value={form.typ_gis} onChangeText={(v) => set('typ_gis', v)} />
          </Field>
          <Field label="Bauteilname">
            <TextInputField placeholder="z.B. Bauteilname" value={form.bauteilname} onChangeText={(v) => set('bauteilname', v)} />
          </Field>

          {/* HARDWARE */}
          <SectionHeader icon="🔌" title="Hardware" />
          <Field label="FSK Adresse (MAC) *" error={errors.fsk_adresse}>
            <TextInputField placeholder="z.B. 00:24:1F:0B:67:F4" value={form.fsk_adresse} onChangeText={(v) => set('fsk_adresse', v)} />
          </Field>
          <Field label="Firmware Version">
            <PickerField value={form.firmware_version} onChange={(v) => set('firmware_version', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {FIRMWARE_OPTIONS.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </PickerField>
          </Field>
          <Field label="FSK auf 261 MHZ geändert">
            <PickerField value={form.fsk_261_geaendert} onChange={(v) => set('fsk_261_geaendert', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {FSK_261_OPTIONS.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </PickerField>
          </Field>

          {/* TECH PARAM - PRE-STAGE */}
          <SectionHeader icon="📐" title="Technische Parameter — Pre-stage" />
          <Field label="Pre-stage Attenuator (dB) *" error={errors.pre_stage_attenuator}>
            <PickerField value={form.pre_stage_attenuator} onChange={(v) => set('pre_stage_attenuator', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {ATTENUATOR_OPTIONS.map(v => <Picker.Item key={v} label={`${v} dB`} value={v} />)}
            </PickerField>
          </Field>
          <Field label="Pre-stage Equaliser (dB) *" error={errors.pre_stage_equaliser}>
            <PickerField value={form.pre_stage_equaliser} onChange={(v) => set('pre_stage_equaliser', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {EQUALISER_OPTIONS.map(v => <Picker.Item key={v} label={`${v} dB`} value={v} />)}
            </PickerField>
          </Field>

          {/* TECH PARAM - INTER-STAGE */}
          <SectionHeader icon="📐" title="Technische Parameter — Inter-stage" />
          <Field label="Inter-stage Attenuator (dB)">
            <PickerField value={form.i_daempfer} onChange={(v) => set('i_daempfer', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {I_DAEMPFER_OPTIONS.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </PickerField>
          </Field>
          <Field label="Inter-stage Equaliser (dB)">
            <PickerField value={form.i_entzerrer} onChange={(v) => set('i_entzerrer', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {I_ENTZERRER_OPTIONS.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </PickerField>
          </Field>
          <Field label="A-Pegel">
            <TextInputField placeholder="z.B. 82/82" value={form.a_pegel} onChangeText={(v) => set('a_pegel', v)} />
          </Field>
          <Field label="A-RW Pegel">
            <TextInputField placeholder="z.B. 0" value={form.a_rw_pegel} onChangeText={(v) => set('a_rw_pegel', v)} />
          </Field>

          {/* RW MODULE */}
          <SectionHeader icon="📐" title="RW — Upstream Module" />
          <Field label="RW A1">
            <TextInputField keyboardType="decimal-pad" placeholder="0" value={form.rw_a1} onChangeText={(v) => set('rw_a1', v)} />
          </Field>
          <Field label="RW A2">
            <TextInputField keyboardType="decimal-pad" placeholder="0" value={form.rw_a2} onChangeText={(v) => set('rw_a2', v)} />
          </Field>
          <Field label="RW A3">
            <TextInputField keyboardType="decimal-pad" placeholder="0" value={form.rw_a3} onChangeText={(v) => set('rw_a3', v)} />
          </Field>
          <Field label="A3/Eingang">
            <PickerField value={form.a3_eingang} onChange={(v) => set('a3_eingang', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {A3_EINGANG_OPTIONS.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </PickerField>
          </Field>
          <Field label="TAB">
            <PickerField value={form.tab_value} onChange={(v) => set('tab_value', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {TAB_OPTIONS.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </PickerField>
          </Field>

          {/* DATUM */}
          <SectionHeader icon="📅" title="Datum & Verwaltung" />
          <Field label="Produktionsdatum">
            <PickerField value={form.produktionsdatum} onChange={(v) => set('produktionsdatum', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {PRODUKTIONSDATUM_OPTIONS.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </PickerField>
          </Field>
          <Field label="Änderungsdatum">
            <TextInputField placeholder="tt.mm.jjjj" value={form.aenderungsdatum} onChangeText={(v) => set('aenderungsdatum', v)} />
          </Field>
          <Field label="Referenz">
            <TextInputField placeholder="z.B. 0/0/0" value={form.referenz} onChangeText={(v) => set('referenz', v)} />
          </Field>

          {/* ZUSATZFELDER */}
          <SectionHeader icon="📋" title="Zusatzfelder" />
          <Field label="Projektant">
            <PickerField value={form.projektant} onChange={(v) => set('projektant', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {dbProjektanten.map(p => <Picker.Item key={p} label={p} value={p} />)}
            </PickerField>
          </Field>
          <Field label="Info / Location">
            <PickerField value={form.info_location} onChange={(v) => set('info_location', v)}>
              <Picker.Item label="-- Auswählen --" value="" />
              {dbLocations.map(l => <Picker.Item key={l} label={l} value={l} />)}
            </PickerField>
          </Field>
          <Field label="Kommentar">
            <TextInputField placeholder="Zusätzliche Infos..." value={form.kommentar} onChangeText={(v) => set('kommentar', v)} multiline numberOfLines={3} />
          </Field>

          {/* PHOTOS */}
          <PhotoUpload photos={photos} onChange={setPhotos} required={true} />

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={creating}>
            <Text style={styles.cancelBtnText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, !isComplete() && styles.submitBtnDisabled]}
            onPress={handleSubmit} disabled={!isComplete() || creating}>
            <Text style={styles.submitBtnText}>
              {creating ? '⏳ Erstelle...' : '✅ Erstellen'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// Subcomponents
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={{ marginTop: 20, marginBottom: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.white }}>
        {icon} {title}
      </Text>
    </View>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.white, marginBottom: 8 }}>
        {label}
      </Text>
      {children}
      {error && <Text style={{ fontSize: 12, color: Colors.error, marginTop: 4 }}>⚠️ {error}</Text>}
    </View>
  )
}

function TextInputField({ ...props }: any) {
  return (
    <TextInput
      style={{
        backgroundColor: Colors.bg,
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: Colors.white,
        ...Shadows.light,
      }}
      placeholderTextColor={Colors.textMuted}
      {...props}
    />
  )
}

function PickerField({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: Colors.bg,
      borderWidth: 2,
      borderColor: Colors.border,
      borderRadius: 10,
      overflow: 'hidden',
      ...Shadows.light,
    }}>
      <Picker selectedValue={value} onValueChange={onChange} style={{ height: 50 }}>
        {children}
      </Picker>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 60, backgroundColor: Colors.bg, borderBottomWidth: 2, borderBottomColor: Colors.gold, ...Shadows.medium },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', marginTop: 4 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 2, borderTopColor: Colors.silver300, backgroundColor: Colors.bg },
  cancelBtn: { flex: 1, backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.gold, borderRadius: 10, padding: 14, alignItems: 'center', ...Shadows.light },
  cancelBtnText: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
  submitBtn: { flex: 2, backgroundColor: Colors.gold, borderWidth: 2, borderColor: Colors.goldDark, borderRadius: 10, padding: 14, alignItems: 'center', ...Shadows.gold },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
})
