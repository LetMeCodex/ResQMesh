import { useState, useEffect } from 'react';
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
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Global Firebase handles
let firebaseApp = null;
let firestoreDb = null;

const initFirebase = (configStr) => {
  if (!configStr.trim()) return { success: false, error: 'Empty config' };
  try {
    const config = JSON.parse(configStr);
    if (!config.apiKey || !config.projectId) {
      return { success: false, error: 'Missing key fields (apiKey, projectId)' };
    }
    
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    firestoreDb = getFirestore(firebaseApp);
    return { success: true, db: firestoreDb };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
const DEFAULT_FIREBASE_CONFIG = {
  projectId: "resqmesh-f37b7",
  appId: "1:758653027008:web:6b2ec3324e20dfae866325",
  storageBucket: "resqmesh-f37b7.firebasestorage.app",
  apiKey: "AIzaSyDKJTpMDRz9ldXe3TJaaoXEbF9o8D-UmHM",
  authDomain: "resqmesh-f37b7.firebaseapp.com",
  messagingSenderId: "758653027008",
  measurementId: "G-J6D9QKTNG4",
  projectNumber: "758653027008",
  version: "2"
};

export default function App() {
  // Navigation: 'home' | 'sos_form' | 'relay_status' | 'report_gap' | 'safe_zones' | 'settings'
  const [currentScreen, setCurrentScreen] = useState('home');
  
  // App states
  const [sosCategory, setSosCategory] = useState('Medical');
  const [sosMessage, setSosMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const batteryLevel = 12; // Boot in low battery mode for demo wow factor
  const nodesInRange = 4;
  const [volunteerMode, setVolunteerMode] = useState(false);
  const [batteryAwareRouting, setBatteryAwareRouting] = useState(true);
  
  // Custom Firebase & Waveform elements
  const [firebaseConfigText, setFirebaseConfigText] = useState(JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
  const [firebaseStatus, setFirebaseStatus] = useState('Disconnected');
  const [waveformBars, setWaveformBars] = useState([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);

  // Auto-connect Firebase on mount
  useEffect(() => {
    if (firebaseConfigText) {
      const res = initFirebase(firebaseConfigText);
      if (res.success) {
        setFirebaseStatus('Connected');
      } else {
        setFirebaseStatus('Error');
      }
    }
  }, []);

  // Simulation Relay states
  const [relayStep, setRelayStep] = useState(0); // 0: scanning, 1: found, 2: stored, 3: hopped, 4: uploaded
  const [relayLogs, setRelayLogs] = useState([]);

  // Resource gap states
  const [gapType, setGapType] = useState('Food & Water');
  const [gapQuantity, setGapQuantity] = useState('20');
  const [gapDesc, setGapDesc] = useState('');

  // Beacon & P2P Chat states
  const [morseFlasherActive, setMorseFlasherActive] = useState(false);
  const [isMorseFlashWhite, setIsMorseFlashWhite] = useState(false);
  const [acousticBeaconActive, setAcousticBeaconActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'hq', text: 'ResQMesh Command connected. Stay calm.', timestamp: '12:00 PM', status: 'delivered' },
    { id: 2, sender: 'survivor', text: 'Water is rising rapidly, need evacuation.', timestamp: '12:01 PM', status: 'delivered' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isChatRouting, setIsChatRouting] = useState(false);
  const [chatRoutingLogs, setChatRoutingLogs] = useState([]);

  // Pulsing animation value (using useState initializer to avoid ref access during render)
  const [pulseAnim] = useState(() => new Animated.Value(1));

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
  }, [pulseAnim]);

  // Waveform animation loop (no synchronous state update in effect body)
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setWaveformBars(
        Array.from({ length: 15 }, () => Math.floor(Math.random() * 45) + 5)
      );
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Voice recording simulation
  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      setSosMessage('बाढ़ का पानी हमारे घर में आ गया है, हम छत पर हैं। कोई मदद के लिए नाव भेज doc। (Water has entered our house, we are on the roof. Send a rescue boat)');
      setWaveformBars([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    } else {
      setIsRecording(true);
      setSosMessage('Listening to voice input... speak now...');
    }
  };

  // Morse SOS flasher loop (cleanup function handles state reset asynchronously/after-commit)
  useEffect(() => {
    if (!morseFlasherActive) return;
    const sosTimeline = [
      [1, 150], [0, 150], [1, 150], [0, 150], [1, 150],
      [0, 400],
      [1, 450], [0, 150], [1, 450], [0, 150], [1, 450],
      [0, 400],
      [1, 150], [0, 150], [1, 150], [0, 150], [1, 150],
      [0, 1200]
    ];
    let currentIndex = 0;
    let timeoutId = null;
    const runMorseStep = () => {
      const [state, duration] = sosTimeline[currentIndex];
      setIsMorseFlashWhite(state === 1);
      timeoutId = setTimeout(() => {
        currentIndex = (currentIndex + 1) % sosTimeline.length;
        runMorseStep();
      }, duration);
    };
    runMorseStep();
    return () => {
      clearTimeout(timeoutId);
      setIsMorseFlashWhite(false);
    };
  }, [morseFlasherActive]);

  // Acoustic beacon sound warning log simulator
  useEffect(() => {
    if (!acousticBeaconActive) return;
    const interval = setInterval(() => {
      console.log('[Acoustic Locator] Emitting periodic 2600Hz locator chime...');
    }, 1500);
    return () => clearInterval(interval);
  }, [acousticBeaconActive]);

  // Send survivor message through simulated multi-hop BLE mesh
  const handleSendSurvivorMessage = (text) => {
    if (!text.trim()) return;
    const msgId = Date.now();
    const newMsg = {
      id: msgId,
      sender: 'survivor',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'routing'
    };
    setChatMessages(prev => [...prev, newMsg]);
    setIsChatRouting(true);
    setNewMessageText('');
    
    const logs = [
      '🔄 Encrypting message envelope with AES-GCM...',
      '🔍 Scanning for offline mesh relays...',
      '📡 P2P handshake established with Phone_B (NDRF Ranger).'
    ];
    setChatRoutingLogs(logs);
    
    setTimeout(() => {
      setChatRoutingLogs(prev => [...prev, '✓ [1 Hop] Relayed to Phone B cache (RSSI: -68dBm)']);
    }, 800);
    
    setTimeout(() => {
      setChatRoutingLogs(prev => [...prev, '✓ [2 Hops] Relayed Phone B ➔ Phone C (Guide Karan)']);
    }, 1600);
    
    setTimeout(() => {
      setChatRoutingLogs(prev => [...prev, '🛰️ [3 Hops] Transmitted successfully to Phata Command center gateway.']);
      setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'delivered' } : m));
      setIsChatRouting(false);
    }, 2500);
  };

  // Upload to Firestore Database
  const uploadAlertToFirebase = async () => {
    if (!firestoreDb) {
      console.log('[Firebase] Not connected. Alert saved only locally.');
      return;
    }
    try {
      const alertData = {
        userId: 'survivor-' + Math.floor(Math.random() * 1000),
        name: 'Mobile Survivor Node ' + Math.floor(Math.random() * 100),
        emergencyType: sosCategory.toLowerCase(),
        decryptedMessage: sosMessage,
        lat: 30.6515 + (Math.random() - 0.5) * 0.04, // Slightly randomized around Gaurikund
        lng: 79.0270 + (Math.random() - 0.5) * 0.04,
        batteryAtTrigger: batteryLevel,
        hopCount: 3,
        createdAt: new Date().toISOString(),
        status: 'pending',
        assignedVolunteerId: null,
        aiSummary: '',
        severity: 'Pending AI', // Let the dashboard AI classify it
        priorityScore: 50,
        requiredResources: [],
        confidenceScore: 0,
        fakeRiskScore: 0,
        triageTimeline: [
          'SOS Packet Generated at Survivor Mobile Node',
          'P2P Multi-hop relay through mesh network',
          'Uploaded to central command center via gateway node'
        ]
      };
      await addDoc(collection(firestoreDb, 'alerts'), alertData);
      console.log('[Firebase] Alert synced successfully to Firestore!');
    } catch (e) {
      console.warn('[Firebase] Sync failed:', e);
    }
  };

  // Launch Simulated offline routing hops
  const handleBroadcastSOS = () => {
    if (!sosMessage.trim() || sosMessage === 'Listening to voice input... speak now...') {
      Alert.alert('Details Required', 'Please enter a description of the emergency.');
      return;
    }
    
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
      
      // Sync to Firebase
      uploadAlertToFirebase();
      
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
      {/* Morse Flasher Screen Overlay */}
      {morseFlasherActive && (
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isMorseFlashWhite ? '#FFFFFF' : '#FF4D4F',
            zIndex: 9999,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: isMorseFlashWhite ? '#000000' : '#FFFFFF', textAlign: 'center' }}>SOS FLASHING</Text>
          <Text style={{ fontSize: 12, color: isMorseFlashWhite ? '#333333' : '#E2E8F0', marginTop: 10, fontFamily: 'monospace' }}>
            {isMorseFlashWhite ? '⚪ FLASH (WHITE)' : '🔴 PAUSE (RED)'}
          </Text>
          <TouchableOpacity
            onPress={() => setMorseFlasherActive(false)}
            style={{ marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
          >
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>EXIT FLASHER</Text>
          </TouchableOpacity>
        </View>
      )}
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

            {/* Visual Waveform Animation */}
            {isRecording && (
              <View style={styles.waveformContainer}>
                {waveformBars.map((height, idx) => (
                  <View
                    key={idx}
                    style={[styles.waveformBar, { height: height }]}
                  />
                ))}
              </View>
            )}

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

        {/* SCREEN 7: CHAT */}
        {currentScreen === 'chat' && (
          <View style={styles.screenContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.screenTitle}>P2P Mesh Chat</Text>
              <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: 'rgba(59,130,246,0.15)' }}>
                <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: '700', fontFamily: 'monospace' }}>3-HOP TUNNEL</Text>
              </View>
            </View>

            <ScrollView 
              style={{
                backgroundColor: '#111827',
                borderRadius: 8,
                padding: 10,
                height: 250,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}
              contentContainerStyle={{ gap: 8 }}
            >
              {chatMessages.map(msg => (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'survivor' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'survivor' ? '#3B82F6' : '#1A2438',
                    padding: 8,
                    borderRadius: 10,
                    maxWidth: '85%'
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 13 }}>{msg.text}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 4, marginTop: 3, alignItems: 'center' }}>
                    <Text style={{ fontSize: 8, color: '#94A3B8' }}>{msg.timestamp}</Text>
                    {msg.sender === 'survivor' && (
                      <Text style={{ fontSize: 8, fontWeight: 'bold', color: msg.status === 'delivered' ? '#4ADE80' : '#FB923C' }}>
                        {msg.status === 'delivered' ? '✓' : '⟳'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {isChatRouting && chatRoutingLogs.length > 0 && (
              <View style={{ backgroundColor: '#0B1220', padding: 8, borderRadius: 6, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: '#22C55E' }}>
                <Text style={{ color: '#22C55E', fontFamily: 'monospace', fontSize: 9 }}>
                  {chatRoutingLogs[chatRoutingLogs.length - 1]}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                placeholder={isChatRouting ? "Routing packet..." : "Type text message..."}
                placeholderTextColor="#94a3b8"
                value={newMessageText}
                onChangeText={setNewMessageText}
              />
              <TouchableOpacity
                onPress={() => handleSendSurvivorMessage(newMessageText)}
                disabled={isChatRouting || !newMessageText.trim()}
                style={{ backgroundColor: '#3B82F6', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SCREEN 8: BEACONS */}
        {currentScreen === 'beacons' && (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>Emergency Beacons</Text>
            <Text style={styles.screenSubtitle}>Offline radio & visual warning beacons</Text>

            <View style={styles.settingRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.settingLabel}>Morse Screen Flasher</Text>
                <Switch
                  value={morseFlasherActive}
                  onValueChange={(val) => setMorseFlasherActive(val)}
                  trackColor={{ false: '#111827', true: '#FF4D4F' }}
                  thumbColor={morseFlasherActive ? '#ff7875' : '#94A3B8'}
                />
              </View>
              <Text style={styles.settingDesc}>
                Flashes screen red & white in a continuous SOS (... --- ...) sequence for search aircraft.
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.settingLabel}>Acoustic Locator Beep</Text>
                <Switch
                  value={acousticBeaconActive}
                  onValueChange={(val) => setAcousticBeaconActive(val)}
                  trackColor={{ false: '#111827', true: '#22C55E' }}
                  thumbColor={acousticBeaconActive ? '#4ADE80' : '#94A3B8'}
                />
              </View>
              <Text style={styles.settingDesc}>
                Triggers periodic high-frequency sound pings from the phone speaker for ground rescue teams.
              </Text>
            </View>
          </View>
        )}

        {/* SCREEN 6: SETTINGS */}
        {currentScreen === 'settings' && (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>ResQMesh Settings</Text>

            <View style={[styles.settingRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.settingLabel}>Battery-Aware Routing</Text>
                <Text style={styles.settingDesc}>Exclude node from heavy mesh relay transit if battery &lt; 20% to save critical power.</Text>
              </View>
              <Switch
                value={batteryAwareRouting}
                onValueChange={(val) => setBatteryAwareRouting(val)}
                trackColor={{ false: '#1A2438', true: '#22C55E' }}
                thumbColor={batteryAwareRouting ? '#4ADE80' : '#94A3B8'}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Firebase Integration</Text>
              <Text style={styles.settingDesc}>Status: <Text style={{ color: firebaseStatus === 'Connected' ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{firebaseStatus}</Text></Text>
              <TextInput
                style={[styles.textInput, { marginTop: 10, height: 100, fontSize: 12, fontFamily: 'monospace' }]}
                multiline
                numberOfLines={5}
                placeholder='Paste Firebase Config JSON here...'
                placeholderTextColor='#94a3b8'
                value={firebaseConfigText}
                onChangeText={setFirebaseConfigText}
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
              onPress={() => {
                if (firebaseConfigText.trim()) {
                  const res = initFirebase(firebaseConfigText);
                  if (res.success) {
                    setFirebaseStatus('Connected');
                    Alert.alert('Firebase Configured', 'Successfully connected to central Firebase backend!');
                  } else {
                    setFirebaseStatus('Error');
                    Alert.alert('Configuration Error', 'Invalid JSON config: ' + res.error);
                  }
                } else {
                  setFirebaseStatus('Disconnected');
                  firestoreDb = null;
                  firebaseApp = null;
                }
                setCurrentScreen('home');
              }}
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
          style={[styles.navItem, (currentScreen === 'home' || currentScreen === 'sos_form' || currentScreen === 'relay_status') && styles.navItemActive]}
        >
          <Text style={[styles.navText, (currentScreen === 'home' || currentScreen === 'sos_form' || currentScreen === 'relay_status') && styles.navTextActive]}>SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentScreen('chat')}
          style={[styles.navItem, currentScreen === 'chat' && styles.navItemActive]}
        >
          <Text style={[styles.navText, currentScreen === 'chat' && styles.navTextActive]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentScreen('beacons')}
          style={[styles.navItem, currentScreen === 'beacons' && styles.navItemActive]}
        >
          <Text style={[styles.navText, currentScreen === 'beacons' && styles.navTextActive]}>Beacons</Text>
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
    backgroundColor: '#F8F8F6',
  },
  header: {
    height: 80,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF3B30',
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  headerStatusText: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '600',
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
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
    color: '#1C1C1E',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
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
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  widgetValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34C759',
  },
  widgetDesc: {
    fontSize: 11,
    color: '#3A3A3C',
    lineHeight: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 11,
    color: '#8E8E93',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: -12,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryCardActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: '#FF3B30',
  },
  categoryCardText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  categoryCardTextActive: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  voiceBtn: {
    backgroundColor: '#E5E5EA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceBtnActive: {
    backgroundColor: '#FF3B30',
  },
  voiceBtnText: {
    color: '#1C1C1E',
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    color: '#1C1C1E',
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  textInputShort: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    color: '#1C1C1E',
    padding: 10,
    fontSize: 14,
    width: 100,
    marginBottom: 16,
  },
  telemetryCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  telemetryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  telemetryText: {
    fontSize: 10,
    color: '#3A3A3C',
    marginBottom: 2,
  },
  broadcastBtn: {
    backgroundColor: '#FF3B30',
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
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cancelBtnText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meshNodeActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#ffffff',
    shadowColor: '#FF3B30',
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
    backgroundColor: '#E5E5EA',
  },
  meshLineActive: {
    backgroundColor: '#FF3B30',
  },
  logsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  logsTerminal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    height: 150,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  logText: {
    color: '#34C759',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    marginBottom: 16,
    gap: 4,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  successBtn: {
    backgroundColor: '#34C759',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 14,
    borderRadius: 10,
  },
  safeZoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  safeZoneDesc: {
    fontSize: 11,
    color: '#3A3A3C',
    marginBottom: 4,
  },
  safeZoneDist: {
    fontSize: 11,
    color: '#007AFF',
  },
  settingRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 16,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
    borderTopColor: '#FF3B30',
  },
  navText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#FF3B30',
    fontWeight: '700',
  },
});
