import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Colors, Shadows } from '../constants/Colors'
import { supabase } from '../lib/supabase'

interface CreateHFCIntegrationModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateHFCIntegrationModal({ visible, onClose, onSuccess }: CreateHFCIntegrationModalProps) {
  const [formData, setFormData] = useState({
    bundesland: '',
    gebiet: '',
    block: '',
    nummer: '',
    lv_ev: '' as 'LV' | 'EV' | '',
    typ_hfc: '',
    plz: '',
    ort: '',
    strasse: '',
    hausnummer: '',
    fsk_adresse: '',
    pre_stage_attenuator: '',
    pre_stage_equaliser: '',
    rw_a1: '',
    rw_a2: '',
    rw_a3: '',
    referenz: '',
    projektant: '',
    info_location: '',
  })

  const [creating, setCreating] = useState(false)

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const canSubmit = () => {
    return formData.bundesland && formData.gebiet && formData.block && formData.nummer &&
      formData.lv_ev && formData.typ_hfc && formData.plz && formData.ort &&
      formData.strasse && formData.hausnummer && formData.fsk_adresse
  }

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder (*) ausfüllen!')
      return
    }

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('hfc_integration')
        .insert({
          bundesland: formData.bundesland,
          gebiet: formData.gebiet,
          block: formData.block,
          nummer: formData.nummer,
          lv_ev: formData.lv_ev,
          typ_hfc: formData.typ_hfc,
          plz: formData.plz,
          ort: formData.ort,
          strasse: formData.strasse,
          hausnummer: formData.hausnummer,
          fsk_adresse: formData.fsk_adresse,
          pre_stage_attenuator: formData.pre_stage_attenuator ? parseFloat(formData.pre_stage_attenuator) : null,
          pre_stage_equaliser: formData.pre_stage_equaliser ? parseFloat(formData.pre_stage_equaliser) : null,
          rw_a1: formData.rw_a1 ? parseFloat(formData.rw_a1) : null,
          rw_a2: formData.rw_a2 ? parseFloat(formData.rw_a2) : null,
          rw_a3: formData.rw_a3 ? parseFloat(formData.rw_a3) : null,
          referenz: formData.referenz || null,
          projektant: formData.projektant || null,
          info_location: formData.info_location || null,
          techniker: user?.email || null,
        })

      if (error) throw error

      Alert.alert('Erfolg!', 'HFC Integration Verstärker wurde erstellt!')

      // Reset
      setFormData({
        bundesland: '', gebiet: '', block: '', nummer: '', lv_ev: '', typ_hfc: '',
        plz: '', ort: '', strasse: '', hausnummer: '', fsk_adresse: '',
        pre_stage_attenuator: '', pre_stage_equaliser: '',
        rw_a1: '', rw_a2: '', rw_a3: '',
        referenz: '', projektant: '', info_location: '',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      Alert.alert('Fehler', err.message || 'Verstärker konnte nicht erstellt werden')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔧 HFC Integration</Text>
          <Text style={styles.headerSubtitle}>
            <Text style={styles.required}>*</Text> = Pflichtfeld
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          {/* Netz-ID */}
          <Text style={styles.sectionTitle}>📍 Netz-ID</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Bundesland (01-08) <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.bundesland}
              onChangeText={(v) => updateField('bundesland', v)} placeholder="z.B. 06"
              placeholderTextColor={Colors.silver600} keyboardType="number-pad" maxLength={2} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Gebiet <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.gebiet}
              onChangeText={(v) => updateField('gebiet', v)} placeholder="z.B. 01"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Block <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.block}
              onChangeText={(v) => updateField('block', v)} placeholder="z.B. 02"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nummer <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.nummer}
              onChangeText={(v) => updateField('nummer', v)} placeholder="z.B. 001"
              placeholderTextColor={Colors.silver600} />
          </View>

          {/* Verstärkertyp */}
          <Text style={styles.sectionTitle}>🔧 Verstärkertyp</Text>

          <View style={styles.field}>
            <Text style={styles.label}>LV/EV <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={formData.lv_ev} onValueChange={(v) => updateField('lv_ev', v)} style={styles.picker}>
                <Picker.Item label="-- Auswählen --" value="" />
                <Picker.Item label="LV" value="LV" />
                <Picker.Item label="EV" value="EV" />
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Typ HFC <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.typ_hfc}
              onChangeText={(v) => updateField('typ_hfc', v)} placeholder="z.B. DBC 1200"
              placeholderTextColor={Colors.silver600} />
          </View>

          {/* Standort */}
          <Text style={styles.sectionTitle}>📍 Standort</Text>

          <View style={styles.field}>
            <Text style={styles.label}>PLZ <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.plz}
              onChangeText={(v) => updateField('plz', v)} placeholder="z.B. 6300"
              placeholderTextColor={Colors.silver600} keyboardType="number-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ort <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.ort}
              onChangeText={(v) => updateField('ort', v)} placeholder="z.B. Wörgl"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Straße <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.strasse}
              onChangeText={(v) => updateField('strasse', v)} placeholder="z.B. Hauptstraße"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Hausnummer <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.hausnummer}
              onChangeText={(v) => updateField('hausnummer', v)} placeholder="z.B. 123"
              placeholderTextColor={Colors.silver600} />
          </View>

          {/* Hardware */}
          <Text style={styles.sectionTitle}>⚙️ Hardware</Text>

          <View style={styles.field}>
            <Text style={styles.label}>FSK Adresse (MAC) <Text style={styles.required}>*</Text></Text>
            <TextInput style={styles.input} value={formData.fsk_adresse}
              onChangeText={(v) => updateField('fsk_adresse', v)} placeholder="z.B. 00:11:22:33:44:55"
              placeholderTextColor={Colors.silver600} />
          </View>

          {/* Technische Parameter */}
          <Text style={styles.sectionTitle}>📊 Technische Parameter</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Pre-stage Attenuator (0-31,5 dB)</Text>
            <TextInput style={styles.input} value={formData.pre_stage_attenuator}
              onChangeText={(v) => updateField('pre_stage_attenuator', v)} placeholder="z.B. 15.5"
              placeholderTextColor={Colors.silver600} keyboardType="decimal-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Pre-stage Equaliser (0-18 dB)</Text>
            <TextInput style={styles.input} value={formData.pre_stage_equaliser}
              onChangeText={(v) => updateField('pre_stage_equaliser', v)} placeholder="z.B. 9.0"
              placeholderTextColor={Colors.silver600} keyboardType="decimal-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>RW A1 (dB)</Text>
            <TextInput style={styles.input} value={formData.rw_a1}
              onChangeText={(v) => updateField('rw_a1', v)} placeholder="z.B. 10.0"
              placeholderTextColor={Colors.silver600} keyboardType="decimal-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>RW A2 (dB)</Text>
            <TextInput style={styles.input} value={formData.rw_a2}
              onChangeText={(v) => updateField('rw_a2', v)} placeholder="z.B. 12.0"
              placeholderTextColor={Colors.silver600} keyboardType="decimal-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>RW A3 (dB)</Text>
            <TextInput style={styles.input} value={formData.rw_a3}
              onChangeText={(v) => updateField('rw_a3', v)} placeholder="z.B. 8.0"
              placeholderTextColor={Colors.silver600} keyboardType="decimal-pad" />
          </View>

          {/* Zusätzliche Infos */}
          <Text style={styles.sectionTitle}>📝 Zusatz</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Referenz</Text>
            <TextInput style={styles.input} value={formData.referenz}
              onChangeText={(v) => updateField('referenz', v)} placeholder="Referenz-Nummer"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Projektant</Text>
            <TextInput style={styles.input} value={formData.projektant}
              onChangeText={(v) => updateField('projektant', v)} placeholder="Name des Projektanten"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Info/Location</Text>
            <TextInput style={[styles.input, styles.textArea]} value={formData.info_location}
              onChangeText={(v) => updateField('info_location', v)} placeholder="Zusätzliche Informationen..."
              placeholderTextColor={Colors.silver600} multiline numberOfLines={4} />
          </View>

          {!canSubmit() && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ Pflichtfelder: Bundesland, Gebiet, Block, Nummer, LV/EV, Typ HFC, PLZ, Ort, Straße, Hnr, FSK
              </Text>
            </View>
          )}
        </ScrollView>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { padding: 20, paddingTop: 60, backgroundColor: Colors.white, borderBottomWidth: 2, borderBottomColor: Colors.black, ...Shadows.medium },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.black, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: Colors.silver700, fontWeight: '600' },
  required: { color: Colors.error || '#ef4444', fontWeight: 'bold' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.black, marginTop: 16, marginBottom: 12 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 8 },
  input: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.silver300, borderRadius: 10, padding: 14, fontSize: 16, color: Colors.black, ...Shadows.light },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.silver300, borderRadius: 10, overflow: 'hidden', ...Shadows.light },
  picker: { height: 50 },
  warning: { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b', borderRadius: 10, padding: 16, marginTop: 10 },
  warningText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 2, borderTopColor: Colors.silver300, backgroundColor: Colors.white },
  cancelButton: { flex: 1, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.black, borderRadius: 10, padding: 16, alignItems: 'center', ...Shadows.light },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.black },
  submitButton: { flex: 2, backgroundColor: Colors.gold, borderWidth: 2, borderColor: Colors.goldDark, borderRadius: 10, padding: 16, alignItems: 'center', ...Shadows.gold },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.black },
})
