import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  Switch,
  Alert
} from 'react-native';

export default function App() {
  // Navigation: 'home' | 'sos_form' | 'relay_status' | 'report_gap' | 'safe_zones' | 'settings'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [previousScreen, setPreviousScreen] = useState('home');
  
  // App states
  const [sosCategory, setSosCategory] = useState('Medical');
  const [sosMessage, setSosMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(12); // Boot in low battery mode for demo wow factor
  const [nodesInRange, setNodesInRange] = useState(4);
  const [volunteerMode, setVolunteerMode] = useState(false);
  const [batteryAwareRouting, setBatteryAwareRouting] = useState(true);

  // Simulation Relay states
  const [relayProgress, setRelayProgress] = useState(new Animated.Value(0));
  const [relayStep, setRelayStep] = useState(0); // 0: scanning, 1: found, 2: stored, 3: hopped, 4: uploaded
  const [relayLogs, setRelayLogs] = useState([]);

  // Resource gap states
  const [gapType, setGapType] = useState('Food & Water');
  const [gapQuantity, setGapQuantity] = useState('20');
  const [gapDesc, setGapDesc] = useState('');

  // Pulsing animation ref
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulsing loop for SOS button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Voice recording simulation
  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      setSosMessage('बाढ़ का पानी हमारे घर में आ गया है, हम छत पर हैं। कोई मदद के लिए नाव भेज दो। (Water has entered our house, we are on the roof. Send a rescue boat)');
    } else {
      setIsRecording(true);
      setSosMessage('Listening to voice input... speak now...');
    }
  };

  // Launch Simulated offline routing hops
  const handleBroadcastSOS = () => {
    if (!sosMessage.trim()) {
      Alert.alert('Details Required', 'Please enter a description of the emergency.');
      return;
    }
    
    setPreviousScreen(currentScreen);
    setCurrentScreen('relay_status');
    setRelayStep(0);
    setRelayLogs([
      'Initializing local Bluetooth LE scanning...',
      'Encrypting coordinates & payload with Rescue Public Key...'
    ]);

    // Simulated timing logs
    setTimeout(() => {
      setRelayStep(1);
      setRelayLogs(prev => [...prev, '[P2P Link] Found Phone_B (RSSI: -64dB).']);
    }, 1500);

    setTimeout(() => {
      setRelayStep(2);
      setRelayLogs(prev => [...prev, '[Store & Forward] SOS packet written to Phone_B cache storage.']);
    }, 3000);

    setTimeout(() => {
      setRelayStep(3);
      setRelayLogs(prev => [...prev, '[Hop 2] Packet forwarded to Phone_C (RSSI: -71dB).']);
    }, 4500);

    setTimeout(() => {
      setRelayStep(4);
      setRelayLogs(prev => [...prev, '[Gateway Reached] Node Phone_C has active upload channel. Sent to Rescue Command.']);
      Alert.alert('SOS Uploaded', 'Your emergency alert has been securely relayed to the Rescue Dashboard.');
    }, 6000);
  };

  const handleReportGap = () => {
    if (!gapDesc.trim()) {
      Alert.alert('Details Required', 'Please describe the resource shortage.');
      return;
    }
    Alert.alert(
      'Resource Logged', 
      'Resource gap encrypted and broadcasted to local mesh ledger. Decryptable only at Emergency Headquarters.'
    );
    setGapDesc('');
    setCurrentScreen('home');
  };

  return (
    <View style={styles.container}>
      {/* =================================HEADER =================================*/}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>ResQMesh</Text>
        <View style={styles.headerStatusContainer}>
          <Text style={styles.headerStatusText}>Offline Mesh</Text>
          <View style={styles.statusDot} />
        </View>
      </View>

      {/* =================================SCREENS CONTROLLER =================================*/}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* SCREEN 1: HOME */}
        {currentScreen === 'home' && (
          <View style={styles.screenContainer}>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Disaster Offline Link</Text>
              <Text style={styles.heroSubtitle}>No Cell Service or Wi-Fi Required</Text>
            </View>

            {/* Pulsing SOS Button */}
            <View style={styles.sosButtonContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  onPress={() => setCurrentScreen('sos_form')}
                  style={styles.sosButton}
                >
                  <Text style={styles.sosButtonText}>SOS</Text>
                  <Text style={styles.sosButtonSubtext}>TAP TO SEND</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Nearby nodes widget */}
            <View style={styles.widgetCard}>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetTitle}>Nearby Network Nodes</Text>
                <Text style={styles.widgetValue}>{nodesInRange} Active</Text>
              </View>
              {batteryLevel < 20 && batteryAwareRouting ? (
                <Text style={[styles.widgetDesc, { color: '#f87171', fontWeight: '600' }]}>
                  ⚠️ Power Saver Active: Mesh transit routing suspended to conserve battery (Level: {batteryLevel}%).
                </Text>
              ) : (
                <Text style={styles.widgetDesc}>
                  Your phone is currently acting as a relay, storing and forwarding 2 transit packets for nearby survivors.
                </Text>
              )}
            </View>

            {/* Volunteer mode toggle */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Volunteer Mode</Text>
                <Text style={styles.toggleDesc}>Offer local medical or swimming aid</Text>
              </View>
              <Switch
                value={volunteerMode}
                onValueChange={(val) => {
                  setVolunteerMode(val);
                  Alert.alert('Volunteer Status', val ? 'You are now registered as an active local responder.' : 'Volunteer mode disabled.');
                }}
                trackColor={{ false: '#1A2438', true: '#22C55E' }}
                thumbColor={volunteerMode ? '#4ADE80' : '#94A3B8'}
              />
            </View>
          </View>
        )}

        {/* SCREEN 2: SOS FORM */}
        {currentScreen === 'sos_form' && (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>Emergency Details</Text>

            <Text style={styles.label}>Emergency Category</Text>
            <View style={styles.categoryGrid}>
              {['Medical', 'Trapped', 'Fire', 'Food & Water'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryCard, sosCategory === cat && styles.categoryCardActive]}
                  onPress={() => setSosCategory(cat)}
                >
                  <Text style={[styles.categoryCardText, sosCategory === cat && styles.categoryCardTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Voice dictate button */}
            <TouchableOpacity
              onPress={handleToggleVoice}
              style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
            >
              <Text style={styles.voiceBtnText}>{isRecording ? 'Recording Offline... Tap to Stop' : 'Dictate Emergency Voice Input'}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>SOS Description</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              placeholder="Describe situation (e.g. number of people trapped, insulin required, flooding level)..."
              placeholderTextColor="#94a3b8"
              value={sosMessage}
              onChangeText={setSosMessage}
            />

            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryTitle}>Auto-Attached Telemetry:</Text>
              <Text style={styles.telemetryText}>• Location: {batteryLevel > 0 ? 'GPS Coordinates Locked' : 'Searching'}</Text>
              <Text style={styles.telemetryText}>• Telemetry Battery: {batteryLevel}%</Text>
              <Text style={styles.telemetryText}>• Encryption Standard: Hybrid AES-GCM Envelope</Text>
            </View>

            <TouchableOpacity
              onPress={handleBroadcastSOS}
              style={styles.broadcastBtn}
            >
              <Text style={styles.broadcastBtnText}>Broadcast Offline SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentScreen('home')}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN 3: RELAY TRANSIT PROGRESS */}
        {currentScreen === 'relay_status' && (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>Mesh Relay Routing</Text>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(relayStep / 4) * 100}%` }]} />
            </View>

            {/* Node visualizer diagram */}
            <View style={styles.meshVisualizer}>
              <View style={[styles.meshNode, styles.meshNodeActive]}>
                <Text style={styles.meshNodeText}>You</Text>
              </View>
              <View style={[styles.meshLine, relayStep >= 1 && styles.meshLineActive]} />
              <View style={[styles.meshNode, relayStep >= 1 && styles.meshNodeActive]}>
                <Text style={styles.meshNodeText}>Node B</Text>
              </View>
              <View style={[styles.meshLine, relayStep >= 3 && styles.meshLineActive]} />
              <View style={[styles.meshNode, relayStep >= 3 && styles.meshNodeActive]}>
                <Text style={styles.meshNodeText}>Node C</Text>
              </View>
              <View style={[styles.meshLine, relayStep >= 4 && styles.meshLineActive]} />
              <View style={[styles.meshNode, relayStep >= 4 && styles.meshNodeActive]}>
                <Text style={styles.meshNodeText}>Gateway</Text>
              </View>
            </View>

            <Text style={styles.logsLabel}>P2P Mesh Network Log:</Text>
            <View style={styles.logsTerminal}>
              {relayLogs.map((log, index) => (
                <Text key={index} style={styles.logText}> {log}</Text>
              ))}
              {relayStep < 4 && <ActivityIndicator size="small" color="#81c784" style={{ marginTop: 8 }} />}
            </View>

            {relayStep === 4 && (
              <TouchableOpacity
                onPress={() => setCurrentScreen('home')}
                style={styles.successBtn}
              >
                <Text style={styles.successBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* SCREEN 4: REPORT GAP */}
        {currentScreen === 'report_gap' && (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>Report Resource Gap</Text>

            <Text style={styles.label}>Resource Needed</Text>
            <View style={styles.categoryGrid}>
              {['Food & Water', 'Medicine', 'Shelter', 'Boat/Transport'].map((res) => (
                <TouchableOpacity
                  key={res}
                  style={[styles.categoryCard, gapType === res && styles.categoryCardActive]}
                  onPress={() => setGapType(res)}
                >
                  <Text style={[styles.categoryCardText, gapType === res && styles.categoryCardTextActive]}>{res}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Quantity/Capacity Required</Text>
            <TextInput
              style={styles.textInputShort}
              keyboardType="numeric"
              value={gapQuantity}
              onChangeText={setGapQuantity}
            />

            <Text style={styles.label}>Gap Details / Location Description</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="e.g. 15 families waiting for drinking water at Sector 3 bridge point..."
              placeholderTextColor="#94a3b8"
              value={gapDesc}
              onChangeText={setGapDesc}
            />

            <TouchableOpacity
              onPress={handleReportGap}
              style={styles.broadcastBtn}
            >
              <Text style={styles.broadcastBtnText}>Broadcast Gap details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentScreen('home')}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN 5: SAFE ZONES LISTINGS */}
        {currentScreen === 'safe_zones' && (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>Nearby Relief & Safe Zones</Text>
            <Text style={styles.screenSubtitle}>Cached details for offline maps navigation</Text>

            <View style={styles.safeZoneList}>
              <View style={styles.safeZoneCard}>
                <Text style={styles.safeZoneTitle}>St. Mary Relief Camp</Text>
                <Text style={styles.safeZoneDesc}>Status: Open (85/200 beds occupied)</Text>
                <Text style={styles.safeZoneDist}>Distance: 420m • Direction: NE</Text>
              </View>

              <View style={styles.safeZoneCard}>
                <Text style={styles.safeZoneTitle}>Apex Hospital Clinic</Text>
                <Text style={styles.safeZoneDesc}>Status: Open (92/100 capacity)</Text>
                <Text style={styles.safeZoneDist}>Distance: 780m • Direction: W</Text>
              </View>

              <View style={styles.safeZoneCard}>
                <Text style={styles.safeZoneTitle}>Youth Club Relief Center</Text>
                <Text style={styles.safeZoneDesc}>Status: Full (150/150 capacity)</Text>
                <Text style={styles.safeZoneDist}>Distance: 1.1km • Direction: SE</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setCurrentScreen('home')}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN 6: SETTINGS */}
        {currentScreen === 'settings' && (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>ResQMesh Settings</Text>

            <View style={[styles.settingRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingLabel}>Battery-Aware Routing</Text>
                <Text style={styles.settingDesc}>Exclude node from heavy mesh relay transit if battery < 20% to save critical power.</Text>
              </View>
              <Switch
                value={batteryAwareRouting}
                onValueChange={(val) => setBatteryAwareRouting(val)}
                trackColor={{ false: '#1A2438', true: '#22C55E' }}
                thumbColor={batteryAwareRouting ? '#4ADE80' : '#94A3B8'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Default Broadcast Range</Text>
              <Text style={styles.settingDesc}>Optimized BLE advertising range set to 15m (Line of Sight).</Text>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Device Relay Capacity</Text>
              <Text style={styles.settingDesc}>Maximum storage cache buffer: 50 packets.</Text>
            </View>

            <TouchableOpacity
              onPress={() => setCurrentScreen('home')}
              style={styles.successBtn}
            >
              <Text style={styles.successBtnText}>Save & Exit</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* =================================BOTTOM NAVIGATION =================================*/}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => setCurrentScreen('home')}
          style={[styles.navItem, currentScreen === 'home' && styles.navItemActive]}
        >
          <Text style={[styles.navText, currentScreen === 'home' && styles.navTextActive]}>SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentScreen('report_gap')}
          style={[styles.navItem, currentScreen === 'report_gap' && styles.navItemActive]}
        >
          <Text style={[styles.navText, currentScreen === 'report_gap' && styles.navTextActive]}>Report Gap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentScreen('safe_zones')}
          style={[styles.navItem, currentScreen === 'safe_zones' && styles.navItemActive]}
        >
          <Text style={[styles.navText, currentScreen === 'safe_zones' && styles.navTextActive]}>Safe Zones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentScreen('settings')}
          style={[styles.navItem, currentScreen === 'settings' && styles.navItemActive]}
        >
          <Text style={[styles.navText, currentScreen === 'settings' && styles.navTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    height: 80,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF4D4F',
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  headerStatusText: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  screenContainer: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  sosButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF4D4F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D4F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  sosButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sosButtonSubtext: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  widgetCard: {
    backgroundColor: '#1A2438',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  widgetValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22C55E',
  },
  widgetDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A2438',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: -12,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1A2438',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryCardActive: {
    backgroundColor: 'rgba(255, 77, 79, 0.1)',
    borderColor: '#FF4D4F',
  },
  categoryCardText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  categoryCardTextActive: {
    color: '#FF4D4F',
    fontWeight: '700',
  },
  voiceBtn: {
    backgroundColor: '#22304A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceBtnActive: {
    backgroundColor: '#FF4D4F',
  },
  voiceBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#ffffff',
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  textInputShort: {
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#ffffff',
    padding: 10,
    fontSize: 14,
    width: 100,
    marginBottom: 16,
  },
  telemetryCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  telemetryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
    marginBottom: 4,
  },
  telemetryText: {
    fontSize: 10,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  broadcastBtn: {
    backgroundColor: '#FF4D4F',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  broadcastBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#111827',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF4D4F',
  },
  meshVisualizer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  meshNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A2438',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meshNodeActive: {
    backgroundColor: '#FF4D4F',
    borderColor: '#ffffff',
    shadowColor: '#FF4D4F',
    shadowRadius: 10,
    elevation: 4,
  },
  meshNodeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  meshLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#111827',
  },
  meshLineActive: {
    backgroundColor: '#FF4D4F',
  },
  logsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  logsTerminal: {
    backgroundColor: '#0B1220',
    borderRadius: 8,
    padding: 12,
    height: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  logText: {
    color: '#22C55E',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 4,
  },
  successBtn: {
    backgroundColor: '#22C55E',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  successBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  safeZoneList: {
    gap: 12,
    marginBottom: 20,
  },
  safeZoneCard: {
    backgroundColor: '#1A2438',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 10,
  },
  safeZoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  safeZoneDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    marginBottom: 4,
  },
  safeZoneDist: {
    fontSize: 11,
    color: '#3B82F6',
  },
  settingRow: {
    backgroundColor: '#1A2438',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#FF4D4F',
  },
  navText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#FF4D4F',
    fontWeight: '700',
  },
});
