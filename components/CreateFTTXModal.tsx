import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Colors, Shadows } from '../constants/Colors'
import { supabase } from '../lib/supabase'

interface CreateFTTXModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateFTTXModal({ visible, onClose, onSuccess }: CreateFTTXModalProps) {
  const [formData, setFormData] = useState({
    bundesland: '',
    gebiet: '',
    block: '',
    nummer: '',
    hec_nummer: '',
    mac_adresse: '',
    typ: '' as 'ONB' | 'ONH' | 'OLT' | '',
    plz: '',
    ort: '',
    strasse: '',
    hausnummer: '',
    projektant: '',
    referenz: '',
    info_location: '',
  })

  const [creating, setCreating] = useState(false)

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const canSubmit = () => {
    return formData.bundesland && formData.gebiet && formData.block && formData.nummer &&
      formData.typ && formData.plz && formData.ort && formData.strasse && formData.hausnummer
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
        .from('fttx')
        .insert({
          bundesland: formData.bundesland,
          gebiet: formData.gebiet,
          block: formData.block,
          nummer: formData.nummer,
          hec_nummer: formData.hec_nummer || null,
          mac_adresse: formData.mac_adresse || null,
          typ: formData.typ,
          plz: formData.plz,
          ort: formData.ort,
          strasse: formData.strasse,
          hausnummer: formData.hausnummer,
          projektant: formData.projektant || null,
          referenz: formData.referenz || null,
          info_location: formData.info_location || null,
          techniker: user?.email || null,
        })

      if (error) throw error

      Alert.alert('Erfolg!', 'FTTX Verstärker wurde erstellt!')

      // Reset
      setFormData({
        bundesland: '', gebiet: '', block: '', nummer: '',
        hec_nummer: '', mac_adresse: '', typ: '',
        plz: '', ort: '', strasse: '', hausnummer: '',
        projektant: '', referenz: '', info_location: '',
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
          <Text style={styles.headerTitle}>💡 FTTX (Glasfaser)</Text>
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

          {/* Hardware */}
          <Text style={styles.sectionTitle}>⚙️ Hardware</Text>

          <View style={styles.field}>
            <Text style={styles.label}>HEC# (Optional)</Text>
            <TextInput style={styles.input} value={formData.hec_nummer}
              onChangeText={(v) => updateField('hec_nummer', v)} placeholder="z.B. HEC12345"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>MAC Adresse (Optional)</Text>
            <TextInput style={styles.input} value={formData.mac_adresse}
              onChangeText={(v) => updateField('mac_adresse', v)} placeholder="z.B. 00:11:22:33:44:55"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Typ <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={formData.typ} onValueChange={(v) => updateField('typ', v)} style={styles.picker}>
                <Picker.Item label="-- Auswählen --" value="" />
                <Picker.Item label="ONB" value="ONB" />
                <Picker.Item label="ONH" value="ONH" />
                <Picker.Item label="OLT" value="OLT" />
              </Picker>
            </View>
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

          {/* Zusätzliche Infos */}
          <Text style={styles.sectionTitle}>📝 Zusatz</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Projektant</Text>
            <TextInput style={styles.input} value={formData.projektant}
              onChangeText={(v) => updateField('projektant', v)} placeholder="Name des Projektanten"
              placeholderTextColor={Colors.silver600} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Referenz</Text>
            <TextInput style={styles.input} value={formData.referenz}
              onChangeText={(v) => updateField('referenz', v)} placeholder="Referenz-Nummer"
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
                ⚠️ Pflichtfelder: Bundesland, Gebiet, Block, Nummer, Typ, PLZ, Ort, Straße, Hausnummer
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
