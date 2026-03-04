import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { Colors, Shadows } from '../constants/Colors'
import { supabase } from '../lib/supabase'

interface CreateAmplifierModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAmplifierModal({ visible, onClose, onSuccess }: CreateAmplifierModalProps) {
  const [formData, setFormData] = useState({
    hub: 'Wörgl',
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

  const [nodeOptions, setNodeOptions] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (visible) {
      fetchNodeOptions()
    }
  }, [visible])

  const fetchNodeOptions = async () => {
    const { data, error } = await supabase
      .from('amplifiers')
      .select('node_neu')
      .not('node_neu', 'is', null)
      .order('node_neu')

    if (data && !error) {
      const unique = Array.from(new Set(data.map(r => r.node_neu).filter(Boolean))) as string[]
      setNodeOptions(unique)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const canSubmit = () => {
    return (
      formData.hub &&
      formData.node_neu &&
      formData.verstaerker_bezeichnung &&
      formData.strasse &&
      formData.hausnummer &&
      formData.location_plz &&
      formData.location_ort &&
      formData.fsk_address
    )
  }

  const handleSubmit = async () => {
    if (!canSubmit()) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder (*) ausfüllen!')
      return
    }

    setCreating(true)

    try {
      // Build location_address
      const location_address = [
        formData.strasse,
        formData.hausnummer,
        formData.location_plz,
        formData.location_ort,
      ]
        .filter(Boolean)
        .join(' ')

      // Build display name
      let name = formData.verstaerker_bezeichnung
      if (!name && formData.strecke_bezeichnung && formData.lv_ev_bezeichnung) {
        name = `${formData.strecke_bezeichnung} ${formData.lv_ev_bezeichnung}`
      } else if (!name && formData.strecke_bezeichnung) {
        name = formData.strecke_bezeichnung
      } else if (!name && formData.lv_ev_bezeichnung) {
        name = formData.lv_ev_bezeichnung
      } else if (!name) {
        name = `Neu_${Date.now()}`
      }

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
          datum: datum,
          bemerkungen: formData.bemerkungen || null,
        })
        .select()
        .single()

      if (error) throw error

      Alert.alert('Erfolg!', `Verstärker ${name} wurde erstellt!`)
      
      // Reset form
      setFormData({
        hub: 'Wörgl',
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>➕ Neuer Verstärker</Text>
          <Text style={styles.headerSubtitle}>
            <Text style={styles.required}>*</Text> = Pflichtfeld
          </Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* HUB */}
          <View style={styles.field}>
            <Text style={styles.label}>
              HUB <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.hub}
                onValueChange={(value) => updateField('hub', value)}
                style={styles.picker}
              >
                <Picker.Item label="Wörgl" value="Wörgl" />
                <Picker.Item label="Schwaz" value="Schwaz" />
                <Picker.Item label="St.Johann" value="St.Johann" />
                <Picker.Item label="Lienz" value="Lienz" />
              </Picker>
            </View>
          </View>

          {/* Node */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Node <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.node_neu}
                onValueChange={(value) => updateField('node_neu', value)}
                style={styles.picker}
              >
                <Picker.Item label="-- Node auswählen --" value="" />
                {nodeOptions.map((node) => (
                  <Picker.Item key={node} label={node} value={node} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Verstärkerbezeichnung */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Verstärkerbezeichnung <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.verstaerker_bezeichnung}
              onChangeText={(value) => updateField('verstaerker_bezeichnung', value)}
              placeholder="z.Bsp. EV oder 044311060"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* Parents */}
          <View style={styles.field}>
            <Text style={styles.label}>Parents</Text>
            <TextInput
              style={styles.input}
              value={formData.parents}
              onChangeText={(value) => updateField('parents', value)}
              placeholder="übergeordneter Verstärker"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* Straße */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Straße <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.strasse}
              onChangeText={(value) => updateField('strasse', value)}
              placeholder="z.Bsp. Bahnhofstraße"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* Hnr */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Hnr <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.hausnummer}
              onChangeText={(value) => updateField('hausnummer', value)}
              placeholder="z.Bsp. 123"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* PLZ */}
          <View style={styles.field}>
            <Text style={styles.label}>
              PLZ <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.location_plz}
              onChangeText={(value) => updateField('location_plz', value)}
              placeholder="6300"
              placeholderTextColor={Colors.silver600}
              keyboardType="numeric"
            />
          </View>

          {/* Ort */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Ort <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.location_ort}
              onChangeText={(value) => updateField('location_ort', value)}
              placeholder="Wörgl"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* Verstärkertype */}
          <View style={styles.field}>
            <Text style={styles.label}>Verstärkertype</Text>
            <TextInput
              style={styles.input}
              value={formData.verstaerker_type}
              onChangeText={(value) => updateField('verstaerker_type', value)}
              placeholder="z.B. DBC 1200"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* FSK */}
          <View style={styles.field}>
            <Text style={styles.label}>
              FSK <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.fsk_address}
              onChangeText={(value) => updateField('fsk_address', value)}
              placeholder="z.Bsp. 1234567"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* Firmware */}
          <View style={styles.field}>
            <Text style={styles.label}>Firmware</Text>
            <TextInput
              style={styles.input}
              value={formData.firmware_version}
              onChangeText={(value) => updateField('firmware_version', value)}
              placeholder="z.B. V2.22"
              placeholderTextColor={Colors.silver600}
            />
          </View>

          {/* Bemerkung */}
          <View style={styles.field}>
            <Text style={styles.label}>Bemerkung</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bemerkungen}
              onChangeText={(value) => updateField('bemerkungen', value)}
              placeholder="Zusätzliche Informationen..."
              placeholderTextColor={Colors.silver600}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Validation Warning */}
          {!canSubmit() && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ Pflichtfelder (*) müssen ausgefüllt sein: HUB, Node, Verstärkerbezeichnung, Straße,
                Hnr, PLZ, Ort, FSK
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={creating}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit() || creating) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit() || creating}
            activeOpacity={0.8}
          >
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
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: 2,
    borderBottomColor: Colors.black,
    ...Shadows.medium,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.silver700,
    fontWeight: '600',
  },
  required: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 10,
    overflow: 'hidden',
    ...Shadows.light,
  },
  picker: {
    height: 50,
  },
  warning: {
    backgroundColor: Colors.warningLight,
    borderWidth: 2,
    borderColor: Colors.warning,
    borderRadius: 10,
    padding: 16,
    marginTop: 10,
  },
  warningText: {
    fontSize: 14,
    color: Colors.anthracite800,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.silver300,
    backgroundColor: Colors.white,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    ...Shadows.light,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: Colors.goldDark,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    ...Shadows.gold,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
})
