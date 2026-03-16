import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Colors, Shadows } from '../constants/Colors'
import { supabase, Amplifier, DatabaseType, getTableName } from '../lib/supabase'

// Detail Fields for HFC 862
const DETAIL_FIELDS_HFC862 = [
  { key: 'name', label: 'Name' },
  { key: 'hub', label: 'HUB' },
  { key: 'node_neu', label: 'Node' },
  { key: 'node_alt', label: 'Node Alt' },
  { key: 'strecke_bezeichnung', label: 'Strecke Bez. Alt' },
  { key: 'lv_ev_bezeichnung', label: 'LV/EV Bez. Alt' },
  { key: 'verstaerker_bezeichnung', label: 'Verstärkerbezeichnung' },
  { key: 'parents', label: 'Parents' },
  { key: 'strasse', label: 'Straße' },
  { key: 'hausnummer', label: 'Hnr' },
  { key: 'location_plz', label: 'PLZ' },
  { key: 'location_ort', label: 'Ort' },
  { key: 'verstaerker_type', label: 'Verstärkertype' },
  { key: 'regelung', label: 'Regelung' },
  { key: 'fsk_address', label: 'FSK' },
  { key: 'firmware_version', label: 'Firmware' },
  { key: 'datum', label: 'Datum' },
  { key: 'bemerkungen', label: 'Bemerkungen' },
]

// Detail Fields for HFC Integration
const DETAIL_FIELDS_HFC_INTEGRATION = [
  { key: 'bundesland', label: 'Bundesland' },
  { key: 'gebiet', label: 'Gebiet' },
  { key: 'block', label: 'Block' },
  { key: 'nummer', label: 'Nummer' },
  { key: 'plz', label: 'PLZ' },
  { key: 'ort', label: 'Ort' },
  { key: 'strasse', label: 'Straße' },
  { key: 'hausnummer', label: 'Hausnummer' },
  { key: 'lv_ev', label: 'LV/EV' },
  { key: 'typ_hfc', label: 'Typ HFC' },
  { key: 'fsk_adresse', label: 'FSK Adresse' },
  { key: 'pre_stage_attenuator', label: 'Pre-stage Attenuator' },
  { key: 'pre_stage_equaliser', label: 'Pre-stage Equaliser' },
  { key: 'rw_combined', label: 'RW Module' },
  { key: 'kommentar', label: 'Kommentar' },
]

// Detail Fields for FTTX
const DETAIL_FIELDS_FTTX = [
  { key: 'hec_nummer', label: 'HEC#' },
  { key: 'name', label: 'Name' },
  { key: 'type_code', label: 'Type Code' },
  { key: 'mac_adresse', label: 'MAC Adresse' },
  { key: 'address_line_1', label: 'Adresse Zeile 1' },
  { key: 'address_line_2', label: 'Adresse Zeile 2' },
  { key: 'comment_1', label: 'Kommentar' },
]

interface SearchScreenProps {
  onClose: () => void
  currentDB?: DatabaseType
}

interface DynamicOptions {
  hubs: string[]
  nodes_neu: string[]
  plzs: string[]
  orte: string[]
  strassen: string[]
  types: string[]
  firmwares: string[]
  parents: string[]
}

const EMPTY_OPTIONS: DynamicOptions = {
  hubs: [], nodes_neu: [], plzs: [], orte: [],
  strassen: [], types: [], firmwares: [], parents: [],
}

const getDetailFieldsForDB = (dbType: DatabaseType) => {
  switch (dbType) {
    case 'hfc_integration':
      return DETAIL_FIELDS_HFC_INTEGRATION
    case 'fttx':
      return DETAIL_FIELDS_FTTX
    case 'hfc_862':
    default:
      return DETAIL_FIELDS_HFC862
  }
}

export default function SearchScreen({ onClose, currentDB = 'hfc_862' }: SearchScreenProps) {
  const [filters, setFilters] = useState<any>({})
  const [options, setOptions] = useState<DynamicOptions>(EMPTY_OPTIONS)
  const [results, setResults] = useState<any[]>([])
  const [resultCount, setResultCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [selectedAmp, setSelectedAmp] = useState<any | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const detailFields = getDetailFieldsForDB(currentDB)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchDynamicOptions(filters)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [filters])

  const fetchDynamicOptions = useCallback(async (currentFilters: any) => {
    setLoading(true)
    try {
      const tableName = getTableName(currentDB)
      let query = supabase
        .from(tableName)
        .select('*')

      // Apply filters based on DB type
      if (currentDB === 'hfc_862') {
        if (currentFilters.hub) query = query.eq('hub', currentFilters.hub)
        if (currentFilters.node_neu) query = query.eq('node_neu', currentFilters.node_neu)
        if (currentFilters.plz) query = query.eq('location_plz', currentFilters.plz)
        if (currentFilters.ort) query = query.eq('location_ort', currentFilters.ort)
        if (currentFilters.strasse) query = query.eq('strasse', currentFilters.strasse)
        if (currentFilters.type) query = query.eq('verstaerker_type', currentFilters.type)
        if (currentFilters.firmware) query = query.eq('firmware_version', currentFilters.firmware)
        if (currentFilters.parents) query = query.eq('parents', currentFilters.parents)
      } else if (currentDB === 'hfc_integration') {
        if (currentFilters.bundesland) query = query.eq('bundesland', currentFilters.bundesland)
        if (currentFilters.gebiet) query = query.eq('gebiet', currentFilters.gebiet)
        if (currentFilters.block) query = query.eq('block', currentFilters.block)
        if (currentFilters.plz) query = query.eq('plz', currentFilters.plz)
        if (currentFilters.ort) query = query.eq('ort', currentFilters.ort)
        if (currentFilters.lv_ev) query = query.eq('lv_ev', currentFilters.lv_ev)
      } else if (currentDB === 'fttx') {
        if (currentFilters.name) query = query.ilike('name', `%${currentFilters.name}%`)
        if (currentFilters.hec) query = query.ilike('hec_nummer', `%${currentFilters.hec}%`)
      }

      let allData: any[] = []
      let from = 0
      const batchSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await query.range(from, from + batchSize - 1)
        if (error || !data || data.length === 0) {
          hasMore = false
          break
        }
        allData = [...allData, ...data]
        from += batchSize
        if (data.length < batchSize) hasMore = false
      }

      setResultCount(allData.length)
      setResults(allData.slice(0, 50)) // Show first 50

      const unique = (arr: any[], key: string) =>
        Array.from(new Set(arr.map(d => d[key]).filter(Boolean))).sort() as string[]

      // Set options based on DB type
      if (currentDB === 'hfc_862') {
        setOptions({
          hubs: unique(allData, 'hub'),
          nodes_neu: unique(allData, 'node_neu'),
          plzs: unique(allData, 'location_plz'),
          orte: unique(allData, 'location_ort'),
          strassen: unique(allData, 'strasse'),
          types: unique(allData, 'verstaerker_type'),
          firmwares: unique(allData, 'firmware_version'),
          parents: unique(allData, 'parents'),
        })
      } else if (currentDB === 'hfc_integration') {
        setOptions({
          hubs: unique(allData, 'bundesland'),
          nodes_neu: unique(allData, 'gebiet'),
          plzs: unique(allData, 'plz'),
          orte: unique(allData, 'ort'),
          strassen: unique(allData, 'strasse'),
          types: unique(allData, 'lv_ev'),
          firmwares: [],
          parents: [],
        })
      } else if (currentDB === 'fttx') {
        setOptions({
          hubs: [],
          nodes_neu: unique(allData, 'name'),
          plzs: [],
          orte: [],
          strassen: [],
          types: unique(allData, 'type_code'),
          firmwares: [],
          parents: [],
        })
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentDB])

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters }
    if (value === '') {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    setFilters(newFilters)
  }

  const handleReset = () => {
    setFilters({})
  }

  const openDetail = (amp: any) => {
    setSelectedAmp(amp)
    setEditMode(false)
    const ed: Record<string, string> = {}
    detailFields.forEach(f => { ed[f.key] = (amp as any)[f.key] || '' })
    setEditData(ed)
  }

  const handleSave = async () => {
    if (!selectedAmp) return
    setSaving(true)
    const tableName = getTableName(currentDB)
    const { error } = await supabase
      .from(tableName)
      .update(editData)
      .eq('id', selectedAmp.id)

    if (error) {
      Alert.alert('Fehler', error.message)
    } else {
      Alert.alert('Erfolg', 'Gespeichert!')
      setEditMode(false)
      setSelectedAmp(null)
      fetchDynamicOptions(filters) // refresh results
    }
    setSaving(false)
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🔍 Suche</Text>
          <Text style={styles.headerSubtitle}>
            {loading ? '⏳ Aktualisiere...' : `📊 ${resultCount.toLocaleString()} Ergebnisse`}
            {activeFilterCount > 0 && ` • ${activeFilterCount} Filter`}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Filters - Show based on current DB */}
        <View style={styles.filtersContainer}>
          {currentDB === 'hfc_862' && (
            <>
              <CascadingPicker label="HUB" value={filters.hub} options={options.hubs} placeholder="Alle HUBs" onChange={(v) => updateFilter('hub', v)} />
              <CascadingPicker label="Node" value={filters.node_neu} options={options.nodes_neu} placeholder="Alle Nodes" onChange={(v) => updateFilter('node_neu', v)} />
              <CascadingPicker label="PLZ" value={filters.plz} options={options.plzs} placeholder="Alle PLZs" onChange={(v) => updateFilter('plz', v)} />
              <CascadingPicker label="Ort" value={filters.ort} options={options.orte} placeholder="Alle Orte" onChange={(v) => updateFilter('ort', v)} />
              <CascadingPicker label="Straße" value={filters.strasse} options={options.strassen} placeholder="Alle Straßen" onChange={(v) => updateFilter('strasse', v)} />
              <CascadingPicker label="Verstärkertype" value={filters.type} options={options.types} placeholder="Alle Typen" onChange={(v) => updateFilter('type', v)} />
              <CascadingPicker label="Firmware" value={filters.firmware} options={options.firmwares} placeholder="Alle Firmwares" onChange={(v) => updateFilter('firmware', v)} />
              <CascadingPicker label="Parents" value={filters.parents} options={options.parents} placeholder="Alle Parents" onChange={(v) => updateFilter('parents', v)} />
            </>
          )}
          {currentDB === 'hfc_integration' && (
            <>
              <CascadingPicker label="Bundesland" value={filters.bundesland} options={options.hubs} placeholder="Alle Bundesländer" onChange={(v) => updateFilter('bundesland', v)} />
              <CascadingPicker label="Gebiet" value={filters.gebiet} options={options.nodes_neu} placeholder="Alle Gebiete" onChange={(v) => updateFilter('gebiet', v)} />
              <CascadingPicker label="Block" value={filters.block} options={[]} placeholder="Block" onChange={(v) => updateFilter('block', v)} />
              <CascadingPicker label="PLZ" value={filters.plz} options={options.plzs} placeholder="Alle PLZs" onChange={(v) => updateFilter('plz', v)} />
              <CascadingPicker label="Ort" value={filters.ort} options={options.orte} placeholder="Alle Orte" onChange={(v) => updateFilter('ort', v)} />
              <CascadingPicker label="LV/EV" value={filters.lv_ev} options={options.types} placeholder="LV oder EV" onChange={(v) => updateFilter('lv_ev', v)} />
            </>
          )}
          {currentDB === 'fttx' && (
            <>
              <CascadingPicker label="Name" value={filters.name} options={options.nodes_neu} placeholder="Alle Namen" onChange={(v) => updateFilter('name', v)} />
              <CascadingPicker label="Type Code" value={filters.type} options={options.types} placeholder="Alle Type Codes" onChange={(v) => updateFilter('type', v)} />
            </>
          )}
        </View>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>🗑️ Filter zurücksetzen</Text>
          </TouchableOpacity>
        )}

        {/* Results */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Ergebnisse ({resultCount.toLocaleString()})
            {resultCount > 50 && ' — erste 50 angezeigt'}
          </Text>
          {results.map((amp) => (
            <TouchableOpacity key={amp.id} style={styles.resultCard} onPress={() => openDetail(amp)} activeOpacity={0.7}>
              {currentDB === 'hfc_862' && (
                <>
                  <Text style={styles.resultName}>{amp.verstaerker_bezeichnung || amp.hub || '–'}</Text>
                  <Text style={styles.resultDetail}>{amp.hub} • {amp.node_neu} • {amp.location_plz} {amp.location_ort}</Text>
                  <Text style={styles.resultDetail}>{amp.strasse} {amp.hausnummer} • FSK: {amp.fsk_address || '–'} • Type: {amp.verstaerker_type || '–'}</Text>
                  {amp.firmware_version && <Text style={styles.resultDetail}>Firmware: {amp.firmware_version}</Text>}
                </>
              )}
              {currentDB === 'hfc_integration' && (
                <>
                  <Text style={styles.resultName}>{amp.nummer || '–'}</Text>
                  <Text style={styles.resultDetail}>Netz-ID: {amp.bundesland}-{amp.gebiet}-{amp.block}-{amp.nummer}</Text>
                  <Text style={styles.resultDetail}>{amp.plz} {amp.ort} • {amp.strasse} {amp.hausnummer}</Text>
                  <Text style={styles.resultDetail}>LV/EV: {amp.lv_ev || '–'} • Type: {amp.typ_hfc || '–'}</Text>
                </>
              )}
              {currentDB === 'fttx' && (
                <>
                  <Text style={styles.resultName}>{amp.name || amp.hec_nummer || '–'}</Text>
                  <Text style={styles.resultDetail}>HEC#: {amp.hec_nummer}</Text>
                  <Text style={styles.resultDetail}>{amp.address_line_1} {amp.address_line_2}</Text>
                  {amp.type_code && <Text style={styles.resultDetail}>Type: {amp.type_code}</Text>}
                </>
              )}
            </TouchableOpacity>
          ))}
          {results.length === 0 && !loading && (
            <Text style={styles.noResults}>Keine Ergebnisse</Text>
          )}
        </View>
      </ScrollView>

      {/* Detail/Edit Modal */}
      <Modal visible={!!selectedAmp} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
          {/* Detail Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{editMode ? '✏️ Bearbeiten' : '📋 Details'}</Text>
              <Text style={styles.headerSubtitle}>{selectedAmp?.verstaerker_bezeichnung || selectedAmp?.name || ''}</Text>
            </View>
            <TouchableOpacity onPress={() => { setSelectedAmp(null); setEditMode(false) }} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {detailFields.map((field) => (
              <View key={field.key} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>{field.label}</Text>
                {editMode ? (
                  <TextInput
                    style={[styles.input, { fontSize: 15 }]}
                    value={editData[field.key] || ''}
                    onChangeText={(v) => setEditData({ ...editData, [field.key]: v })}
                    placeholder="–"
                    placeholderTextColor="#d1d5db"
                    multiline={['bemerkungen', 'comment_1', 'kommentar'].includes(field.key)}
                  />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '500', color: (selectedAmp as any)?.[field.key] ? Colors.black : '#d1d5db' }}>
                    {(selectedAmp as any)?.[field.key] || '–'}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Detail Buttons */}
          <View style={{ padding: 16, borderTopWidth: 2, borderTopColor: '#e5e7eb', backgroundColor: Colors.white, gap: 8 }}>
            {editMode ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, padding: 14, backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#d1d5db', borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setEditMode(false)}>
                  <Text style={{ fontWeight: 'bold', color: Colors.black }}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 2, padding: 14, backgroundColor: Colors.gold, borderWidth: 2, borderColor: Colors.goldDark, borderRadius: 10, alignItems: 'center', opacity: saving ? 0.5 : 1 }}
                  onPress={handleSave} disabled={saving}>
                  <Text style={{ fontWeight: 'bold', color: Colors.black }}>{saving ? '⏳ Speichere...' : '✅ Speichern'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={{ padding: 14, backgroundColor: '#3b82f6', borderRadius: 10, alignItems: 'center' }}
                onPress={() => setEditMode(true)}>
                <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 16 }}>✏️ Bearbeiten</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

// --- Subcomponent ---

function CascadingPicker({ label, value, options, placeholder, onChange }: {
  label: string
  value?: string
  options: string[]
  placeholder: string
  onChange: (v: string) => void
}) {
  const isActive = !!value

  return (
    <View style={[styles.pickerField, isActive && styles.pickerFieldActive]}>
      <Text style={[styles.pickerLabel, isActive && styles.pickerLabelActive]}>
        {label} {isActive && '●'} ({options.length})
      </Text>
      <View style={[styles.pickerContainer, isActive && styles.pickerContainerActive]}>
        <Picker
          selectedValue={value || ''}
          onValueChange={onChange}
          style={styles.picker}
        >
          <Picker.Item label={`${placeholder} (${options.length})`} value="" />
          {options.map((opt) => (
            <Picker.Item key={opt} label={opt} value={opt} />
          ))}
        </Picker>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.silver100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: 2,
    borderBottomColor: Colors.black,
    ...Shadows.medium,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.silver700,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.silver100,
    borderWidth: 2,
    borderColor: Colors.silver300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filtersContainer: {
    gap: 12,
    marginBottom: 16,
  },
  pickerField: {
    marginBottom: 4,
  },
  pickerFieldActive: {},
  pickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.silver700,
    marginBottom: 4,
  },
  pickerLabelActive: {
    color: '#1d4ed8',
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 10,
    overflow: 'hidden',
    ...Shadows.light,
  },
  pickerContainerActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  picker: {
    height: 50,
  },
  resetButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.light,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.silver700,
  },
  resultsContainer: {
    marginBottom: 40,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    ...Shadows.light,
  },
  resultName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 13,
    color: Colors.silver700,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.black,
    ...Shadows.light,
  },
  noResults: {
    fontSize: 14,
    color: Colors.silver600,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
})
