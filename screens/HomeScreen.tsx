import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase, DatabaseType, getTableName, getDisplayName } from '../lib/supabase'
import { Colors, Shadows } from '../constants/Colors'
import CreateAmplifierModal from '../components/CreateAmplifierModal'
import CreateHFCIntegrationModal from '../components/CreateHFCIntegrationModal'
import CreateFTTXModal from '../components/CreateFTTXModal'
import FormTypeSelector from '../components/FormTypeSelector'
import SearchScreen from './SearchScreen'

interface HomeScreenProps {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [currentDB, setCurrentDB] = useState<DatabaseType>('hfc_862')
  const [stats, setStats] = useState({
    total: 0,
    worgl: 0,
    schwaz: 0,
    stJohann: 0,
    lienz: 0,
  })
  const [loading, setLoading] = useState(true)
  const [formSelectorVisible, setFormSelectorVisible] = useState(false)
  const [selectedFormType, setSelectedFormType] = useState<DatabaseType | null>(null)
  const [searchVisible, setSearchVisible] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [currentDB])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const tableName = getTableName(currentDB)

      // Get total count
      const { count: total } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      // For HFC 862: stats by HUB
      if (currentDB === 'hfc_862') {
        const { count: worgl } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('hub', 'Wörgl')

        const { count: schwaz } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('hub', 'Schwaz')

        const { count: stJohann } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('hub', 'St.Johann')

        const { count: lienz } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('hub', 'Lienz')

        setStats({
          total: total || 0,
          worgl: worgl || 0,
          schwaz: schwaz || 0,
          stJohann: stJohann || 0,
          lienz: lienz || 0,
        })
      } else {
        // For HFC Integration & FTTX: stats by Bundesland (or simple total)
        setStats({
          total: total || 0,
          worgl: 0,
          schwaz: 0,
          stJohann: 0,
          lienz: 0,
        })
      }
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

        {/* Database Switcher */}
        <View style={styles.dbSwitcher}>
          <TouchableOpacity
            style={[styles.dbTab, currentDB === 'hfc_862' && styles.dbTabActive]}
            onPress={() => setCurrentDB('hfc_862')}
            activeOpacity={0.7}
          >
            <Text style={[styles.dbTabText, currentDB === 'hfc_862' && styles.dbTabTextActive]}>
              📡 HFC 862
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dbTab, currentDB === 'hfc_integration' && styles.dbTabActive]}
            onPress={() => setCurrentDB('hfc_integration')}
            activeOpacity={0.7}
          >
            <Text style={[styles.dbTabText, currentDB === 'hfc_integration' && styles.dbTabTextActive]}>
              🔧 Integration
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dbTab, currentDB === 'fttx' && styles.dbTabActive]}
            onPress={() => setCurrentDB('fttx')}
            activeOpacity={0.7}
          >
            <Text style={[styles.dbTabText, currentDB === 'fttx' && styles.dbTabTextActive]}>
              💡 FTTX
            </Text>
          </TouchableOpacity>
        </View>

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
              
              {/* Show HUB breakdown only for HFC 862 */}
              {currentDB === 'hfc_862' && (
                <>
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
            </>
          )}
        </View>

        {/* New Amplifier Button */}
        <TouchableOpacity 
          style={styles.newButton}
          onPress={() => setFormSelectorVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonIcon}>➕</Text>
          <Text style={styles.newButtonText}>Neuer Verstärker</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Form Type Selector */}
      <FormTypeSelector
        visible={formSelectorVisible}
        onSelect={(type) => {
          setSelectedFormType(type)
          setFormSelectorVisible(false)
        }}
        onClose={() => setFormSelectorVisible(false)}
      />

      {/* Search Screen */}
      <Modal visible={searchVisible} animationType="slide">
        <SearchScreen onClose={() => setSearchVisible(false)} currentDB={currentDB} />
      </Modal>

      {/* Create Amplifier Modal (HFC 862MHZ) */}
      {selectedFormType === 'hfc_862' && (
        <CreateAmplifierModal
          visible={selectedFormType === 'hfc_862'}
          onClose={() => setSelectedFormType(null)}
          onSuccess={() => {
            fetchStats()
            setSelectedFormType(null)
          }}
          dbType="hfc_862"
        />
      )}

      {/* Create HFC Integration Modal */}
      {selectedFormType === 'hfc_integration' && (
        <CreateHFCIntegrationModal
          visible={selectedFormType === 'hfc_integration'}
          onClose={() => setSelectedFormType(null)}
          onSuccess={() => {
            fetchStats()
            setSelectedFormType(null)
          }}
        />
      )}

      {/* Create FTTX Modal */}
      {selectedFormType === 'fttx' && (
        <CreateFTTXModal
          visible={selectedFormType === 'fttx'}
          onClose={() => setSelectedFormType(null)}
          onSuccess={() => {
            fetchStats()
            setSelectedFormType(null)
          }}
        />
      )}
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
  dbSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dbTab: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.silver300,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    ...Shadows.light,
  },
  dbTabActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
    ...Shadows.gold,
  },
  dbTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.silver700,
  },
  dbTabTextActive: {
    color: Colors.black,
    fontWeight: 'bold',
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
