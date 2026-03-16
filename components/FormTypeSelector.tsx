import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { Colors, Shadows } from '../constants/Colors'

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
  borderColor: string
}

const OPTIONS: FormOption[] = [
  {
    type: 'hfc_862',
    title: 'HFC – 862MHZ',
    desc: 'Bestehende Datenbank (Verstärker)',
    icon: '📡',
    borderColor: Colors.gold,
  },
  {
    type: 'hfc_integration',
    title: 'HFC – Integrationsdatenbank',
    desc: '0,2/1,2 Umbau',
    icon: '🔧',
    borderColor: Colors.warning,
  },
  {
    type: 'fttx',
    title: 'FTTX – ONB/ONH/OLT',
    desc: 'Glasfaser-Netzwerk',
    icon: '🌐',
    borderColor: Colors.success,
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Formular auswählen</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsContainer} scrollEnabled={false}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.type}
                style={[styles.optionButton, { borderColor: opt.borderColor }]}
                onPress={() => { onSelect(opt.type); onClose() }}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                <Text style={{ fontSize: 18, color: Colors.textMuted }}>→</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    ...Shadows.gold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: Colors.textMuted,
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
    backgroundColor: Colors.bg,
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
    color: Colors.white,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
})
