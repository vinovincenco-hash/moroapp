import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Colors, Shadows } from '../constants/Colors'
import { supabase, DatabaseType } from '../lib/supabase'
import CreateHFCIntegrationModal from './CreateHFCIntegrationModal'
import CreateFTTXModal from './CreateFTTXModal'
import PhotoUpload, { PhotoSet, EMPTY_PHOTOS } from './PhotoUpload'
import OrderNumber from './OrderNumber'

interface CreateAmplifierModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  dbType?: DatabaseType
}

interface CascadingOptions {
  hubs: string[]
  nodes_neu: string[]
  plzs: string[]
  orte: string[]
  strassen: string[]
  verstaerker_bezeichnungen: string[]
}

const EMPTY_OPTIONS: CascadingOptions = {
  hubs: [], nodes_neu: [], plzs: [], orte: [], strassen: [], verstaerker_bezeichnungen: [],
}

export default function CreateAmplifierModal({ visible, onClose, onSuccess, dbType = 'hfc_862' }: CreateAmplifierModalProps) {
  // Route to correct modal based on database type
  if (dbType === 'hfc_integration') {
    return <CreateHFCIntegrationModal visible={visible} onClose={onClose} onSuccess={onSuccess} />
  }
  
  if (dbType === 'fttx') {
    return <CreateFTTXModal visible={visible} onClose={onClose} onSuccess={onSuccess} />
  }

  // HFC 862 (default) - original modal below
  const [formData, setFormData] = useState({
    hub: '',
    node_neu: '',
    verstaerker_bezeichnung: '',
    parents: '',
    strasse: '',
    hausnummer: '',
    location_plz: '',
    location_ort: '',
    verstaerker_type: '',
    fsk_address: '',
    firmware_version: '',
    node_alt: '',
    strecke_bezeichnung: '',
    lv_ev_bezeichnung: '',
    bemerkungen: '',
  })

  const [options, setOptions] = useState<CascadingOptions>(EMPTY_OPTIONS)
  const [creating, setCreating] = useState(false)
  const [photos, setPhotos] = useState<PhotoSet>(EMPTY_PHOTOS)
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [customFields, setCustomFields] = useState<Record<string, boolean>>({})

  // Which field is in "new entry" mode
  const [newEntryField, setNewEntryField] = useState<string | null>(null)
  const [newEntryValue, setNewEntryValue] = useState('')

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (visible) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchCascadingOptions()
      }, 200)
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [visible, formData.hub, formData.node_neu, formData.location_plz, formData.location_ort, formData.strasse, formData.verstaerker_bezeichnung])

  const fetchCascadingOptions = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('amplifiers')
        .select('hub, node_neu, location_plz, location_ort, strasse, verstaerker_bezeichnung')

      if (formData.hub && !customFields.hub) query = query.eq('hub', formData.hub)
      if (formData.node_neu && !customFields.node_neu) query = query.eq('node_neu', formData.node_neu)
      if (formData.location_plz && !customFields.location_plz) query = query.eq('location_plz', formData.location_plz)
      if (formData.location_ort && !customFields.location_ort) query = query.eq('location_ort', formData.location_ort)
      if (formData.strasse && !customFields.strasse) query = query.eq('strasse', formData.strasse)
      if (formData.verstaerker_bezeichnung && !customFields.verstaerker_bezeichnung) query = query.eq('verstaerker_bezeichnung', formData.verstaerker_bezeichnung)

      let allData: any[] = []
      let from = 0
      const batchSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await query.range(from, from + batchSize - 1)
        if (error || !data || data.length === 0) { hasMore = false; break }
        allData = [...allData, ...data]
        from += batchSize
        if (data.length < batchSize) hasMore = false
      }

      const unique = (arr: any[], key: string) =>
        Array.from(new Set(arr.map(d => d[key]).filter(Boolean))).sort() as string[]

      setOptions({
        hubs: unique(allData, 'hub'),
        nodes_neu: unique(allData, 'node_neu'),
        plzs: unique(allData, 'location_plz'),
        orte: unique(allData, 'location_ort'),
        strassen: unique(allData, 'strasse'),
        verstaerker_bezeichnungen: unique(allData, 'verstaerker_bezeichnung'),
      })
    } catch (err) {
      console.error('Error fetching options:', err)
    } finally {
      setLoading(false)
    }
  }, [formData.hub, formData.node_neu, formData.location_plz, formData.location_ort, formData.strasse, formData.verstaerker_bezeichnung, customFields])

  const handlePickerChange = (field: string, value: string) => {
    if (value === '__NEW__') {
      setNewEntryField(field)
      setNewEntryValue('')
      return
    }
    setFormData({ ...formData, [field]: value })
    setCustomFields({ ...customFields, [field]: false })
  }

  const confirmNewEntry = () => {
    if (newEntryField && newEntryValue.trim()) {
      setFormData({ ...formData, [newEntryField]: newEntryValue.trim() })
      setCustomFields({ ...customFields, [newEntryField]: true })
    }
    setNewEntryField(null)
    setNewEntryValue('')
  }

  const clearCustomField = (field: string) => {
    setFormData({ ...formData, [field]: '' })
    setCustomFields({ ...customFields, [field]: false })
  }

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const canSubmit = () => {
    return formData.hub && formData.node_neu && formData.verstaerker_bezeichnung &&
      formData.strasse && formData.hausnummer && formData.location_plz &&
      formData.location_ort && formData.fsk_address
  }

  const handleSubmit = async () => {
    if (!photos.nahaufnahme || !photos.kastenfoto || !photos.standortansicht) {
      Alert.alert('Fotos fehlen', 'Bitte alle 3 Fotos hinzufügen (Nahaufnahme, Kastenfoto, Standortansicht)')
      return
    }

    if (!canSubmit()) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder (*) ausfüllen!')
      return
    }

    setCreating(true)
    try {
      const location_address = [formData.strasse, formData.hausnummer, formData.location_plz, formData.location_ort].filter(Boolean).join(' ')
      let name = formData.verstaerker_bezeichnung || `Neu_${Date.now()}`
      const datum = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('amplifiers')
        .insert({
          name,
          strecke_bezeichnung: formData.strecke_bezeichnung || null,
          lv_ev_bezeichnung: formData.lv_ev_bezeichnung || null,
          verstaerker_bezeichnung: formData.verstaerker_bezeichnung || null,
          hub: formData.hub,
          node_neu: formData.node_neu || null,
          node_alt: formData.node_alt || null,
          parents: formData.parents || null,
          strasse: formData.strasse || null,
          hausnummer: formData.hausnummer || null,
          location_plz: formData.location_plz || null,
          location_ort: formData.location_ort || null,
          location_address: location_address || null,
          verstaerker_type: formData.verstaerker_type || null,
          fsk_address: formData.fsk_address || null,
          firmware_version: formData.firmware_version || null,
          datum,
          bemerkungen: formData.bemerkungen
            ? `${formData.bemerkungen}; ${generatedOrderNumber}`
            : generatedOrderNumber,
        })
        .select()
        .single()

      if (error) throw error

      // Send email notification
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-amplifier-notification`
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ amplifier: data }),
        })
      } catch (emailError) {
        console.error('Email notification failed:', emailError)
      }

      Alert.alert('Erfolg!', `Verstärker ${name} wurde erstellt!`)

      // Reset
      setFormData({
        hub: '', node_neu: '', verstaerker_bezeichnung: '', parents: '',
        strasse: '', hausnummer: '', location_plz: '', location_ort: '',
        verstaerker_type: '', fsk_address: '', firmware_version: '',
        node_alt: '', strecke_bezeichnung: '', lv_ev_bezeichnung: '', bemerkungen: '',
      })
      setCustomFields({})
      onSuccess()
      onClose()
    } catch (err: any) {
      Alert.alert('Fehler', err.message || 'Verstärker konnte nicht erstellt werden')
    } finally {
      setCreating(false)
    }
  }

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      hub: 'HUB', node_neu: 'Node', location_plz: 'PLZ',
      location_ort: 'Ort', strasse: 'Straße', verstaerker_bezeichnung: 'Verstärkerbezeichnung',
    }
    return labels[field] || field
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>➕ Neuer Verstärker</Text>
          <Text style={styles.headerSubtitle}>
            <Text style={styles.required}>*</Text> = Pflichtfeld
            {loading ? '  ⏳ Laden...' : ''}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

          {/* AUFTRAGSNUMMER */}
          <OrderNumber onGenerated={setGeneratedOrderNumber} />

          {/* Cascading Fields */}
          <CascadingField
            label="HUB" required
            value={formData.hub}
            options={options.hubs}
            isCustom={customFields.hub}
            onChange={(v) => handlePickerChange('hub', v)}
            onClear={() => clearCustomField('hub')}
          />

          <CascadingField
            label="Node" required
            value={formData.node_neu}
            options={options.nodes_neu}
            isCustom={customFields.node_neu}
            onChange={(v) => handlePickerChange('node_neu', v)}
            onClear={() => clearCustomField('node_neu')}
          />

          <CascadingField
            label="PLZ" required
            value={formData.location_plz}
            options={options.plzs}
            isCustom={customFields.location_plz}
            onChange={(v) => handlePickerChange('location_plz', v)}
            onClear={() => clearCustomField('location_plz')}
          />

          <CascadingField
            label="Ort" required
            value={formData.location_ort}
            options={options.orte}
            isCustom={customFields.location_ort}
            onChange={(v) => handlePickerChange('location_ort', v)}
            onClear={() => clearCustomField('location_ort')}
          />

          <CascadingField
            label="Straße" required
            value={formData.strasse}
            options={options.strassen}
            isCustom={customFields.strasse}
            onChange={(v) => handlePickerChange('strasse', v)}
            onClear={() => clearCustomField('strasse')}
          />

          <CascadingField
            label="Verstärkerbezeichnung" required
            value={formData.verstaerker_bezeichnung}
            options={options.verstaerker_bezeichnungen}
            isCustom={customFields.verstaerker_bezeichnung}
            onChange={(v) => handlePickerChange('verstaerker_bezeichnung', v)}
            onClear={() => clearCustomField('verstaerker_bezeichnung')}
          />

          {/* Regular Fields */}
          <View style={styles.field}>
            <Text style={styles.label}>Hnr <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.hausnummer}
              onChangeText={(v) => updateField('hausnummer', v)} placeholder="z.Bsp. 123"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>FSK <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.fsk_address}
              onChangeText={(v) => updateField('fsk_address', v)} placeholder="z.Bsp. 1234567"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Parents</Text>
            <TextInput style={styles.input} value={formData.parents}
              onChangeText={(v) => updateField('parents', v)} placeholder="übergeordneter Verstärker"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Verstärkertype</Text>
            <TextInput style={styles.input} value={formData.verstaerker_type}
              onChangeText={(v) => updateField('verstaerker_type', v)} placeholder="z.B. DBC 1200"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Firmware</Text>
            <TextInput style={styles.input} value={formData.firmware_version}
              onChangeText={(v) => updateField('firmware_version', v)} placeholder="z.B. V2.22"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bemerkung</Text>
            <TextInput style={[styles.input, styles.textArea]} value={formData.bemerkungen}
              onChangeText={(v) => updateField('bemerkungen', v)} placeholder="Zusätzliche Informationen..."
              placeholderTextColor={Colors.silver600} multiline numberOfLines={4} />
          </View>

          {/* PHOTOS */}
          <PhotoUpload photos={photos} onChange={setPhotos} required={true} />

          {!canSubmit() && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ Pflichtfelder (*): HUB, Node, Verstärkerbezeichnung, Straße, Hnr, PLZ, Ort, FSK
              </Text>
            </View>
          )}
        </ScrollView>

        {/* New Entry Dialog */}
        {newEntryField && (
          <View style={styles.newEntryOverlay}>
            <View style={styles.newEntryModal}>
              <Text style={styles.newEntryTitle}>➕ {getFieldLabel(newEntryField)} erstellen</Text>
              <TextInput
                style={styles.newEntryInput}
                value={newEntryValue}
                onChangeText={setNewEntryValue}
                placeholder={`Neuen Wert eingeben...`}
                placeholderTextColor={Colors.silver600}
                autoFocus
              />
              <View style={styles.newEntryButtons}>
                <TouchableOpacity style={styles.cancelBtn}
                  onPress={() => { setNewEntryField(null); setNewEntryValue('') }}>
                  <Text style={styles.cancelBtnText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, !newEntryValue.trim() && styles.btnDisabled]}
                  onPress={confirmNewEntry} disabled={!newEntryValue.trim()}>
                  <Text style={styles.confirmBtnText}>✅ Übernehmen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={creating}>
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit() || creating) && styles.submitButtonDisabled]}
            onPress={handleSubmit} disabled={!canSubmit() || creating}>
            <Text style={styles.submitButtonText}>
              {creating ? '⏳ Erstelle...' : '✅ Erstellen'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// --- Cascading Field Component ---

function CascadingField({ label, required, value, options, isCustom, onChange, onClear }: {
  label: string; required?: boolean; value: string; options: string[]
  isCustom?: boolean; onChange: (v: string) => void; onClear: () => void
}) {
  const hasValue = !!value
  const isNewValue = isCustom && hasValue

  return (
    <View style={styles.field}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Text style={[styles.label, hasValue && { color: '#1d4ed8' }, { marginBottom: 0 }]}>
          {label} {required && <Text style={styles.required}>*</Text>}
          {hasValue && ' ●'}
        </Text>
        {isNewValue && (
          <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#15803d' }}>NEU</Text>
          </View>
        )}
        <Text style={{ fontSize: 11, color: '#9ca3af' }}>({options.length})</Text>
      </View>

      {isNewValue ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.input, { flex: 1, backgroundColor: '#f0fdf4', borderColor: '#4ade80' }]}>
            <Text style={{ fontSize: 16, color: Colors.black, fontWeight: '600' }}>{value}</Text>
          </View>
          <TouchableOpacity onPress={onClear}
            style={{ backgroundColor: Colors.silver100, borderWidth: 2, borderColor: Colors.silver300, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.silver700 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.pickerContainer, hasValue && { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }]}>
          <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
            <Picker.Item label={`-- ${label} auswählen --`} value="" />
            {options.map((opt) => (
              <Picker.Item key={opt} label={opt} value={opt} />
            ))}
            <Picker.Item label={`➕ Neu erstellen`} value="__NEW__" />
          </Picker>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { padding: 20, paddingTop: 60, backgroundColor: Colors.white, borderBottomWidth: 2, borderBottomColor: Colors.black, ...Shadows.medium },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.black, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: Colors.silver700, fontWeight: '600' },
  required: { color: Colors.error || '#ef4444', fontWeight: 'bold' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 8 },
  input: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.silver300, borderRadius: 10, padding: 14, fontSize: 16, color: Colors.black, ...Shadows.light },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.silver300, borderRadius: 10, overflow: 'hidden', ...Shadows.light },
  picker: { height: 50 },
  warning: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b', borderRadius: 10, padding: 16, marginTop: 10 },
  warningText: { fontSize: 14, color: '#92400e', fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 2, borderTopColor: Colors.silver300, backgroundColor: Colors.white },
  cancelButton: { flex: 1, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.black, borderRadius: 10, padding: 16, alignItems: 'center', ...Shadows.light },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.black },
  submitButton: { flex: 2, backgroundColor: Colors.gold, borderWidth: 2, borderColor: Colors.goldDark, borderRadius: 10, padding: 16, alignItems: 'center', ...Shadows.gold },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.black },
  // New Entry Dialog
  newEntryOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  newEntryModal: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.black, borderRadius: 16, padding: 24, width: '85%', ...Shadows.medium },
  newEntryTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.black, marginBottom: 16 },
  newEntryInput: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.silver300, borderRadius: 10, padding: 14, fontSize: 16, color: Colors.black, marginBottom: 16, ...Shadows.light },
  newEntryButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: Colors.silver100, borderWidth: 2, borderColor: Colors.silver300, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: 'bold', color: Colors.silver700 },
  confirmBtn: { flex: 2, backgroundColor: Colors.gold, borderWidth: 2, borderColor: Colors.goldDark, borderRadius: 10, padding: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: 'bold', color: Colors.black },
  btnDisabled: { opacity: 0.5 },
})
