import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { Colors } from '../constants/Colors'

export type DatabaseType = 'hfc_862' | 'hfc_integration' | 'fttx'

interface FormTypeSelectorProps {
  visible: boolean
  onSelect: (type: DatabaseType) => void
  onClose: () => void
}

interface FormOption {
  type: DatabaseType
  title: string
  desc: string
  icon: string
  color: string
  accentColor: string
}

const OPTIONS: FormOption[] = [
  {
    type: 'hfc_862',
    title: 'HFC – 862MHZ',
    desc: 'Bestehende Datenbank (Verstärker)',
    icon: '📡',
    color: '#DBEAFE',
    accentColor: '#3B82F6',
  },
  {
    type: 'hfc_integration',
    title: 'HFC – Integrationsdatenbank',
    desc: '0,2/1,2 Umbau',
    icon: '🔧',
    color: '#FEF3C7',
    accentColor: '#D97706',
  },
  {
    type: 'fttx',
    title: 'FTTX – ONB/ONH/OLT',
    desc: 'Glasfaser-Netzwerk',
    icon: '🌐',
    color: '#DCFCE7',
    accentColor: '#16A34A',
  },
]

export default function FormTypeSelector({ visible, onSelect, onClose }: FormTypeSelectorProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Formular auswählen</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Options */}
          <ScrollView style={styles.optionsContainer} scrollEnabled={false}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.type}
                style={[styles.optionButton, { backgroundColor: opt.color }]}
                onPress={() => {
                  onSelect(opt.type)
                  onClose()
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: Colors.bg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#9CA3AF',
    lineHeight: 28,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
})
