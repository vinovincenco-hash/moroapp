import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { Colors, Shadows } from '../constants/Colors'
import { supabase } from '../lib/supabase'
import PhotoUpload, { PhotoSet, EMPTY_PHOTOS } from './PhotoUpload'
import OrderNumber from './OrderNumber'

interface CreateFTTXModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  hec_nummer: string
  name: string
  type_code: string
  mac_adresse: string
  address_line_1: string
  address_line_2: string
  comment_1: string
}

const INITIAL: FormData = {
  hec_nummer: '', name: '', type_code: '', mac_adresse: '',
  address_line_1: '', address_line_2: '', comment_1: '',
}

export default function CreateFTTXModal({ visible, onClose, onSuccess }: CreateFTTXModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [photos, setPhotos] = useState<PhotoSet>(EMPTY_PHOTOS)
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState<string>('')
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [saving, setSaving] = useState(false)

  const set = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.hec_nummer) e.hec_nummer = 'Pflichtfeld'
    if (!form.mac_adresse) e.mac_adresse = 'Pflichtfeld'
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

    setSaving(true)
    try {
      const { error } = await supabase.from('fttx').insert({
        hec_nummer: form.hec_nummer,
        name: form.name || null,
        type_code: form.type_code || null,
        mac_adresse: form.mac_adresse,
        address_line_1: form.address_line_1 || null,
        address_line_2: form.address_line_2 || null,
        comment_1: form.comment_1
          ? `${form.comment_1}; ${generatedOrderNumber}`
          : generatedOrderNumber,
      })

      if (error) throw error

      Alert.alert('Erfolg', 'FTTX Eintrag erstellt!')
      setForm(INITIAL)
      onSuccess()
      onClose()
    } catch (err: any) {
      Alert.alert('Fehler', err.message || 'Konnte nicht speichern')
    } finally {
      setSaving(false)
    }
  }

  const isComplete = () => form.hec_nummer && form.mac_adresse

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🌐 FTTX</Text>
            <Text style={styles.headerSubtitle}>ONB/ONH/OLT — 7 Felder</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ fontSize: 24, color: Colors.white }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* AUFTRAGSNUMMER */}
          <OrderNumber onGenerated={setGeneratedOrderNumber} />

          {/* GERÄTE-DATEN */}
          <SectionHeader icon="🌐" title="Geräte-Daten" />
          <Field label="HEC# *" error={errors.hec_nummer}>
            <TextInputField
              placeholder="z.B. 04_262_A01 - EV_10621798"
              value={form.hec_nummer}
              onChangeText={(v) => set('hec_nummer', v)}
            />
          </Field>

          <Field label="Name">
            <TextInputField
              placeholder="z.B. ONB_Lustenau_01"
              value={form.name}
              onChangeText={(v) => set('name', v)}
            />
          </Field>

          <Field label="Type Code [0-7]">
            <TextInputField
              placeholder="z.B. 3"
              value={form.type_code}
              onChangeText={(v) => set('type_code', v)}
              keyboardType="number-pad"
              maxLength={1}
            />
          </Field>

          <Field label="MAC Address *" error={errors.mac_adresse}>
            <TextInputField
              placeholder="z.B. 00:24:1F:0B:67:F4"
              value={form.mac_adresse}
              onChangeText={(v) => set('mac_adresse', v)}
            />
          </Field>

          {/* ADRESSE */}
          <SectionHeader icon="📍" title="Adresse" />
          <Field label="Address Line 1">
            <TextInputField
              placeholder="z.B. 6890 Lustenau"
              value={form.address_line_1}
              onChangeText={(v) => set('address_line_1', v)}
            />
          </Field>

          <Field label="Address Line 2">
            <TextInputField
              placeholder="z.B. Brändelstr. 28A"
              value={form.address_line_2}
              onChangeText={(v) => set('address_line_2', v)}
            />
          </Field>

          {/* KOMMENTAR */}
          <SectionHeader icon="📝" title="Kommentar" />
          <Field label="Comment">
            <TextInputField
              placeholder="Bemerkung / Kommentar..."
              value={form.comment_1}
              onChangeText={(v) => set('comment_1', v)}
              multiline
              numberOfLines={4}
            />
          </Field>

          {/* PHOTOS */}
          <PhotoUpload photos={photos} onChange={setPhotos} required={true} />

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
            <Text style={styles.cancelBtnText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, !isComplete() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isComplete() || saving}
          >
            <Text style={styles.submitBtnText}>
              {saving ? '⏳ Erstelle...' : '✅ Erstellen'}
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
      {error && <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠️ {error}</Text>}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.bg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
    ...Shadows.medium,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', marginTop: 4 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.silver300,
    backgroundColor: Colors.bg,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    ...Shadows.light,
  },
  cancelBtnText: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: Colors.goldDark,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    ...Shadows.gold,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
})
