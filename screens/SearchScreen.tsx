import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Colors, Shadows } from '../constants/Colors'
import { supabase } from '../lib/supabase'

interface SearchScreenProps {
  onClose: () => void
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

interface Amplifier {
  id: number
  hub: string
  node_neu: string
  verstaerker_bezeichnung: string
  location_plz: string
  location_ort: string
  strasse: string
  hausnummer: string
  verstaerker_type: string
  fsk_address: string
}

export default function SearchScreen({ onClose }: SearchScreenProps) {
  const [filters, setFilters] = useState<any>({})
  const [options, setOptions] = useState<DynamicOptions>(EMPTY_OPTIONS)
  const [results, setResults] = useState<Amplifier[]>([])
  const [resultCount, setResultCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

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
      let query = supabase
        .from('amplifiers')
        .select('id, hub, node_neu, location_plz, location_ort, strasse, hausnummer, verstaerker_type, firmware_version, parents, verstaerker_bezeichnung, fsk_address')

      if (currentFilters.hub) query = query.eq('hub', currentFilters.hub)
      if (currentFilters.node_neu) query = query.eq('node_neu', currentFilters.node_neu)
      if (currentFilters.plz) query = query.eq('location_plz', currentFilters.plz)
      if (currentFilters.ort) query = query.eq('location_ort', currentFilters.ort)
      if (currentFilters.strasse) query = query.eq('strasse', currentFilters.strasse)
      if (currentFilters.type) query = query.eq('verstaerker_type', currentFilters.type)
      if (currentFilters.firmware) query = query.eq('firmware_version', currentFilters.firmware)
      if (currentFilters.parents) query = query.eq('parents', currentFilters.parents)

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
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
        {/* Filters */}
        <View style={styles.filtersContainer}>
          <CascadingPicker
            label="HUB"
            value={filters.hub}
            options={options.hubs}
            placeholder="Alle HUBs"
            onChange={(v) => updateFilter('hub', v)}
          />
          <CascadingPicker
            label="Node"
            value={filters.node_neu}
            options={options.nodes_neu}
            placeholder="Alle Nodes"
            onChange={(v) => updateFilter('node_neu', v)}
          />
          <CascadingPicker
            label="PLZ"
            value={filters.plz}
            options={options.plzs}
            placeholder="Alle PLZs"
            onChange={(v) => updateFilter('plz', v)}
          />
          <CascadingPicker
            label="Ort"
            value={filters.ort}
            options={options.orte}
            placeholder="Alle Orte"
            onChange={(v) => updateFilter('ort', v)}
          />
          <CascadingPicker
            label="Straße"
            value={filters.strasse}
            options={options.strassen}
            placeholder="Alle Straßen"
            onChange={(v) => updateFilter('strasse', v)}
          />
          <CascadingPicker
            label="Verstärkertype"
            value={filters.type}
            options={options.types}
            placeholder="Alle Typen"
            onChange={(v) => updateFilter('type', v)}
          />
          <CascadingPicker
            label="Firmware"
            value={filters.firmware}
            options={options.firmwares}
            placeholder="Alle Firmwares"
            onChange={(v) => updateFilter('firmware', v)}
          />
          <CascadingPicker
            label="Parents"
            value={filters.parents}
            options={options.parents}
            placeholder="Alle Parents"
            onChange={(v) => updateFilter('parents', v)}
          />
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
            <View key={amp.id} style={styles.resultCard}>
              <Text style={styles.resultName}>{amp.verstaerker_bezeichnung || '–'}</Text>
              <Text style={styles.resultDetail}>
                {amp.hub} • {amp.node_neu} • {amp.location_plz} {amp.location_ort}
              </Text>
              <Text style={styles.resultDetail}>
                {amp.strasse} {amp.hausnummer} • FSK: {amp.fsk_address || '–'}
              </Text>
            </View>
          ))}
          {results.length === 0 && !loading && (
            <Text style={styles.noResults}>Keine Ergebnisse</Text>
          )}
        </View>
      </ScrollView>
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
  noResults: {
    fontSize: 14,
    color: Colors.silver600,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
})
