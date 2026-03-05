import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Colors, Shadows } from '../constants/Colors'
import CreateAmplifierModal from '../components/CreateAmplifierModal'
import SearchScreen from './SearchScreen'

interface HomeScreenProps {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [stats, setStats] = useState({
    total: 0,
    worgl: 0,
    schwaz: 0,
    stJohann: 0,
    lienz: 0,
  })
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    fetchStats()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
    }
  }

  const fetchStats = async () => {
    try {
      // Use exact count queries per HUB (no 1000-row limit!)
      const { count: total } = await supabase
        .from('amplifiers')
        .select('*', { count: 'exact', head: true })

      const { count: worgl } = await supabase
        .from('amplifiers')
        .select('*', { count: 'exact', head: true })
        .eq('hub', 'Wörgl')

      const { count: schwaz } = await supabase
        .from('amplifiers')
        .select('*', { count: 'exact', head: true })
        .eq('hub', 'Schwaz')

      const { count: stJohann } = await supabase
        .from('amplifiers')
        .select('*', { count: 'exact', head: true })
        .eq('hub', 'St.Johann')

      const { count: lienz } = await supabase
        .from('amplifiers')
        .select('*', { count: 'exact', head: true })
        .eq('hub', 'Lienz')

      setStats({
        total: total || 0,
        worgl: worgl || 0,
        schwaz: schwaz || 0,
        stJohann: stJohann || 0,
        lienz: lienz || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MoroApp</Text>
            <Text style={styles.headerSubtitle}>Verstärker Management</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        {userEmail && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>👤 {userEmail}</Text>
          </View>
        )}

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => setSearchVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.searchInput}>
            <Text style={styles.searchPlaceholder}>🔍 Verstärker suchen...</Text>
          </View>
        </TouchableOpacity>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Statistik</Text>
          
          {loading ? (
            <Text style={styles.loadingText}>Lade Daten...</Text>
          ) : (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total:</Text>
                <Text style={styles.statValue}>{stats.total.toLocaleString()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>• Wörgl:</Text>
                <Text style={styles.statValue}>{stats.worgl.toLocaleString()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>• Schwaz:</Text>
                <Text style={styles.statValue}>{stats.schwaz.toLocaleString()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>• St.Johann:</Text>
                <Text style={styles.statValue}>{stats.stJohann.toLocaleString()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>• Lienz:</Text>
                <Text style={styles.statValue}>{stats.lienz.toLocaleString()}</Text>
              </View>
            </>
          )}
        </View>

        {/* New Amplifier Button */}
        <TouchableOpacity 
          style={styles.newButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonIcon}>➕</Text>
          <Text style={styles.newButtonText}>Neuer Verstärker</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Search Screen */}
      <Modal visible={searchVisible} animationType="slide">
        <SearchScreen onClose={() => setSearchVisible(false)} />
      </Modal>

      {/* Create Amplifier Modal */}
      <CreateAmplifierModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          fetchStats() // Refresh stats after creating
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.silver100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.silver700,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Shadows.light,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.black,
  },
  userInfo: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    ...Shadows.light,
  },
  userInfoText: {
    fontSize: 14,
    color: Colors.silver700,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 12,
    padding: 16,
    ...Shadows.light,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.silver600,
  },
  statsContainer: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.black,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    ...Shadows.medium,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.silver600,
    fontStyle: 'italic',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: Colors.silver700,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
  newButton: {
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.goldDark,
    ...Shadows.gold,
  },
  newButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  newButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
})
