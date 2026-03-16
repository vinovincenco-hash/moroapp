import { useEffect, useState, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, Alert, RefreshControl,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Colors, Shadows } from '../constants/Colors'

interface MyAmplifier {
  id: string
  db: string
  dbLabel: string
  typ: string
  ort: string
  strasse: string
  hausnummer: string
  plz: string
  fsk: string
  created_at: string
  extraInfo: string
}

interface Props {
  onClose: () => void
}

export default function MeinBereichScreen({ onClose }: Props) {
  const [amplifiers, setAmplifiers] = useState<MyAmplifier[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [dbFilter, setDbFilter] = useState<'all' | 'hfc_862' | 'hfc_integration' | 'fttx'>('all')
  const [selectedAmp, setSelectedAmp] = useState<MyAmplifier | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { fetchMyAmplifiers() }, [])

  const fetchMyAmplifiers = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return

      let tName = user.email
      try {
        const { data } = await supabase.from('users').select('technician_name').eq('email', user.email).single()
        if (data?.technician_name) tName = data.technician_name
      } catch {}

      const matchValues = [user.email]
      if (tName !== user.email) matchValues.push(tName)

      const [hfc862Res, integRes] = await Promise.all([
        supabase.from('amplifiers').select('*').or(matchValues.map(v => `techniker.eq.${v}`).join(',')),
        supabase.from('hfc_integration').select('*').or(matchValues.map(v => `techniker.eq.${v}`).join(',')),
      ])

      const items: MyAmplifier[] = []

      ;(hfc862Res.data || []).forEach(r => {
        items.push({
          id: r.id, db: 'hfc_862', dbLabel: '📡 HFC 862',
          typ: r.verstaerker_type || r.verstaerker_bezeichnung || '–',
          ort: r.location_ort || '–', strasse: r.strasse || '–',
          hausnummer: r.hausnummer || '', plz: r.location_plz || '',
          fsk: r.fsk_address || '–', created_at: r.created_at || r.datum || '',
          extraInfo: `HUB: ${r.hub || '–'} | Node: ${r.node_neu || '–'}`,
        })
      })

      ;(integRes.data || []).forEach(r => {
        items.push({
          id: r.id, db: 'hfc_integration', dbLabel: '🔧 Integration',
          typ: r.typ_hfc || r.lv_ev || '–',
          ort: r.ort || '–', strasse: r.strasse || '–',
          hausnummer: r.hausnummer || '', plz: r.plz || '',
          fsk: r.fsk_adresse || '–', created_at: r.wartungsdatum || r.created_at || '',
          extraInfo: `${r.lv_ev || ''} | BL: ${r.bundesland || '–'}`,
        })
      })

      // Sort by date desc
      items.sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at.includes('.') ? a.created_at.split('.').reverse().join('-') : a.created_at).getTime() : 0
        const db2 = b.created_at ? new Date(b.created_at.includes('.') ? b.created_at.split('.').reverse().join('-') : b.created_at).getTime() : 0
        return db2 - da
      })

      setAmplifiers(items)
    } catch (err: any) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filtered = useMemo(() => {
    let data = [...amplifiers]
    if (dbFilter !== 'all') data = data.filter(a => a.db === dbFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(a => a.typ.toLowerCase().includes(q) || a.ort.toLowerCase().includes(q) || a.strasse.toLowerCase().includes(q) || a.fsk.toLowerCase().includes(q))
    }
    return data
  }, [amplifiers, dbFilter, search])

  const openDetail = async (amp: MyAmplifier) => {
    setSelectedAmp(amp)
    setDetailLoading(true)
    try {
      const table = amp.db === 'hfc_862' ? 'amplifiers' : 'hfc_integration'
      const { data } = await supabase.from(table).select('*').eq('id', amp.id).single()
      setDetailData(data)
    } catch { setDetailData(null) }
    finally { setDetailLoading(false) }
  }

  const hfc862Count = amplifiers.filter(a => a.db === 'hfc_862').length
  const integCount = amplifiers.filter(a => a.db === 'hfc_integration').length

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>👤 Mein Bereich</Text>
          <Text style={styles.subtitle}>Meine Verstärker</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>← Zurück</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{amplifiers.length}</Text>
          <Text style={styles.statLabel}>Gesamt</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#60a5fa' }]}>{hfc862Count}</Text>
          <Text style={styles.statLabel}>📡 HFC</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>{integCount}</Text>
          <Text style={styles.statLabel}>🔧 Integ.</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Suchen..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `Alle (${amplifiers.length})` },
          { key: 'hfc_862', label: `📡 HFC (${hfc862Count})` },
          { key: 'hfc_integration', label: `🔧 Integ. (${integCount})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, dbFilter === tab.key && styles.filterTabActive]}
            onPress={() => setDbFilter(tab.key as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, dbFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyAmplifiers() }} tintColor={Colors.gold} />}
        >
          {filtered.map(amp => (
            <TouchableOpacity key={`${amp.db}-${amp.id}`} style={styles.card} onPress={() => openDetail(amp)} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <View style={[styles.dbBadge, amp.db === 'hfc_862' ? styles.dbBadgeHFC : styles.dbBadgeInteg]}>
                  <Text style={styles.dbBadgeText}>{amp.dbLabel}</Text>
                </View>
                <Text style={styles.cardDate}>{amp.created_at || '–'}</Text>
              </View>
              <Text style={styles.cardTyp}>{amp.typ}</Text>
              <Text style={styles.cardAddress}>{amp.plz} {amp.ort} — {amp.strasse} {amp.hausnummer}</Text>
              <Text style={styles.cardExtra}>{amp.extraInfo}</Text>
              <Text style={styles.cardFsk}>FSK: {amp.fsk}</Text>
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {search || dbFilter !== 'all' ? 'Keine Ergebnisse.' : 'Du hast noch keine Verstärker erstellt.'}
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={!!selectedAmp} transparent animationType="slide" onRequestClose={() => { setSelectedAmp(null); setDetailData(null) }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedAmp?.typ || ''}</Text>
                <Text style={styles.modalSubtitle}>{selectedAmp?.ort} — {selectedAmp?.strasse} {selectedAmp?.hausnummer}</Text>
              </View>
              <TouchableOpacity onPress={() => { setSelectedAmp(null); setDetailData(null) }}>
                <Text style={{ fontSize: 24, color: Colors.white }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {detailLoading ? (
                <ActivityIndicator size="large" color={Colors.gold} />
              ) : detailData ? (
                Object.entries(detailData).filter(([k]) => k !== 'id' && !k.startsWith('_')).map(([key, val]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.detailVal}>{val != null ? String(val) : '–'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Keine Details.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 60, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.borderGold },
  title: { fontSize: 24, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  closeBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 8, padding: 16 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, alignItems: 'center', ...Shadows.light },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.gold },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.white },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.bgCard },
  filterTabActive: { backgroundColor: Colors.gold, borderColor: Colors.goldDark, ...Shadows.gold },
  filterTabText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.black, fontWeight: '800' },

  list: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 10, ...Shadows.light },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dbBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  dbBadgeHFC: { backgroundColor: 'rgba(96, 165, 250, 0.1)', borderColor: 'rgba(96, 165, 250, 0.2)' },
  dbBadgeInteg: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.2)' },
  dbBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  cardDate: { fontSize: 11, color: Colors.textMuted },
  cardTyp: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  cardAddress: { fontSize: 13, color: Colors.textSecondary },
  cardExtra: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  cardFsk: { fontSize: 11, color: Colors.gold, marginTop: 4, fontFamily: 'monospace' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', borderWidth: 1, borderColor: Colors.borderGold },
  modalHeader: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'flex-start' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  modalBody: { padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  detailKey: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', flex: 1 },
  detailVal: { fontSize: 13, color: Colors.white, fontWeight: '600', flex: 1, textAlign: 'right' },
})
