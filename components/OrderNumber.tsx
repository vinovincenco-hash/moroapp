import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import { Colors, Shadows } from '../constants/Colors'
import { supabase } from '../lib/supabase'

interface Props {
  onGenerated: (orderNumber: string) => void
}

export default function OrderNumber({ onGenerated }: Props) {
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateOrderNumber()
  }, [])

  const generateOrderNumber = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_next_order_number')

      if (error) throw error

      const num = data as string
      setOrderNumber(num)
      onGenerated(num)
    } catch (err: any) {
      console.error('Order number error:', err)
      // Fallback
      const fallback = `AmpX-${String(Date.now()).slice(-7)}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`
      setOrderNumber(fallback)
      onGenerated(fallback)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(orderNumber)
      } catch {
        const el = document.createElement('textarea')
        el.value = orderNumber
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.gold} />
        <Text style={styles.loadingText}>Auftragsnummer wird generiert...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.label}>📋 Auftragsnummer</Text>
        <Text style={styles.number}>{orderNumber}</Text>
      </View>
      <TouchableOpacity
        style={[styles.copyBtn, copied && styles.copyBtnDone]}
        onPress={handleCopy}
        activeOpacity={0.7}
      >
        <Text style={styles.copyBtnText}>
          {copied ? '✅ Kopiert!' : '📋 Kopieren'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.bgInput,
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    ...Shadows.light,
  },
  info: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: '#2563eb', marginBottom: 4 },
  number: { fontSize: 18, fontWeight: 'bold', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: '#111827' },
  loadingText: { fontSize: 13, color: '#6b7280', marginLeft: 8 },
  copyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  copyBtnDone: {
    backgroundColor: '#16a34a',
  },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: 'white' },
})
