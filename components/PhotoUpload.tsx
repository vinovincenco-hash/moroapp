import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert, Platform,
} from 'react-native'
import { Colors, Shadows } from '../constants/Colors'

export interface PhotoSet {
  nahaufnahme: string | null   // base64 data URI
  kastenfoto: string | null
  standortansicht: string | null
}

export const EMPTY_PHOTOS: PhotoSet = {
  nahaufnahme: null,
  kastenfoto: null,
  standortansicht: null,
}

const MAX_SIZE_BYTES = 3 * 1024 * 1024 // 3 MB

interface PhotoSlot {
  key: keyof PhotoSet
  label: string
  icon: string
  desc: string
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { key: 'nahaufnahme', label: 'Nahaufnahme', icon: '📷', desc: 'Offener Verstärker' },
  { key: 'kastenfoto', label: 'Kastenfoto', icon: '📦', desc: 'Kasten mit Bauteilen' },
  { key: 'standortansicht', label: 'Standort', icon: '🏠', desc: 'Standortansicht' },
]

interface Props {
  photos: PhotoSet
  onChange: (photos: PhotoSet) => void
  required?: boolean
}

export default function PhotoUpload({ photos, onChange, required = true }: Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof PhotoSet, string>>>({})

  const handleFileSelect = (key: keyof PhotoSet) => {
    // Use web file input (works on mobile browsers with camera)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    // On mobile this will offer camera option
    if (Platform.OS === 'web') {
      input.setAttribute('capture', 'environment')
    }
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > MAX_SIZE_BYTES) {
        setErrors(prev => ({ ...prev, [key]: `Zu groß! Max 3MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` }))
        return
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [key]: 'Nur Bilder erlaubt' }))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setErrors(prev => ({ ...prev, [key]: undefined }))
        onChange({ ...photos, [key]: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const handleRemove = (key: keyof PhotoSet) => {
    onChange({ ...photos, [key]: null })
  }

  const allFilled = photos.nahaufnahme && photos.kastenfoto && photos.standortansicht

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📸 Fotos {required ? '*' : ''}</Text>
        {required && !allFilled && (
          <Text style={styles.requiredHint}>Alle 3 Pflicht</Text>
        )}
        {allFilled && (
          <Text style={styles.completeHint}>✅ Komplett</Text>
        )}
      </View>

      {PHOTO_SLOTS.map(slot => (
        <View key={slot.key} style={styles.slot}>
          {photos[slot.key] ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: photos[slot.key]! }}
                style={styles.preview}
                resizeMode="cover"
              />
              <View style={styles.previewInfo}>
                <Text style={styles.slotLabel}>✅ {slot.label}</Text>
                <TouchableOpacity onPress={() => handleRemove(slot.key)}>
                  <Text style={styles.removeBtn}>🗑 Entfernen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => handleFileSelect(slot.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.slotIcon}>{slot.icon}</Text>
              <View>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                <Text style={styles.slotDesc}>{slot.desc}</Text>
                <Text style={styles.slotHint}>Max 3 MB · Tippen zum Fotografieren</Text>
              </View>
            </TouchableOpacity>
          )}
          {errors[slot.key] && (
            <Text style={styles.error}>⚠️ {errors[slot.key]}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.black },
  requiredHint: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  completeHint: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  slot: { marginBottom: 12 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    gap: 12,
  },
  slotIcon: { fontSize: 32 },
  slotLabel: { fontSize: 15, fontWeight: '700', color: Colors.black },
  slotDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  slotHint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 12,
    gap: 12,
  },
  preview: { width: 80, height: 80, borderRadius: 8 },
  previewInfo: { flex: 1 },
  removeBtn: { fontSize: 13, color: '#ef4444', fontWeight: '600', marginTop: 4 },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4, marginLeft: 4 },
})
