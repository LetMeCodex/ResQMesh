import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Shield,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  MapPin,
  Battery,
  Send,
  Mic,
  MicOff,
  User,
  Map,
  Settings,
  ShieldAlert,
  Globe,
  RefreshCw,
  Navigation,
  Lock,
  Unlock,
  Layers,
  CheckCircle,
  Database,
  Radio,
  AlertOctagon,
  TrendingDown,
  Cpu,
  Compass,
  Zap
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Global Firebase handles
let firebaseApp = null;
let firestoreDb = null;

const DEFAULT_FIREBASE_CONFIG = {
  projectId: "directionless-beauty",
  appId: "1:485571902380:web:a3a36461958398ed93d809",
  storageBucket: "directionless-beauty.firebasestorage.app",
  apiKey: "AIzaSyD8vJJNF3OWGJgGaaRG55BxecVxDO9hhSE",
  authDomain: "directionless-beauty.firebaseapp.com",
  messagingSenderId: "485571902380",
  measurementId: "G-CH6RPYYJ3S",
  projectNumber: "485571902380",
  version: "2"
};

const initFirebase = (configStrOrObj) => {
  try {
    let config = null;
    if (typeof configStrOrObj === 'string') {
      if (!configStrOrObj.trim()) return { success: false, error: 'Empty config' };
      config = JSON.parse(configStrOrObj);
    } else {
      config = configStrOrObj;
    }
    
    if (!config || !config.apiKey || !config.projectId) {
      return { success: false, error: 'Missing key fields (apiKey, projectId)' };
    }
    
    const apps = getApps();
    if (apps.length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = apps[0];
    }
    firestoreDb = getFirestore(firebaseApp);
    return { success: true, db: firestoreDb };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Web Audio Synthesizer for Offline Hardware Command Sound Effects with Spatial Stereo Panning
const playSystemSound = (type, pan = 0) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Helper to route oscillator through gain and optional panner
    const routeNode = (sourceNode, gainNode) => {
      sourceNode.connect(gainNode);
      if (pan !== 0 && audioCtx.createStereoPanner) {
        const panner = audioCtx.createStereoPanner();
        panner.pan.setValueAtTime(pan, audioCtx.currentTime);
        gainNode.connect(panner);
        panner.connect(audioCtx.destination);
      } else {
        gainNode.connect(audioCtx.destination);
      }
    };
    
    if (type === 'confirm' || type === 'rescueAssigned') {
      // Harmonious dual chime (rescue assigned)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();
      
      routeNode(osc1, gain1);
      routeNode(osc2, gain2);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.setValueAtTime(0.035, audioCtx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.5);
      return;
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    routeNode(osc, gainNode);

    if (type === 'ping' || type === 'relayConnected') {
      // Soft digital ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'tick' || type === 'aiPrediction') {
      // Subtle synth tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
    } else if (type === 'alarm' || type === 'landslideWarning') {
      // Muted alarm burst
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'sos' || type === 'sosTransmitted') {
      // Low-frequency pulse
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } else if (type === 'beep') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'connect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, audioCtx.currentTime);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn('AudioContext blocked or unavailable:', e);
  }
};

// Tactical FEMA-style 2-burst alert siren — control room tone, NOT ambulance
const playAlertSiren = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Burst 1: low rumble sweep
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc1.frequency.linearRampToValueAtTime(260, audioCtx.currentTime + 0.4);
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.55);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.55);
    // Burst 2: sharper high-alert ping (offset)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.55);
    osc2.frequency.linearRampToValueAtTime(660, audioCtx.currentTime + 0.9);
    gain2.gain.setValueAtTime(0.055, audioCtx.currentTime + 0.55);
    gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.0);
    osc2.start(audioCtx.currentTime + 0.55);
    osc2.stop(audioCtx.currentTime + 1.0);
  } catch (e) {
    console.warn('Alert siren unavailable:', e);
  }
};

// Manual mock DB keys
const STORAGE_KEY_ALERTS = 'resqmesh_alerts_db';
const STORAGE_KEY_RESOURCES = 'resqmesh_resources_db';
const STORAGE_KEY_VOLUNTEERS = 'resqmesh_volunteers_db';
const STORAGE_KEY_SETTINGS = 'resqmesh_app_settings';

// Default initial data for Leaflet maps
const INITIAL_SAFE_ZONES = [
  { safeZoneId: 'sz-1', name: 'Sonprayag Base Command Hub', type: 'shelter', capacityMax: 500, capacityCurrent: 385, lat: 30.6342, lng: 79.0145, contact: '+91 1372 25211', status: 'open' },
  { safeZoneId: 'sz-2', name: 'Gaurikund Medical Relief Camp', type: 'hospital', capacityMax: 150, capacityCurrent: 124, lat: 30.6515, lng: 79.0270, contact: '+91 1372 25212', status: 'open' },
  { safeZoneId: 'sz-3', name: 'Phata Helicopter Dispatch Base', type: 'hospital', capacityMax: 80, capacityCurrent: 42, lat: 30.5732, lng: 79.0435, contact: '+91 1372 25213', status: 'open' },
  { safeZoneId: 'sz-4', name: 'Kedarnath Temple High-Altitude Shelter', type: 'shelter', capacityMax: 200, capacityCurrent: 195, lat: 30.7346, lng: 79.0669, contact: '+91 1372 25214', status: 'full' }
];

const INITIAL_VOLUNTEERS = [
  { volunteerId: 'v-1', name: 'Devendra Singh (ITBP Ranger)', skills: ['mountain_climbing', 'rescue_diver'], availability: 'active', lat: 30.6342, lng: 79.0145, phone: '+91 94120 77101', assignedAlertId: null },
  { volunteerId: 'v-2', name: 'Dr. Amit Negi (NDRF Medic)', skills: ['medical', 'altitude_trauma'], availability: 'active', lat: 30.6515, lng: 79.0270, phone: '+91 94120 77102', assignedAlertId: null },
  { volunteerId: 'v-3', name: 'Karan Thapa (Local Mountain Guide)', skills: ['swimming', 'survival'], availability: 'active', lat: 30.6865, lng: 79.0550, phone: '+91 94120 77103', assignedAlertId: null }
];

const INITIAL_ALERTS = [
  {
    alertId: 'alert-1',
    userId: 'user-901',
    name: 'Suresh Rawat (Rambara)',
    emergencyType: 'trapped',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b71c',
    decryptedMessage: 'Cloudburst triggered landslide. Gaurikund trail washed away. 15 pilgrims trapped in cave near Mandakini river. Rising waters.',
    lat: 30.6865,
    lng: 79.055,
    plusCode: '8H7V69Q8+4C',
    batteryAtTrigger: 45,
    hopCount: 2,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'assigned',
    assignedVolunteerId: 'v-1',
    aiSummary: '15 pilgrims trapped near Mandakini river at Rambara due to trail washout.',
    severity: 'Critical',
    priorityScore: 96,
    suggestedAction: 'NH-107 landslide blockage nearby. Air dispatch drone route with thermal emergency kit.',
    requiredResources: ['rescue_boat', 'swimming'],
    confidenceScore: 98,
    fakeRiskScore: 4,
    triageTimeline: [
      '10:02 AM - SOS Packet Generated at Rambara Cave',
      '10:14 AM - Relayed by Guide Karan Thapa (v-3)',
      '10:25 AM - Uploaded via Phata Gateway Base',
      '10:26 AM - AI Priority Classified: Critical (96/100)'
    ]
  },
  {
    alertId: 'alert-2',
    userId: 'user-902',
    name: 'Priyanshu Sharma (Kedarnath Guesthouse)',
    emergencyType: 'medical',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b71d',
    decryptedMessage: 'Severe head injury from falling boulder. Unconscious. Local shelter has no oxygen/first aid. Bleeding heavily.',
    lat: 30.738,
    lng: 79.071,
    plusCode: '8H7V79H3+5M',
    batteryAtTrigger: 32,
    hopCount: 3,
    createdAt: new Date(Date.now() - 3000000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: 'Unconscious victim with severe head injury and active bleeding at Kedarnath Guesthouse.',
    severity: 'Critical',
    priorityScore: 95,
    suggestedAction: 'Immediate dispatch of paramedic unit Amit Negi. Request priority helicopter medical evacuation window.',
    requiredResources: ['medicine', 'first_aid'],
    confidenceScore: 97,
    fakeRiskScore: 3,
    triageTimeline: [
      '10:12 AM - SOS Packet Generated at Kedarnath Guesthouse',
      '10:20 AM - Relayed by ITBP Node (v-1)',
      '10:27 AM - Uploaded via Phata Gateway Base',
      '10:28 AM - AI Priority Classified: Critical (95/100)'
    ]
  },
  {
    alertId: 'alert-3',
    userId: 'user-903',
    name: 'Sunita Devi (Jungle Chatti)',
    emergencyType: 'trapped',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b71e',
    decryptedMessage: 'Flash flood swept away temporary bridge. 8 survivors isolated on a high boulder. Battery at 9%.',
    lat: 30.665,
    lng: 79.035,
    plusCode: '8H7V69H4+2X',
    batteryAtTrigger: 9,
    hopCount: 1,
    createdAt: new Date(Date.now() - 2400000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: '8 survivors stranded on a high boulder after flash floods washed out a bridge at Jungle Chatti.',
    severity: 'Critical',
    priorityScore: 94,
    suggestedAction: 'Deploy rescue boat or high-line rope rig system. Critical battery warning (9%). Dispatch volunteers immediately.',
    requiredResources: ['rescue_boat', 'swimming', 'survival'],
    confidenceScore: 96,
    fakeRiskScore: 5,
    triageTimeline: [
      '10:22 AM - SOS Packet Generated at Jungle Chatti',
      '10:29 AM - Relayed by Guide Karan Thapa (v-3)',
      '10:35 AM - Uploaded via Phata Gateway Base',
      '10:36 AM - AI Priority Classified: Critical (94/100)'
    ]
  },
  {
    alertId: 'alert-4',
    userId: 'user-904',
    name: 'Meera Bisht (Kedarnath Base)',
    emergencyType: 'medical',
    encryptedPayload: 'T3FkZGVkX2+vGjV/j74XGqM566oOxiQ...',
    iv: 'f7f9fc2e7d32',
    decryptedMessage: 'Asthmatic hiker with fractured tibia. Nebulizer/splints depleted. Fog blocking helipad. Need air-drop splints/neb.',
    lat: 30.7346,
    lng: 79.0669,
    plusCode: '8H7V79C5+7R',
    batteryAtTrigger: 18,
    hopCount: 1,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: 'Acute asthma attack and tibia fracture. Local emergency supplies depleted.',
    severity: 'High',
    priorityScore: 88,
    suggestedAction: 'Prepare volunteer Amit Negi for heli window or dispatch heavy terrain drone with inhaler/splint.',
    requiredResources: ['medicine'],
    confidenceScore: 92,
    fakeRiskScore: 8,
    triageTimeline: [
      '10:20 AM - SOS Packet Generated at Kedarnath Shelter',
      '10:28 AM - Relayed by ITBP Node (v-1)',
      '10:35 AM - Uploaded via Phata Gateway Base',
      '10:36 AM - AI Priority Classified: High (88/100)'
    ]
  },
  {
    alertId: 'alert-5',
    userId: 'user-905',
    name: 'Rajesh Karki (Sonprayag Ascent)',
    emergencyType: 'medical',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b71f',
    decryptedMessage: 'Elderly group of 5 stranded. Severe hypothermia setting in due to continuous cold rain. Need blankets and hot water.',
    lat: 30.628,
    lng: 79.021,
    plusCode: '8H7V58F4+6T',
    batteryAtTrigger: 54,
    hopCount: 2,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: 'Elderly group of 5 facing severe hypothermia from cold rain on Sonprayag ascent.',
    severity: 'High',
    priorityScore: 82,
    suggestedAction: 'Direct nearby Sonprayag volunteers to dispatch thermal blankets and hot rations immediately.',
    requiredResources: ['survival', 'food_water'],
    confidenceScore: 94,
    fakeRiskScore: 5,
    triageTimeline: [
      '10:32 AM - SOS Packet Generated at Sonprayag Trail',
      '10:41 AM - Relayed by Gaurikund NDRF Node (v-2)',
      '10:48 AM - Uploaded via Phata Gateway Base',
      '10:49 AM - AI Priority Classified: High (82/100)'
    ]
  },
  {
    alertId: 'alert-6',
    userId: 'user-906',
    name: 'Vikram Bhandari (Sonprayag)',
    emergencyType: 'food_water',
    encryptedPayload: 'K2ZkZGVkX2+vGjV/j74XGqM928oOxiQ...',
    iv: 'fb8c001565c0',
    decryptedMessage: 'Landslide blocked NH-107. Evacuation vehicles halted. 150 people need water and dry rations.',
    lat: 30.6342,
    lng: 79.0145,
    plusCode: '8H7V68H2+3V',
    batteryAtTrigger: 88,
    hopCount: 3,
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: 'NH-107 landslide blockage. 150 stranded evacuees facing severe water/rations deficit.',
    severity: 'Medium',
    priorityScore: 72,
    suggestedAction: 'Coordinate ITBP supply trucks to relocate rations from Guptkashi HQ.',
    requiredResources: ['food_water'],
    confidenceScore: 94,
    fakeRiskScore: 6,
    triageTimeline: [
      '09:40 AM - SOS Packet Generated at Sonprayag Bridge',
      '09:55 AM - Relayed by Gaurikund NDRF Node (v-2)',
      '10:10 AM - Uploaded via Phata Gateway Base',
      '10:11 AM - AI Priority Classified: Medium (72/100)'
    ]
  },
  {
    alertId: 'alert-7',
    userId: 'user-907',
    name: 'Devendra Negi (Gaurikund Base)',
    emergencyType: 'food_water',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b720',
    decryptedMessage: 'Rations depletion. Need backup dry food packs for 40 refugees at the local primary school.',
    lat: 30.648,
    lng: 79.03,
    plusCode: '8H7V68Q5+8B',
    batteryAtTrigger: 75,
    hopCount: 2,
    createdAt: new Date(Date.now() - 600000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: '40 refugees at Gaurikund primary school facing ration exhaustion.',
    severity: 'Medium',
    priorityScore: 68,
    suggestedAction: 'Direct mobile volunteers to deliver dry food packs from the Phata dispatch depot.',
    requiredResources: ['food_water'],
    confidenceScore: 91,
    fakeRiskScore: 7,
    triageTimeline: [
      '10:45 AM - SOS Packet Generated at Gaurikund school',
      '10:52 AM - Relayed by Guide Karan Thapa (v-3)',
      '10:58 AM - Uploaded via Phata Gateway Base',
      '10:59 AM - AI Priority Classified: Medium (68/100)'
    ]
  },
  {
    alertId: 'alert-8',
    userId: 'user-908',
    name: 'Karan Bhandari (Rambara Bypass)',
    emergencyType: 'trapped',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b721',
    decryptedMessage: 'Stranded on ridge above landslide zone. 4 elderly people with joint pain. Ground paths blocked.',
    lat: 30.689,
    lng: 79.052,
    plusCode: '8H7V69Q6+7X',
    batteryAtTrigger: 40,
    hopCount: 2,
    createdAt: new Date(Date.now() - 400000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: 'Stranded on ridge above landslide zone. 4 elderly pilgrims trapped with limited mobility.',
    severity: 'High',
    priorityScore: 85,
    suggestedAction: 'Dispatch volunteer with high-line gear to evacuate from the ridge.',
    requiredResources: ['survival'],
    confidenceScore: 94,
    fakeRiskScore: 2,
    triageTimeline: [
      '11:02 AM - SOS Packet Generated at Rambara Ridge Bypass',
      '11:10 AM - Relayed by local guides',
      '11:15 AM - Uploaded via Phata Gateway Base',
      '11:16 AM - AI Priority Classified: High (85/100)'
    ]
  },
  {
    alertId: 'alert-9',
    userId: 'user-909',
    name: 'Aisha Rawat (Gaurikund Temple Path)',
    emergencyType: 'medical',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b722',
    decryptedMessage: 'Diabetic patient has run out of insulin. High fever and weakness. Need emergency medical kit.',
    lat: 30.655,
    lng: 79.029,
    plusCode: '8H7V68R5+3A',
    batteryAtTrigger: 25,
    hopCount: 1,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: 'Diabetic patient requiring emergency insulin supply on Gaurikund path.',
    severity: 'Critical',
    priorityScore: 97,
    suggestedAction: 'Immediate dispatch of paramedic unit with insulin/cool pack.',
    requiredResources: ['medicine', 'first_aid'],
    confidenceScore: 98,
    fakeRiskScore: 1,
    triageTimeline: [
      '11:12 AM - SOS Packet Generated at Gaurikund path',
      '11:14 AM - Relayed by ITBP Node (v-1)',
      '11:18 AM - Uploaded via Phata Gateway Base',
      '11:19 AM - AI Priority Classified: Critical (97/100)'
    ]
  },
  {
    alertId: 'alert-10',
    userId: 'user-910',
    name: 'Devendra Singh (Bheembali)',
    emergencyType: 'food_water',
    encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
    iv: 'e53935a8b723',
    decryptedMessage: 'Foot bridge collapsed. 12 people isolated without drinking water for 24 hours.',
    lat: 30.672,
    lng: 79.04,
    plusCode: '8H7V69M3+5T',
    batteryAtTrigger: 62,
    hopCount: 2,
    createdAt: new Date(Date.now() - 100000).toISOString(),
    status: 'pending',
    assignedVolunteerId: null,
    aiSummary: '12 people isolated without food/water due to bridge collapse at Bheembali.',
    severity: 'Medium',
    priorityScore: 70,
    suggestedAction: 'Launch UAV supply drop with water filtration packs and food rations.',
    requiredResources: ['food_water'],
    confidenceScore: 90,
    fakeRiskScore: 3,
    triageTimeline: [
      '11:22 AM - SOS Packet Generated at Bheembali Bridge',
      '11:28 AM - Relayed by local guides',
      '11:32 AM - Uploaded via Phata Gateway Base',
      '11:33 AM - AI Priority Classified: Medium (70/100)'
    ]
  }
];

const INITIAL_RESOURCES = [
  { resourceId: 'res-1', type: 'food_water', quantity: 600, isAvailable: true, lat: 30.5262, lng: 79.0765, description: '600 rations cases & clean water crates at Guptkashi Command HQ.', reportedGap: false },
  { resourceId: 'res-2', type: 'medicine', quantity: 120, isAvailable: true, lat: 30.5732, lng: 79.0435, description: 'Trauma medicine, nebulizer packs, splints at Phata Heli dispatch.', reportedGap: false },
  { resourceId: 'res-3', type: 'food_water', quantity: 300, isAvailable: false, lat: 30.7346, lng: 79.0669, description: 'Critical dry rations depletion reported for isolated Kedarnath pilgrims.', reportedGap: true }
];

export default function App() {
  // --- Global State ---
  const [alerts, setAlerts] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0 && parsed[0].lat < 26) {
          localStorage.removeItem(STORAGE_KEY_ALERTS);
          localStorage.removeItem(STORAGE_KEY_RESOURCES);
          localStorage.removeItem(STORAGE_KEY_VOLUNTEERS);
          return INITIAL_ALERTS;
        }
        if (parsed.length > 10) {
          return parsed.slice(0, 10);
        }
        return parsed;
      } catch {
        return INITIAL_ALERTS;
      }
    }
    return INITIAL_ALERTS;
  });
  const [resources, setResources] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY_RESOURCES);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0 && parsed[0].lat < 26) {
          return INITIAL_RESOURCES;
        }
        return parsed;
      } catch {
        return INITIAL_RESOURCES;
      }
    }
    return INITIAL_RESOURCES;
  });
  const [volunteers, setVolunteers] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY_VOLUNTEERS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0 && parsed[0].lat < 26) {
          return INITIAL_VOLUNTEERS;
        }
        return parsed;
      } catch {
        return INITIAL_VOLUNTEERS;
      }
    }
    return INITIAL_VOLUNTEERS;
  });
  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const defaultKey = 'AQ.Ab8RN6Lr-pMhbTm4mbYslC3CKV6UR8nWOeO6iDSixi-8ddbBHA';
    const defaultFirebaseConfigStr = JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2);
    if (!cached) return { geminiApiKey: defaultKey, offlineSync: true, firebaseConfigText: defaultFirebaseConfigStr };
    try {
      const parsed = JSON.parse(cached);
      return {
        geminiApiKey: parsed.geminiApiKey || defaultKey,
        offlineSync: parsed.offlineSync ?? true,
        firebaseConfigText: parsed.firebaseConfigText || defaultFirebaseConfigStr
      };
    } catch {
      return { geminiApiKey: defaultKey, offlineSync: true, firebaseConfigText: defaultFirebaseConfigStr };
    }
  });

  // Local state persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  }, [alerts]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(resources));
  }, [resources]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOLUNTEERS, JSON.stringify(volunteers));
  }, [volunteers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Dashboard state variables
  const [dashboardOfflineMode, setDashboardOfflineMode] = useState(false);
  const [displayAlertsCount, setDisplayAlertsCount] = useState(alerts.length);
  useEffect(() => {
    if (displayAlertsCount < alerts.length) {
      const timeout = setTimeout(() => setDisplayAlertsCount(prev => prev + 1), 150);
      return () => clearTimeout(timeout);
    } else if (displayAlertsCount > alerts.length) {
      const timeout = setTimeout(() => setDisplayAlertsCount(alerts.length), 0);
      return () => clearTimeout(timeout);
    }
  }, [alerts.length, displayAlertsCount]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDecryptionView, setShowDecryptionView] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  
  const [firebaseStatus, setFirebaseStatus] = useState('Disconnected');
  const [mobileView, setMobileView] = useState('victim'); // 'victim' | 'map' | 'command' (mobile responsiveness state)

  // Initialize Firebase on mount / setting change
  useEffect(() => {
    if (settings.firebaseConfigText) {
      const res = initFirebase(settings.firebaseConfigText);
      if (res.success) {
        setFirebaseStatus('Connected');
        console.log('Firebase initialized successfully');
      } else {
        setFirebaseStatus('Error');
        console.warn('Firebase init failed:', res.error);
      }
    } else {
      const res = initFirebase(DEFAULT_FIREBASE_CONFIG);
      if (res.success) {
        setFirebaseStatus('Connected');
      }
    }
  }, [settings.firebaseConfigText]);

  // Real-time Firestore updates listener
  useEffect(() => {
    if (firebaseStatus !== 'Connected' || !firestoreDb) return;
    try {
      const q = query(collection(firestoreDb, 'alerts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fbAlerts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fbAlerts.push({
            ...data,
            alertId: data.alertId || doc.id
          });
        });
        
        setAlerts(prev => {
          const merged = [...fbAlerts];
          prev.forEach(localAlert => {
            if (!merged.some(a => a.alertId === localAlert.alertId)) {
              merged.push(localAlert);
            }
          });
          // Sort by date desc
          merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return merged;
        });
      });
      return () => unsubscribe();
    } catch (e) {
      console.error('Firestore alerts listener error:', e);
    }
  }, [firebaseStatus]);

  // Invalidate Leaflet map size on responsive view switch
  useEffect(() => {
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 200);
    }
  }, [mobileView, mapInstance]);

  // Winning Features states
  const [mapBaseLayer, setMapBaseLayer] = useState('standard');
  const [showFloodOverlay, setShowFloodOverlay] = useState(false);
  const [showLandslideOverlay, setShowLandslideOverlay] = useState(false);
  const [showConnectivityOverlay, setShowConnectivityOverlay] = useState(false);
  const [showHeliOverlay, setShowHeliOverlay] = useState(false);

  const [loraFrequency, setLoraFrequency] = useState('868 MHz (IN/EU)');
  const [droneFlightActive, setDroneFlightActive] = useState(false);
  const [is3dTiltedView, setIs3dTiltedView] = useState(false);
  const [droneCoords, setDroneCoords] = useState(null);
  const [droneTargetCoords, setDroneTargetCoords] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showPhoneSimulator, setShowPhoneSimulator] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  // Focus mode & Map Layer options (Mission Control / layers dropdown navbar)
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [mapLayers, setMapLayers] = useState({
    mission: true, // category
    hazards: true, // category
    rescue: true, // category
    network: false, // category
    feed: false, // category
    legend: false, // category
    
    timeline: false,
    incidentCommander: false,
    telemetry: false,
    meshRadius: false,
    meshNodes: false,
    rescueRoutes: true,
    uavRoutes: false,
    hazardZones: false,
    toastAlerts: false
  });
  const [isLayersDropdownOpen, setIsLayersDropdownOpen] = useState(false);
  const [rescueAnimationCoords] = useState(null);
  const [dispatchRoute, setDispatchRoute] = useState(null);
  const [isCompletedRescuesCollapsed, setIsCompletedRescuesCollapsed] = useState(false);
  const [completedMissionsCount, setCompletedMissionsCount] = useState(() => Number(localStorage.getItem('resqmesh_completed_count') || 0));
  
  // Presets
  const applyFocusPreset = () => {
    setMapLayers({
      mission: false,
      hazards: false,
      rescue: true,
      network: false,
      feed: false,
      legend: false,
      
      timeline: false,
      incidentCommander: false,
      telemetry: false,
      meshRadius: false,
      meshNodes: false,
      rescueRoutes: true,
      uavRoutes: false,
      hazardZones: false,
      toastAlerts: false
    });
    setIsFocusMode(true);
    setShowFloodOverlay(false);
    setShowLandslideOverlay(false);
    setShowConnectivityOverlay(false);
    setShowHeliOverlay(false);
    setIsCommunityMode(false);
    setIs3dTiltedView(false);
  };
 
  const applyCommandPreset = () => {
    setMapLayers({
      mission: true,
      hazards: true,
      rescue: true,
      network: true,
      feed: true,
      legend: true,
      
      timeline: true,
      incidentCommander: true,
      telemetry: true,
      meshRadius: true,
      meshNodes: true,
      rescueRoutes: true,
      uavRoutes: true,
      hazardZones: true,
      toastAlerts: true
    });
    setIsFocusMode(false);
    setShowFloodOverlay(true);
    setShowLandslideOverlay(true);
    setShowConnectivityOverlay(true);
    setShowHeliOverlay(true);
    setIsCommunityMode(true);
    setIs3dTiltedView(true);
  };
 
  const applyPublicPreset = () => {
    setMapLayers({
      mission: true,
      hazards: true,
      rescue: true,
      network: false,
      feed: true,
      legend: true,
      
      timeline: true,
      incidentCommander: false,
      telemetry: false,
      meshRadius: false,
      meshNodes: false,
      rescueRoutes: true,
      uavRoutes: false,
      hazardZones: true,
      toastAlerts: true
    });
    setIsFocusMode(false);
    setShowFloodOverlay(true);
    setShowLandslideOverlay(true);
    setShowConnectivityOverlay(false);
    setShowHeliOverlay(true);
    setIsCommunityMode(false);
    setIs3dTiltedView(false);
  };

  // Category togglers
  const toggleMissionLayerGroup = () => {
    const nextVal = !mapLayers.mission;
    setMapLayers(prev => ({
      ...prev,
      mission: nextVal,
      timeline: nextVal,
      incidentCommander: nextVal
    }));
    playSystemSound('ping');
  };

  const toggleNetworkLayerGroup = () => {
    const nextVal = !mapLayers.network;
    setMapLayers(prev => ({
      ...prev,
      network: nextVal,
      telemetry: nextVal,
      meshRadius: nextVal,
      meshNodes: nextVal
    }));
    playSystemSound('ping');
  };

  const toggleRescueLayerGroup = () => {
    const nextVal = !mapLayers.rescue;
    setMapLayers(prev => ({
      ...prev,
      rescue: nextVal,
      rescueRoutes: nextVal,
      uavRoutes: nextVal
    }));
    playSystemSound('ping');
  };

  const toggleHazardsLayerGroup = () => {
    const nextVal = !mapLayers.hazards;
    setMapLayers(prev => ({
      ...prev,
      hazards: nextVal,
      hazardZones: nextVal
    }));
    playSystemSound('ping');
  };

  const toggleFeedLayerGroup = () => {
    const nextVal = !mapLayers.feed;
    setMapLayers(prev => ({
      ...prev,
      feed: nextVal
    }));
    playSystemSound('ping');
  };

  const toggleLegendLayerGroup = () => {
    const nextVal = !mapLayers.legend;
    setMapLayers(prev => ({
      ...prev,
      legend: nextVal
    }));
    playSystemSound('ping');
  };
  
  // Persist completed missions count
  useEffect(() => {
    localStorage.setItem('resqmesh_completed_count', completedMissionsCount.toString());
  }, [completedMissionsCount]);

  const injectOperationalLog = (text) => {
    console.log('[Operational Log]', text);
  };
  
  // Mobile app state variables
  const [mobileTab, setMobileTab] = useState('home'); 
  const [mobileNetwork, setMobileNetwork] = useState('online'); // 'online' | 'offline'
  const [networkTransitioning, setNetworkTransitioning] = useState(false); // cinematic relay-switch moment
  const [networkPhase, setNetworkPhase] = useState(''); // '', 'searching', 'relayFound'
  const [sosCategory, setSosCategory] = useState('medical');
  const [sosMessage, setSosMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mobileBattery] = useState(78);
  const [nearbyNodesCount] = useState(4);
  const [isRelaying, setIsRelaying] = useState(false);
  const [sosBroadcasting, setSosBroadcasting] = useState(false); // SOS armed/broadcasting state
  const [relayProgress, setRelayProgress] = useState(0);
  const [relayLogs, setRelayLogs] = useState([]);
  const [volunteerModeActive, setVolunteerModeActive] = useState(false);

  const [criticalEventPopup, setCriticalEventPopup] = useState(null); // {title, detail} or null
  const [alertToast, setAlertToast] = useState(null); // {title, detail} for alert-interruption toast
  const [isMapShaking, setIsMapShaking] = useState(false);   // camera shake on critical alert
  const [isMapFlashing, setIsMapFlashing] = useState(false); // red vignette flash
  const [feedViewTab, setFeedViewTab] = useState('feed');    // 'feed' | 'legend'
  const [isLandslideTriggered, setIsLandslideTriggered] = useState(false);
  const [displayedConfidence, setDisplayedConfidence] = useState(0);
  const [isButtonTransmitting, setIsButtonTransmitting] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [islandTilt, setIslandTilt] = useState({ x: 0, y: 0 });

  const [isCommunityMode, setIsCommunityMode] = useState(false);
  const [weatherIntensity, setWeatherIntensity] = useState('normal'); // 'normal' | 'storm' | 'cloudburst'
  const [droneEta, setDroneEta] = useState(151); // 2m 31s = 151s
  const [sosTransmissionStep, setSosTransmissionStep] = useState(null); // null | 0..6
  const [rssiSignal, setRssiSignal] = useState(-68); // fluctuates dynamically

  // Avoid unused variable warning for sosTransmissionStep
  if (sosTransmissionStep !== null) {
    console.debug('[SOS Transmission] Step:', sosTransmissionStep);
  }

  const handleIslandMouseMove = (e) => {
    if (isIslandExpanded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = -(y / (rect.height / 2)) * 12;
    const tiltY = (x / (rect.width / 2)) * 12;
    setIslandTilt({ x: tiltX, y: tiltY });
  };

  const handleIslandMouseLeave = () => {
    setIslandTilt({ x: 0, y: 0 });
  };

  // Helper function for quick feed log injection
  const injectFeedbackLog = (text, type = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemFeedbackLogs(prev => {
      const next = [...prev, { id: Date.now() + Math.random(), time: timeStr, text, type }];
      return next.slice(-4);
    });
  };

  // Resource gap reporting state
  const [gapType, setGapType] = useState('food_water');
  const [gapQuantity, setGapQuantity] = useState(10);
  const [gapDesc, setGapDesc] = useState('');

  // Refs for Leaflet 2D mapping
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const arcsLayerRef = useRef(null);
  const floodPolygonRef = useRef(null);
  const tileLayerRef = useRef(null);
  const feedScrollRef = useRef(null); // auto-scroll anchor for operational feed

  // Transition & Feedback states
  const [isTransitioningLayer, setIsTransitioningLayer] = useState(false);
  const [systemFeedbackLogs, setSystemFeedbackLogs] = useState([
    { id: 1, time: '02:40:02', text: 'Gateway Link Enabled', type: 'info' },
    { id: 2, time: '02:40:05', text: 'AI Triage Model Loaded', type: 'success' },
    { id: 3, time: '02:40:12', text: 'Heltec-V3 Relay Mesh Sync Active', type: 'info' }
  ]);

  // Live Auto-updating feed ticker list and effect
  const upcomingLogsRef = useRef([
    { text: 'UAV rerouted due to wind conditions', type: 'warning' },
    { text: 'Mesh packet relayed via volunteer node', type: 'info' },
    { text: 'AI updated flood severity score', type: 'success' },
    { text: 'Phata helipad visibility reduced to 2.2km (restricted)', type: 'warning' },
    { text: 'Landslide activity detected near Sonprayag corridor', type: 'danger' },
    { text: 'Satellite fallback link stabilized at 4.2 Mbps', type: 'info' },
    { text: 'Mesh node count increased: 15 active relays', type: 'success' },
    { text: 'Evacuation pathway NH-107 marked blocked', type: 'danger' },
    { text: 'ITBP volunteer Devendra Singh pinged', type: 'info' },
    { text: 'Starlink connection active (uplink online)', type: 'success' }
  ]);
  const logIndexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextLog = upcomingLogsRef.current[logIndexRef.current % upcomingLogsRef.current.length];
      logIndexRef.current += 1;
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setSystemFeedbackLogs(prev => {
        const updated = [...prev, { id: Date.now() + Math.random(), time: timeStr, text: nextLog.text, type: nextLog.type }];
        return updated.slice(-4); // Keep only the last 4 logs
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Critical event popup — fires once 18s: SIREN + SHAKE + FLASH + feed injection
  useEffect(() => {
    const t = setTimeout(() => {
      // 1. Landslide warning alarm (low alarm sweep) & tactical siren
      playSystemSound('landslideWarning');
      playAlertSiren();
      // 2. Camera micro-shake (300ms)
      setIsMapShaking(true);
      setTimeout(() => setIsMapShaking(false), 300);
      // 3. Red vignette flash (800ms)
      setIsMapFlashing(true);
      setTimeout(() => setIsMapFlashing(false), 800);
      // 4. Trigger landslide events and map rerouting
      setIsLandslideTriggered(true);
      // 5. Show popup
      setCriticalEventPopup({ title: '⚠ LANDSLIDE DETECTED', detail: 'NH-107 Route Compromised — Sonprayag Sector' });
      // 6. Inject burst of operational feed logs
      const now = new Date();
      const ts = (offset) => new Date(now.getTime() + offset).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSystemFeedbackLogs(prev => [
        ...prev,
        { id: Date.now() + Math.random(), time: ts(0),    text: 'LANDSLIDE DETECTED — Sonprayag sector', type: 'danger' },
        { id: Date.now() + 1 + Math.random(), time: ts(2000),  text: 'NH-107 marked unstable — route compromised', type: 'danger' },
        { id: Date.now() + 2 + Math.random(), time: ts(4000),  text: 'UAV rerouted via alternate Gaurikund corridor', type: 'warning' }
      ].slice(-4));
      setTimeout(() => setCriticalEventPopup(null), 6000);
    }, 18000);
    return () => clearTimeout(t);
  }, []);

  // Alert interruption toast — fires once 30s after mount
  useEffect(() => {
    const t = setTimeout(() => {
      setAlertToast({ title: '⚠ New SOS Relay Detected', detail: 'Signal received via Volunteer Node · Rambara Sector' });
      playSystemSound('ping');
      setTimeout(() => setAlertToast(null), 5000);
    }, 30000);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll operational feed to bottom on new logs
  useEffect(() => {
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTop = feedScrollRef.current.scrollHeight;
    }
  }, [systemFeedbackLogs]);

  // Simulated live location tracking
  const mockMyLocation = { lat: 30.6515, lng: 79.0270 }; // Gaurikund trailhead

  // Sync simulated offline queue when dashboard toggles online
  useEffect(() => {
    if (!dashboardOfflineMode && syncQueue.length > 0) {
      const timeout = setTimeout(() => {
        setAlerts(prev => [...syncQueue, ...prev]);
        setSyncQueue([]);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [dashboardOfflineMode, syncQueue]);
  // Active rescue countdown timer & completion
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(prevAlerts => {
        let alertToComplete = null;
        const updated = prevAlerts.map(a => {
          if (a.status === 'assigned' && typeof a.etaSecs === 'number') {
            if (a.etaSecs > 1) {
              return { ...a, etaSecs: a.etaSecs - 1 };
            } else if (a.etaSecs === 1) {
              alertToComplete = a;
              return { ...a, status: 'rescued', etaSecs: 0 };
            }
          }
          return a;
        });
        
        if (alertToComplete) {
          const volId = alertToComplete.assignedVolunteerId;
          
          setTimeout(() => {
            setVolunteers(prev => prev.map(v => v.volunteerId === volId ? { ...v, assignedAlertId: null, availability: 'active' } : v));
            setCompletedMissionsCount(prev => prev + 1);
            setDispatchRoute(null);
            playSystemSound('confirm');
            
            injectFeedbackLog(`✓ Rescue Complete: ${alertToComplete.name} safely evacuated.`, 'success');
            injectOperationalLog(`Rescue Complete: ${alertToComplete.name} safely evacuated.`);
          }, 0);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatic SOS Spawner if active alerts drops below 10
  useEffect(() => {
    const activeCount = alerts.filter(a => a.status !== 'rescued').length;
    if (activeCount < 10) {
      const names = [
        'Anil Joshi (Bheembali)', 'Kavita Rawat (Rambara)', 'Sanjay Negi (Sonprayag)', 
        'Manju Devi (Gaurikund)', 'Rakesh Prasad (Kedarnath Path)', 'Deepa Sharma (Jungle Chatti)'
      ];
      const selectedName = names[Math.floor(Math.random() * names.length)];
      
      const newLat = 30.6 + Math.random() * 0.14;
      const newLng = 79.0 + Math.random() * 0.07;
      
      const newAlert = {
        alertId: `alert-${Date.now()}`,
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        name: selectedName,
        emergencyType: Math.random() > 0.5 ? 'medical' : 'trapped',
        encryptedPayload: 'U2FsdGVkX1+vGjV/j74XGqM365oOxiQ...',
        iv: Math.random().toString(16).substring(2, 14),
        decryptedMessage: 'Stranded without core supplies or water due to landslide. Need urgent evacuation.',
        lat: newLat,
        lng: newLng,
        plusCode: '8G4P' + Math.floor(Math.random() * 90 + 10) + '+' + Math.floor(Math.random() * 90 + 10),
        batteryAtTrigger: Math.floor(Math.random() * 50) + 10,
        hopCount: Math.floor(Math.random() * 3) + 1,
        createdAt: new Date().toISOString(),
        status: 'pending',
        assignedVolunteerId: null,
        aiSummary: `Stranded pilgrim ${selectedName} needs assistance.`,
        severity: Math.random() > 0.5 ? 'Critical' : 'High',
        priorityScore: Math.floor(Math.random() * 20) + 75,
        suggestedAction: 'Dispatch volunteer responder with aid kit.',
        requiredResources: Math.random() > 0.5 ? ['medicine'] : ['food_water'],
        confidenceScore: Math.floor(Math.random() * 10) + 85,
        fakeRiskScore: Math.floor(Math.random() * 5),
        triageTimeline: [
          'Just now - SOS Packet Generated',
          'Just now - Uploaded via Phata Gateway Base'
        ]
      };
      
      const timeout = setTimeout(() => {
        setAlerts(prev => [...prev, newAlert]);
        injectFeedbackLog(`🚨 Auto-Spawned New SOS Alert from ${selectedName}.`, 'warning');
        injectOperationalLog(`Auto-Spawned New SOS Alert from ${selectedName}.`);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [alerts]);

  // Real-Time Drone Flight Simulation coordinate animator (curved bypass when landslide blocked)
  useEffect(() => {
    if (!droneFlightActive || !droneTargetCoords) return;

    const start = [30.5732, 79.0435]; // Phata Air Base
    const end = droneTargetCoords;

    let t = 0;
    let forward = true;
    const interval = setInterval(() => {
      if (forward) {
        t += 0.012;
        if (t >= 1) {
          t = 1;
          forward = false;
          // Trigger payload drop log and sound
          playSystemSound('confirm');
          injectFeedbackLog('📦 [UAV-01] Delivery: Food rations and trauma kit dropped at survivor coordinates.', 'success');
        }
      } else {
        t -= 0.012;
        if (t <= 0) {
          t = 0;
          setDroneFlightActive(false);
          setDroneTargetCoords(null);
          injectFeedbackLog('🛬 [UAV-01] Returned to base: Phata Air command hub.', 'info');
          return;
        }
      }

      let lat = start[0] + t * (end[0] - start[0]);
      let lng = start[1] + t * (end[1] - start[1]);
      
      // Curve flight east to avoid Sonprayag landslide area or weather storm/cloudburst
      const isRerouted = isLandslideTriggered || weatherIntensity !== 'normal';
      if (isRerouted) {
        const deviation = Math.sin(t * Math.PI) * 0.018;
        lng += deviation;
      }

      // Compute remaining simulated ETA in seconds
      if (forward) {
        const remainingSecs = Math.max(0, Math.round((1 - t) * 151));
        setDroneEta(remainingSecs);
      } else {
        const returnSecs = Math.max(0, Math.round(t * 151));
        setDroneEta(returnSecs);
      }

      setDroneCoords([lat, lng]);
    }, 80);

    return () => {
      clearInterval(interval);
      setDroneCoords(null);
      setDroneEta(151);
    };
  }, [droneFlightActive, droneTargetCoords, isLandslideTriggered, weatherIntensity]);

  // AI Triage Confidence score live animator (82% -> 93% count-up)
  useEffect(() => {
    if (!selectedAlert) {
      const timeout = setTimeout(() => {
        setDisplayedConfidence(0);
      }, 0);
      return () => clearTimeout(timeout);
    }
    const target = selectedAlert.confidenceScore || 92;
    const start = Math.max(target - 11, 70); // start 11% lower
    
    let current = start;
    let interval;
    const timeout = setTimeout(() => {
      // Play starting prediction tick
      playSystemSound('aiPrediction');
      setDisplayedConfidence(start);
      interval = setInterval(() => {
        current += 1;
        setDisplayedConfidence(current);
        playSystemSound('aiPrediction'); // subtle high-frequency synth tick
        if (current >= target) {
          clearInterval(interval);
        }
      }, 120);
    }, 0);
    
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [selectedAlert]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([30.6515, 79.0270], 12); // Center at Gaurikund Valley

    const baseLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      className: 'cream-map-tiles'
    }).addTo(map);
    tileLayerRef.current = baseLayer;

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    arcsLayerRef.current = L.layerGroup().addTo(map);
    floodPolygonRef.current = L.layerGroup().addTo(map);
    setMapInstance(map);
    setMapLoaded(true);
  }, []);

  // Dynamic Map Layer swapping (Standard vs Satellite vs Terrain) with transition zoom animation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    // Trigger orbital tilt transition effect
    playSystemSound('ping');
    setIsTransitioningLayer(true);
    const transitionTimeout = setTimeout(() => {
      setIsTransitioningLayer(false);
      playSystemSound('connect');
    }, 800);

    // Swap the tile layer inside Leaflet
    map.removeLayer(tileLayerRef.current);

    if (mapBaseLayer === 'satellite') {
      tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        className: 'satellite-map-tiles'
      }).addTo(map);
    } else if (mapBaseLayer === 'terrain') {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        className: 'cream-map-tiles'
      }).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        className: 'cream-map-tiles'
      }).addTo(map);
    }

    return () => clearTimeout(transitionTimeout);
  }, [mapBaseLayer]);

  // Periodic Operational Log Ticker Feed
  useEffect(() => {
    const feedbackPhrases = [
      { text: 'UAV-01 rerouted due to mountain headwind conditions', type: 'warning' },
      { text: 'Mesh packet relayed via Sonprayag volunteer node', type: 'success' },
      { text: 'AI updated flood severity score at Rambara gorge', type: 'danger' },
      { text: 'ITBP radio link established at Phata helipad', type: 'info' },
      { text: 'Starlink fallback link ping stabilized (45ms)', type: 'success' },
      { text: 'LoRa carrier frequency tuned to 868.2 MHz', type: 'info' },
      { text: 'Relayed emergency payload: user-self', type: 'success' },
      { text: 'Atmospheric visibility at Kedarnath helipad: 2.2km', type: 'warning' }
    ];

    const interval = setInterval(() => {
      const phrase = feedbackPhrases[Math.floor(Math.random() * feedbackPhrases.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      playSystemSound('beep');
      setSystemFeedbackLogs(prev => {
        const next = [...prev, { id: Date.now() + Math.random(), time: timeStr, text: phrase.text, type: phrase.type }];
        if (next.length > 4) next.shift(); // Keep only latest 4 logs
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Update Map Layers
  useEffect(() => {
    const map = mapInstance;
    if (!map || !markersLayerRef.current || !arcsLayerRef.current || !floodPolygonRef.current) return;

    markersLayerRef.current.clearLayers();
    arcsLayerRef.current.clearLayers();
    floodPolygonRef.current.clearLayers();

    // Helper to calculate stereo panning based on longitude
    const getPanVal = (lng) => Math.max(-1.0, Math.min(1.0, (lng - 79.0270) * 15));

    // 1. Mesh Signal Pulse Rings at relay nodes
    const relayNodes = [
      { lat: 30.5732, lng: 79.0435, label: 'Phata Gateway Base' },
      { lat: 30.6342, lng: 79.0145, label: 'Sonprayag Hub' },
      { lat: 30.6515, lng: 79.0270, label: 'Gaurikund camp' },
      { lat: 30.7346, lng: 79.0669, label: 'Kedarnath shelter' },
      { lat: 30.6865, lng: 79.0550, label: 'Rambara Guide' }
    ];
    if (mapLayers.meshRadius) {
      relayNodes.forEach(node => {
        L.marker([node.lat, node.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div class="mesh-pulse-ring" title="${node.label} Mesh Relay Signal Pulse"></div>`,
            iconSize: [0, 0]
          }),
          interactive: false
        }).addTo(arcsLayerRef.current);
      });
    }

    const createIcon = (className, html) => L.divIcon({
      className: 'custom-beacon-leaflet-container',
      html: html || `<div class="${className}" style="transform: translate(-50%, -50%);"></div>`,
      iconSize: [0, 0]
    });

    // Gateway Base - Heltec Hub at Phata
    if (mapLayers.telemetry) {
      L.marker([30.5732, 79.0435], { icon: createIcon('pulse-beacon-high') })
        .bindTooltip('Command Gateway Node: Phata HQ | LoRa WAN', { direction: 'top', offset: [0, -10] })
        .addTo(markersLayerRef.current);
    }

    // Safe Zones (Evac hubs, medical tents, helipads)
    if (mapLayers.rescueRoutes) {
      INITIAL_SAFE_ZONES.forEach(sz => {
        L.marker([sz.lat, sz.lng], { icon: createIcon('beacon-safezone') })
          .bindTooltip(`Safe Zone Hub: ${sz.name} (${sz.capacityCurrent}/${sz.capacityMax} Evacuees)`, { direction: 'top', offset: [0, -10] })
          .addTo(markersLayerRef.current);
      });
    }

    // Volunteers (ITBP, NDRF, local guides)
    if (mapLayers.rescueRoutes) {
      volunteers.forEach(v => {
        L.marker([v.lat, v.lng], { icon: createIcon('beacon-volunteer') })
          .bindTooltip(`Volunteer: ${v.name} (${v.skills.join(', ')})`, { direction: 'top', offset: [0, -10] })
          .addTo(markersLayerRef.current);
      });
    }
    // Stranded alerts (Always visible, but danger zones are toggled by hazards)
    alerts.filter(a => a.status !== 'rescued').forEach(a => {
      const marker = L.marker([a.lat, a.lng], { 
        icon: createIcon(a.severity === 'Critical' ? 'pulse-beacon-critical' : 'pulse-beacon-high') 
      })
      .bindTooltip(`[SOS] ${a.name} (${a.severity})`, { direction: 'top', offset: [0, -10] })
      .addTo(markersLayerRef.current);

      marker.on('click', () => {
        setSelectedAlert(a);
        setShowDecryptionView(true);
        // Play spatialized AI prediction beep
        playSystemSound('aiPrediction', getPanVal(a.lng));
      });

      // Layered radial gradient for danger zones
      if (mapLayers.hazardZones && (a.severity === 'Critical' || a.severity === 'High')) {
        const size = a.severity === 'Critical' ? 140 : 80;
        L.marker([a.lat, a.lng], {
          icon: L.divIcon({
            className: 'danger-zone-gradient-marker',
            html: `<div class="danger-zone-radial" style="width: ${size}px; height: ${size}px;"></div>`,
            iconSize: [0, 0]
          }),
          interactive: false
        }).addTo(floodPolygonRef.current);
      }
    });
    // Community Mode Civilian Relays
    if (isCommunityMode && mapLayers.telemetry) {
      const civilianNodes = [
        { lat: 30.6050, lng: 79.0300, name: 'Civ Node #1 (Amit - Heltec v3)' },
        { lat: 30.6700, lng: 79.0600, name: 'Civ Node #2 (Rajesh - T-Beam)' },
        { lat: 30.7100, lng: 79.0500, name: 'Civ Node #3 (Sunita - Meshtastic)' },
        { lat: 30.6400, lng: 79.0050, name: 'Civ Node #4 (Manoj - LoRa Ring)' }
      ];
      civilianNodes.forEach(node => {
        L.marker([node.lat, node.lng], {
          icon: createIcon('beacon-volunteer', `
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: var(--color-rescue-blue); border: 1.5px solid #fff; box-shadow: 0 0 10px var(--color-rescue-blue); transform: translate(-5px, -5px);" class="animate-pulse"></div>
          `)
        }).bindTooltip(`👥 ${node.name}<br/>Status: <b>ACTIVE PASSIVE RELAY</b><br/>Battery: 89%`, { direction: 'top' })
          .addTo(markersLayerRef.current);
      });
    }

    // Drone dispatch flight coordinate marker
    if (droneFlightActive && droneCoords && mapLayers.uavRoutes) {
      const droneHtml = `
        <div style="width: 24px; height: 24px; transform: translate(-12px, -12px); display: flex; justify-content: center; align-items: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L22 19H2L12 3Z" fill="var(--color-warning-orange)" stroke="#2C2A29" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
      L.marker(droneCoords, { icon: createIcon('', droneHtml), zIndexOffset: 1000 })
        .bindTooltip(`Active Dispatch UAV: En-route | Wind-drift compensating`, { direction: 'top', offset: [0, -10] })
        .addTo(markersLayerRef.current);

      // Render dropped supply crate if drone is close to target (near t=1, which is ETA < 8s)
      if (droneEta <= 6) {
        const targetAlert = selectedAlert || alerts.find(a => a.severity === 'Critical') || alerts[0];
        if (targetAlert) {
          L.marker([targetAlert.lat, targetAlert.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="font-size: 16px; animation: bounce 1s infinite; transform: translate(-8px, -12px); text-shadow: 0 0 4px #000;">📦</div>`,
              iconSize: [0, 0]
            })
          }).bindTooltip('Dropped Emergency Supply Crate: Food & Meds', { direction: 'top' })
            .addTo(markersLayerRef.current);
        }
      }
    }

    // Render Starlink Satellite when landslide is triggered or weather is cloudburst
    if ((isLandslideTriggered || weatherIntensity === 'cloudburst') && mapLayers.meshNodes) {
      const satelliteHtml = `
        <div style="transform: translate(-15px, -15px); display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 6px var(--color-rescue-blue));">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--color-rescue-blue)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="font-family: monospace; font-size: 7px; color: var(--color-rescue-blue); font-weight: 800; text-shadow: 0 0 2px #fff; white-space: nowrap; margin-top: 1px;">STARLINK-04</span>
        </div>
      `;
      L.marker([30.7550, 79.0300], {
        icon: L.divIcon({ className: '', html: satelliteHtml, iconSize: [0, 0] })
      }).bindTooltip('Starlink orbital relay active (Fallback Uplink)', { direction: 'top' })
        .addTo(markersLayerRef.current);
    }

    // Active P2P Hop routing packet propagation animation on the map
    if (isRelaying && mapLayers.meshNodes) {
      const path = [
        [30.6515, 79.0270], // Gaurikund (Phone A - Self)
        [30.6865, 79.0550], // Rambara (Phone B)
        [30.6342, 79.0145], // Sonprayag (Phone C - Volunteer Hub)
        [30.5732, 79.0435]  // Phata (Gateway Hub)
      ];
      
      let activePos = path[0];
      let activeNodeIdx = 0;
      
      if (relayProgress >= 14 && relayProgress < 42) {
        const t = (relayProgress - 14) / (42 - 14);
        activePos = [
          path[0][0] + t * (path[1][0] - path[0][0]),
          path[0][1] + t * (path[1][1] - path[0][1])
        ];
        activeNodeIdx = 1;
      } else if (relayProgress >= 42 && relayProgress < 71) {
        const t = (relayProgress - 42) / (71 - 42);
        if (isLandslideTriggered) {
          // Send to Starlink Satellite instead of Sonprayag!
          const satPos = [30.7550, 79.0300];
          activePos = [
            path[1][0] + t * (satPos[0] - path[1][0]),
            path[1][1] + t * (satPos[1] - path[1][1])
          ];
          activeNodeIdx = 2; // Satellite hop
        } else {
          activePos = [
            path[1][0] + t * (path[2][0] - path[1][0]),
            path[1][1] + t * (path[2][1] - path[1][1])
          ];
          activeNodeIdx = 2;
        }
      } else if (relayProgress >= 71) {
        const t = (relayProgress - 71) / (100 - 71);
        if (isLandslideTriggered) {
          // Downlink from Starlink to Phata Gateway
          const satPos = [30.7550, 79.0300];
          activePos = [
            satPos[0] + t * (path[3][0] - satPos[0]),
            satPos[1] + t * (path[3][1] - satPos[1])
          ];
          activeNodeIdx = 3;
        } else {
          activePos = [
            path[2][0] + t * (path[3][0] - path[2][0]),
            path[2][1] + t * (path[3][1] - path[2][1])
          ];
          activeNodeIdx = 3;
        }
      }
      
      // Draw packet transit arc polylines
      if (isLandslideTriggered && relayProgress >= 42) {
        // Satellite Uplink / Downlink Beams
        L.polyline([[30.6865, 79.0550], [30.7550, 79.0300]], {
          color: 'var(--color-rescue-blue)',
          weight: 2,
          className: 'satellite-uplink-beam'
        }).addTo(arcsLayerRef.current);
        
        if (relayProgress >= 71) {
          L.polyline([[30.7550, 79.0300], [30.5732, 79.0435]], {
            color: 'var(--color-rescue-blue)',
            weight: 2,
            className: 'satellite-downlink-beam'
          }).addTo(arcsLayerRef.current);
        }
      } else {
        L.polyline(path.slice(0, activeNodeIdx + 1), {
          color: 'var(--color-safety-green)',
          weight: 3.5,
          className: 'mesh-routing-path'
        }).addTo(arcsLayerRef.current);
      }
      
      // Draw the packet marker
      const packetHtml = `
        <div style="width: 20px; height: 20px; transform: translate(-10px, -10px); display: flex; align-items: center; justify-content: center;">
          <div style="width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid var(--color-safety-green); background: rgba(34,197,94,0.6); box-shadow: 0 0 14px var(--color-safety-green);" class="animate-ping"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-safety-green); border: 1.5px solid #fff; position: absolute; box-shadow: 0 0 6px var(--color-safety-green);"></div>
        </div>
      `;
      L.marker(activePos, {
        icon: L.divIcon({ className: '', html: packetHtml, iconSize: [0, 0] }),
        zIndexOffset: 3000
      }).bindTooltip(`📦 Relay Packet | RSSI: ${rssiSignal}dBm | TTL: ${255 - activeNodeIdx}`, { direction: 'top', permanent: true })
        .addTo(arcsLayerRef.current);

      // Draw packet pulse ring at active holding node coords
      const pathNodeCoords = isLandslideTriggered && activeNodeIdx === 2 ? [30.7550, 79.0300] : path[activeNodeIdx];
      L.circle(pathNodeCoords, {
        radius: 350,
        color: 'var(--color-safety-green)',
        fillColor: 'var(--color-safety-green)',
        fillOpacity: 0.16,
        weight: 1.5,
        className: 'packet-node-pulse-ring'
      }).addTo(arcsLayerRef.current);
    } else if (selectedAlert && mapLayers.meshNodes) {
      const p2pPoints = [
        [selectedAlert.lat, selectedAlert.lng],
        [30.6865, 79.0550], // Hop 1: Rambara Guide Karan Thapa
        [30.6515, 79.0270], // Hop 2: Gaurikund Medical NDRF Node
        [30.5732, 79.0435]  // Hop 3: Phata Gateway Base
      ];
      L.polyline(p2pPoints, { color: '#57A573', weight: 2, className: 'mesh-routing-path' })
        .bindTooltip('LoRa P2P Store & Forward Hop Pathway', { sticky: true })
        .addTo(arcsLayerRef.current);
    }

    // Drone flight path dashed corridor (curved bypass when landslide blocked or weather storm/cloudburst active)
    if (mapLayers.uavRoutes) {
      const targetAlert = selectedAlert || alerts.find(a => a.severity === 'Critical') || alerts[0];
      const end = targetAlert ? [targetAlert.lat, targetAlert.lng] : [30.7346, 79.0669];
      const isRerouted = isLandslideTriggered || weatherIntensity !== 'normal';
      
      if (isRerouted) {
        // Generate curved line coordinates bending east to avoid landslide zone
        const flightPoints = [];
        const steps = 30;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const lat = 30.5732 + t * (end[0] - 30.5732);
          let lng = 79.0435 + t * (end[1] - 79.0435);
          lng += Math.sin(t * Math.PI) * 0.018; // offset east
          flightPoints.push([lat, lng]);
        }
        L.polyline(flightPoints, {
          color: '#5B8DEF',
          weight: 2.0,
          dashArray: '4, 4',
          className: 'drone-flight-path',
          opacity: 0.7
        }).bindTooltip(`UAV Weather Rerouting Corridor (Wind: ${weatherIntensity === 'normal' ? '12kt' : weatherIntensity === 'storm' ? '24kt' : '38kt'})`, { sticky: true })
          .addTo(arcsLayerRef.current);
      } else {
        L.polyline([[30.5732, 79.0435], end], {
          color: '#5B8DEF',
          weight: 1.5,
          dashArray: '4, 4',
          className: 'drone-flight-path',
          opacity: 0.38
        }).addTo(arcsLayerRef.current);
      }
    }

    // LoRa WAN Area Gateway coverage radius (shrinks slightly when landslide triggered, expands with community mode)
    if (mapLayers.meshRadius) {
      const baseRadius = isLandslideTriggered ? 7200 : 8000;
      const currentRadius = baseRadius + (isCommunityMode ? 3200 : 0);
      L.circle([30.5732, 79.0435], {
        radius: currentRadius,
        color: networkTransitioning ? 'var(--color-warning-orange)' : '#5B8DEF',
        fillColor: networkTransitioning ? 'var(--color-warning-orange)' : '#5B8DEF',
        fillOpacity: networkTransitioning ? 0.022 : 0.012,
        weight: networkTransitioning ? 1.5 : 1,
        dashArray: networkTransitioning ? '2, 4' : '4, 8'
      }).bindTooltip(`Emergency Relay Radius (${(currentRadius/1000).toFixed(1)}km) - Offline Emergency Link`, { sticky: true })
        .addTo(arcsLayerRef.current);

      // Circumference visual label for range circle (dynamically positioned based on active radius)
      L.marker([30.5732 + (currentRadius / 111120), 79.0435], {
        icon: L.divIcon({
          className: 'circle-radius-label',
          html: `<div style="color: var(--color-rescue-blue); font-family: var(--font-mono); font-size: 8px; font-weight: 700; white-space: nowrap; transform: translate(-50%, -50%); opacity: 0.72; background: rgba(244,239,230,0.6); padding: 1px 5px; border-radius: 3px;">● EMERGENCY RELAY RADIUS (${(currentRadius/1000).toFixed(1)}KM)</div>`,
          iconSize: [0, 0]
        }),
        interactive: false
      }).addTo(arcsLayerRef.current);
    }

    // Flood danger zones polygon
    if (mapLayers.hazardZones) {
      const floodCoords = [
        [30.680, 79.030],
        [30.710, 79.060],
        [30.690, 79.070],
        [30.640, 79.040],
        [30.630, 79.020]
      ];
      L.polygon(floodCoords, { 
        color: '#D64545', 
        fillColor: '#D64545', 
        fillOpacity: 0.14, 
        opacity: 0.14, 
        weight: 2.5, 
        dashArray: '2, 3',
        className: 'imperfect-flood-zone' 
      }).bindTooltip('Mandakini River Flash Flood Warning Polygon', { sticky: true })
        .addTo(floodPolygonRef.current);
    }

    // Landslide road blockage markers & slip zones
    if (mapLayers.hazardZones) {
      const landslideHotspots = [
        { name: 'Rambara Gorge Landslide Slip', lat: 30.680, lng: 79.045, status: 'Active mountain slip. Hiking path washed away.' },
        { name: 'Sonprayag Road Blockage (NH-107)', lat: 30.620, lng: 79.012, status: 'Mudslide. Heavy vehicles halted.' }
      ];

      landslideHotspots.forEach(ls => {
        // Warning zone circle
        L.circle([ls.lat, ls.lng], {
          radius: 250,
          color: '#D97706',
          fillColor: '#D97706',
          fillOpacity: 0.22,
          weight: 1.5,
          dashArray: '3, 4'
        }).bindTooltip(`<b>${ls.name}</b><br/>${ls.status}`, { direction: 'top' })
          .addTo(floodPolygonRef.current);

        // Custom warning emoji icon
        const warningHtml = `
          <div class="landslide-marker-icon" style="transform: translate(-11px, -11px); font-size: 11px;">
            ⚠️
          </div>
        `;
        L.marker([ls.lat, ls.lng], {
          icon: L.divIcon({
            className: 'custom-landslide-marker',
            html: warningHtml,
            iconSize: [0, 0]
          })
        }).bindTooltip(`<b>${ls.name}</b><br/>${ls.status}`, { direction: 'top' })
          .addTo(markersLayerRef.current);
      });
    }

    // Connectivity Blackout Region Overlay + OFFLINE/ONLINE tower icons
    if (mapLayers.telemetry) {
      const blackoutCoords = [
        [30.655, 79.020],
        [30.670, 79.040],
        [30.700, 79.050],
        [30.720, 79.060],
        [30.710, 79.070],
        [30.680, 79.060],
        [30.640, 79.030]
      ];
      L.polygon(blackoutCoords, {
        color: '#4B5563',
        fillColor: '#1F2937',
        fillOpacity: 0.16,
        weight: 1.5,
        dashArray: '4, 6',
        className: 'blackout-signal-zone'
      }).bindTooltip('Mesh Coverage Blackout Zone: Cell Towers Down', { sticky: true })
        .addTo(floodPolygonRef.current);

      // Telecom tower OFFLINE/ONLINE icons within blackout zone
      const offlineTowers = [
        { lat: 30.668, lng: 79.038, label: 'BSNL Tower #4' },
        { lat: 30.698, lng: 79.055, label: 'Jio Cell Tower #11' }
      ];
      offlineTowers.forEach(tower => {
        const isOffline = mobileNetwork === 'offline';
        const towerHtml = `
          <div class="offline-tower-wrapper ${isOffline ? 'compromised' : ''}">
            <div class="offline-tower-ping" style="background-color: ${isOffline ? 'var(--color-critical-red)' : 'var(--color-safety-green)'}; box-shadow: 0 0 6px ${isOffline ? 'var(--color-critical-red)' : 'var(--color-safety-green)'};"></div>
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="9" y1="0" x2="9" y2="16" stroke="${isOffline ? '#C26A6A' : '#6FAF83'}" stroke-width="1.2"/>
              <line x1="3" y1="6" x2="15" y2="6" stroke="${isOffline ? '#C26A6A' : '#6FAF83'}" stroke-width="1"/>
              <line x1="3" y1="6" x2="9" y2="16" stroke="${isOffline ? '#C26A6A' : '#6FAF83'}" stroke-width="1"/>
              <line x1="15" y1="6" x2="9" y2="16" stroke="${isOffline ? '#C26A6A' : '#6FAF83'}" stroke-width="1"/>
              ${isOffline ? `<line x1="1" y1="1" x2="17" y2="17" stroke="#C26A6A" stroke-width="1.5" opacity="0.7"/>` : ''}
            </svg>
            <div style="font-size:6px; color:${isOffline ? '#C26A6A' : '#6FAF83'}; font-weight:800; letter-spacing:0.3px; margin-top:1px; white-space:nowrap;">
              ${isOffline ? 'OFFLINE' : 'ONLINE'}
            </div>
          </div>
        `;
        L.marker([tower.lat, tower.lng], {
          icon: L.divIcon({ className: '', html: towerHtml, iconSize: [0, 0] }),
          interactive: true
        }).bindTooltip(`<b>${tower.label}</b><br/>Status: <b style="color:${isOffline ? '#C26A6A' : '#6FAF83'}">${isOffline ? 'OFFLINE' : 'ONLINE'}</b><br/>Cell signal: ${isOffline ? 'NONE' : 'LTE BACKHAUL'}<br/>Mesh relay: ACTIVE`, { direction: 'top' })
          .addTo(markersLayerRef.current);
      });
    }

    // Helicopter Landing Zones (HLZ) & Air Rescue flight corridors
    if (mapLayers.uavRoutes) {
      const helipads = [
        { name: 'Phata Air Rescue Dispatch Base', lat: 30.5732, lng: 79.0435, status: 'SAFE / ACTIVE', alt: '1,820m', wind: '12kt (W)', visibility: '8km' },
        { name: 'Kedarnath Temple Helipad', lat: 30.7346, lng: 79.0669, status: 'RESTRICTED (FOG)', alt: '3,583m', wind: '19kt (NE)', visibility: '2.5km' }
      ];

      helipads.forEach(hp => {
        const isSafe = hp.status.includes('SAFE');
        // Tactical helipad marker — shield + crosshair instead of plain "H"
        const iconHtml = `
          <div class="helipad-marker-icon ${isSafe ? 'safe' : 'foggy'}" style="transform: translate(-16px, -16px); display:flex; align-items:center; justify-content:center;">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="13" stroke="${isSafe ? '#57A573' : '#C26A6A'}" stroke-width="1.5" stroke-dasharray="3 2" fill="${isSafe ? 'rgba(87,165,115,0.15)' : 'rgba(194,106,106,0.15)'}"/>
              <path d="M16 8 L16 24 M10 16 L22 16" stroke="${isSafe ? '#57A573' : '#C26A6A'}" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="16" cy="16" r="3.5" fill="${isSafe ? '#57A573' : '#C26A6A'}" opacity="0.9"/>
              <text x="16" y="28" font-size="5" text-anchor="middle" fill="${isSafe ? '#57A573' : '#C26A6A'}" font-family="monospace" font-weight="700">${isSafe ? 'HLP-ACTIVE' : 'HLP-FOG'}</text>
            </svg>
          </div>
        `;
        L.marker([hp.lat, hp.lng], {
          icon: L.divIcon({
            className: 'custom-helipad-leaflet-icon',
            html: iconHtml,
            iconSize: [0, 0]
          })
        }).bindTooltip(`<b>${hp.name}</b><br/>Status: <b>${hp.status}</b><br/>Altitude: ${hp.alt}<br/>Wind: ${hp.wind}<br/>Visibility: ${hp.visibility}`, { direction: 'top' })
          .addTo(markersLayerRef.current);
      });

      // Yellow flight corridors from Phata base to Kedarnath peak
      const airCorridorPoints = [
        [30.5732, 79.0435],
        [30.6342, 79.0145],
        [30.6865, 79.0550],
        [30.7346, 79.0669]
      ];
      L.polyline(airCorridorPoints, {
        color: '#DF9A51',
        weight: 2,
        dashArray: '6, 8',
        opacity: 0.65
      }).bindTooltip('Mi-17 Evacuation Flight Corridor', { sticky: true })
        .addTo(arcsLayerRef.current);
    }

    // Evacuation descent corridor pedestrian paths (compromised if landslide triggered)
    if (mapLayers.rescueRoutes) {
      if (isLandslideTriggered) {
        const blockedSegment = [
          [30.6865, 79.0550], // Rambara
          [30.6515, 79.0270], // Gaurikund
          [30.6342, 79.0145]  // Sonprayag
        ];
        L.polyline(blockedSegment, {
          color: 'var(--color-critical-red)',
          weight: 2.5,
          dashArray: '2, 4',
          opacity: 0.8,
          className: 'route-compromised-flash'
        }).bindTooltip('<b style="color:var(--color-critical-red)">NH-107 SEGMENT COMPROMISED (LANDSLIDE)</b>', { sticky: true })
          .addTo(arcsLayerRef.current);

        const alternatePath = [
          [30.7346, 79.0669], // Kedarnath
          [30.6865, 79.0550], // Rambara
          [30.6515, 79.0270], // Gaurikund
          [30.6450, 79.0450], // East Ridge Bypass Node
          [30.6342, 79.0145]  // Sonprayag Base
        ];
        L.polyline(alternatePath, {
          color: 'var(--color-safety-green)',
          weight: 2.5,
          dashArray: '4, 4',
          opacity: 0.85,
          className: 'mesh-routing-path'
        }).bindTooltip('<b>AI Rerouted Safe Pedestrian Corridor (East Ridge Bypass)</b>', { sticky: true })
          .addTo(arcsLayerRef.current);
      } else {
        const evacPathPoints = [
          [30.7346, 79.0669],
          [30.6865, 79.0550],
          [30.6515, 79.0270],
          [30.6342, 79.0145]
        ];
        L.polyline(evacPathPoints, {
          color: '#57A573',
          weight: 2.2,
          dashArray: '3, 5',
          opacity: 0.55
        }).bindTooltip('Safe Pedestrian Evacuation Descent Corridor', { sticky: true })
          .addTo(arcsLayerRef.current);
      }
    }

    // Render the volunteer dispatch route if active
    if (mapLayers.rescueRoutes && dispatchRoute) {
      L.polyline(dispatchRoute, {
        color: 'var(--color-safety-green)',
        weight: 3.5,
        dashArray: '5, 5',
        className: 'dispatch-routing-path'
      }).bindTooltip('Responder Dispatched Route', { sticky: true })
        .addTo(arcsLayerRef.current);
    }

    if (mapLayers.rescueRoutes && rescueAnimationCoords) {
      L.marker(rescueAnimationCoords, {
        icon: L.divIcon({
          className: '',
          html: `<div class="rescue-success-pulse"></div>`,
          iconSize: [0, 0]
        }),
        interactive: false
      }).addTo(markersLayerRef.current);
    }

  }, [mapInstance, mapLoaded, alerts, volunteers, selectedAlert, droneFlightActive, droneCoords, droneEta, showFloodOverlay, showLandslideOverlay, showConnectivityOverlay, showHeliOverlay, isLandslideTriggered, networkTransitioning, isRelaying, relayProgress, isCommunityMode, weatherIntensity, mobileNetwork, rssiSignal, mapLayers, dispatchRoute, rescueAnimationCoords]);

  // Simulated encryption function
  const simulateEncryption = (text, location) => {
    const iv = Math.random().toString(16).substring(2, 14);
    const safeBase64 = btoa(unescape(encodeURIComponent(text)));
    const mockCipher = `U2FsdGVkX1+${safeBase64.substring(0, 24)}...[E2EE-GEOLOCATION: lat:${location.lat.toFixed(4)},lng:${location.lng.toFixed(4)}]`;
    return { ciphertext: mockCipher, iv };
  };

  // Simulated AI Engine triage
  const triageAlertWithAI = async (message, category, battery, location) => {
    if (settings.geminiApiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI Triage Coordinator for ResQMesh, an emergency response network.
Analyze this emergency SOS alert. Return ONLY a valid JSON string matching the output format exactly. Do not wrap in markdown code blocks.

Message: "${message}"
Location: lat:${location.lat}, lng:${location.lng}
Battery: ${battery}%
Emergency Type: ${category}

JSON Output Format:
{
  "category": "emergency type string",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "priorityScore": 0-100,
  "summary": "Brief 1-sentence English translation/rescue summary of what is happening",
  "suggestedAction": "Immediate recommended dispatch command",
  "requiredResources": ["list", "of", "needed", "resources"],
  "fakeRiskScore": 0-100,
  "confidenceScore": 0-100
}`
              }]
            }]
          })
        });

        const data = await response.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(rawJsonText.trim().replace(/^```json/, '').replace(/```$/, ''));
        const containsChild = /child|kid|baby|infant|bacha|baccha|bachhe|बच्चे|बच्चा/i.test(message);
        let finalSeverity = parsed.severity || 'Medium';
        let finalPriority = parsed.priorityScore || 50;
        let finalSummary = parsed.summary || 'Summary unavailable';
        let finalAction = parsed.suggestedAction || 'Check site for emergency safety status.';

        if (containsChild) {
          finalSeverity = 'Critical';
          finalPriority = Math.max(95, Math.min(100, finalPriority + 40));
          finalSummary = `[👶 CHILDREN DETECTED] ${finalSummary}`;
          finalAction = `Priority dispatch: Children/infants reported. ${finalAction}`;
        }

        return {
          aiSummary: finalSummary,
          severity: finalSeverity,
          priorityScore: finalPriority,
          suggestedAction: finalAction,
          requiredResources: parsed.requiredResources || ['first_aid'],
          fakeRiskScore: parsed.fakeRiskScore || 10,
          confidenceScore: parsed.confidenceScore || 90,
          triageTimeline: [
            `${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - SOS Packet Generated`,
            `${new Date(Date.now() + 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - Relayed through Mesh Nodes`,
            `${new Date(Date.now() + 2000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - Uploaded via Gateway`,
            `${new Date(Date.now() + 3000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - AI Priority Classified: ${finalSeverity}`
          ]
        };
      } catch (err) {
        console.error('Gemini Live API Triage Error, falling back to local model:', err);
      }
    }

    // Local heuristic processor fallback if no API key is specified
    let severity = 'Medium';
    let priorityScore = 55;
    let summary = message;
    let suggestedAction = 'Dispatch nearby assessment volunteers.';
    let requiredResources = ['first_aid'];
    let fakeRiskScore = 8;
    let confidenceScore = 92;

    const msgLower = message.toLowerCase();

    if (msgLower.includes('landslide') || msgLower.includes('slip') || msgLower.includes('flood') || msgLower.includes('water rising') || msgLower.includes('trapped') || msgLower.includes('gorge') || msgLower.includes('फंसे') || msgLower.includes('भूस्खलन') || msgLower.includes('बाढ़')) {
      severity = 'Critical';
      priorityScore = 95;
      summary = 'Landslide or flash floods isolated victims in deep valley zone requiring helicopter/drone evacuation.';
      suggestedAction = 'Active landslide blocked NH-107 near Sonprayag. Alternate pedestrian track or heavy drone supply drop recommended.';
      requiredResources = ['rescue_boat', 'swimming'];
      fakeRiskScore = 5;
      confidenceScore = 95;
    } else if (msgLower.includes('fracture') || msgLower.includes('tibia') || msgLower.includes('hypothermia') || msgLower.includes('asthma') || msgLower.includes('medical') || msgLower.includes('dewa') || msgLower.includes('दवा') || msgLower.includes('चोट')) {
      severity = 'High';
      priorityScore = 88;
      summary = 'High-altitude medical distress or physical trauma. Patient needs stabilizing meds and evacuation.';
      suggestedAction = 'Kedarnath base reports heavy fog. Air rescue visibility low. Send ground guides or dispatch heavy UAV with medicine.';
      requiredResources = ['medicine', 'first_aid'];
      fakeRiskScore = 10;
      confidenceScore = 90;
    } else if (msgLower.includes('food') || msgLower.includes('water') || msgLower.includes('hungry') || msgLower.includes('rations') || msgLower.includes('राशन') || msgLower.includes('भोजन')) {
      severity = 'Medium';
      priorityScore = 65;
      summary = 'Evacuation base camp reporting ration shortages and drinking water exhaustion.';
      suggestedAction = 'Redirect ITBP volunteer pack-mule teams or drone drops to supply stranded groups.';
      requiredResources = ['food_water'];
      fakeRiskScore = 12;
      confidenceScore = 88;
    }

    const containsChild = /child|kid|baby|infant|bacha|baccha|bachhe|बच्चे|बच्चा/i.test(message);
    if (containsChild) {
      severity = 'Critical';
      priorityScore = Math.max(95, Math.min(100, priorityScore + 40));
      summary = `[👶 CHILDREN DETECTED] ${summary}`;
      suggestedAction = `Priority Dispatch: Children/infants reported. ${suggestedAction}`;
    }

    const triageTimeline = [
      `${new Date(Date.now() - 4000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - SOS Packet Generated`,
      `${new Date(Date.now() - 3000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - Relayed through Mesh Nodes`,
      `${new Date(Date.now() - 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - Uploaded via Gateway`,
      `${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - AI Priority Classified: ${severity}`
    ];

    return { severity, priorityScore, aiSummary: summary, suggestedAction, requiredResources, fakeRiskScore, confidenceScore, triageTimeline };
  };

  // Cinematic 4-phase network-failure toggle handler with custom logs & audio triggers
  const handleNetworkToggle = () => {
    const nextState = mobileNetwork === 'online' ? 'offline' : 'online';
    if (nextState === 'offline') {
      // Immediate Cellular Outage triggers
      setMobileNetwork('offline');
      setNetworkTransitioning(true);
      setNetworkPhase('searching');
      playAlertSiren();
      setIsMapShaking(true);
      setTimeout(() => setIsMapShaking(false), 500);

      injectFeedbackLog('🚨 CELLULAR OUTAGE DETECTED! Ground cell backhaul compromised.', 'error');
      injectFeedbackLog('🔄 Switching to ResQMesh Emergency P2P Protocol...', 'warning');
      
      // Phase 2: Relay path established...
      setTimeout(() => {
        setNetworkPhase('relayFound');
        playSystemSound('ping');
        injectFeedbackLog('📡 Relay scanning active. Discovered local mountain beacons.', 'info');
      }, 1500);

      // Phase 3: Packet forwarded via volunteer mesh...
      setTimeout(() => {
        setNetworkPhase('forwarding');
        playSystemSound('beep');
        injectFeedbackLog('🔗 Dynamic local mesh path established via Gaurikund Node B', 'info');
      }, 3000);

      // Phase 4: Gateway synchronization restored...
      setTimeout(() => {
        setNetworkPhase('restored');
        playSystemSound('connect');
        injectFeedbackLog('🛰️ Sync complete: Connection tunnel verified to Phata base gateway', 'success');
      }, 4500);

      // Final complete offline transition
      setTimeout(() => {
        setNetworkTransitioning(false);
        setNetworkPhase('');
        playSystemSound('connect');
        injectFeedbackLog('💚 ResQMesh active fallback: 5 relay gateways synchronized.', 'success');
      }, 6000);
    } else {
      setMobileNetwork('online');
      playSystemSound('connect');
      injectFeedbackLog('Standard LTE network connection restored', 'success');
    }
  };

  // Start Offline P2P Mesh Relay sequence simulation with transmitting delay state
  const handleTriggerSOS = () => {
    if (!sosMessage.trim()) {
      alert('Please write or record a brief description of your emergency.');
      return;
    }
    
    // Play low-frequency SOS transmitted pulse sound immediately
    playSystemSound('sosTransmitted');
    setIsButtonTransmitting(true);
    setSosBroadcasting(true);
    setMobileNetwork('offline'); // immediately switch to offline standard mode

    // 1.2s delay to show TRANSMITTING... on the button with glow pulse
    setTimeout(() => {
      setIsButtonTransmitting(false);
      setIsRelaying(true);
      setRelayProgress(0);
      setSosTransmissionStep(0);
      setMobileTab('relay');

      // 1. Establishing nearby mesh links... (Step 0)
      const logs = [
        '🔄 [0/7 Hops] Establishing nearby mesh links...',
        '🔐 E2EE Envelope generated using Rescue Public Key...',
        '📶 AES-256 Tunnel Handshake initiated (TTL: 255)'
      ];
      setRelayLogs(logs);
      playSystemSound('ping', -0.8); // Left-panned chime for initial hop

      // Step 1: Searching volunteer relay nodes... (1.2s)
      setTimeout(() => {
        setSosTransmissionStep(1);
        setRelayProgress(16);
        setRssiSignal(-64);
        playSystemSound('ping', -0.4);
        setRelayLogs(prev => [
          ...prev, 
          '🔍 [1/7 Hops] Searching volunteer relay nodes...',
          '📡 Connected to Node Phone_B (Karan Thapa) (RSSI: -64dBm)'
        ]);
      }, 1200);

      // Step 2: Packet encrypted... (2.0s)
      setTimeout(() => {
        setSosTransmissionStep(2);
        setRelayProgress(33);
        setRssiSignal(-68);
        playSystemSound('tick', -0.2);
        setRelayLogs(prev => [
          ...prev, 
          '🔐 [2/7 Hops] Packet encrypted and signed.',
          '📦 Store-and-Forward: SOS payload written to Phone_B cache storage (TTL Decayed: 254)'
        ]);
      }, 2000);

      // Step 3: Store-and-forward relay initiated... (3.0s)
      setTimeout(() => {
        setSosTransmissionStep(3);
        setRelayProgress(50);
        setRssiSignal(-75);
        
        if (isLandslideTriggered) {
          playSystemSound('alarm', 0.2);
          setRelayLogs(prev => [
            ...prev, 
            '⚠️ [3/7 Hops] Landslide detected: Terrestrial line-of-sight path occluded!',
            '🛰️ Terrestrial route weak. Attempting satellite failover...',
            '🛰️ Starlink uplink established. Fallback packet routing active.'
          ]);
        } else {
          playSystemSound('ping', 0);
          setRelayLogs(prev => [
            ...prev, 
            '🔗 [3/7 Hops] Terrestrial routing path established.',
            '🔄 Relayed Phone_B ➔ Phone_C (Volunteer NDRF Node) (RSSI: -72dB, TTL: 253)'
          ]);
        }
      }, 3000);

      // Step 4: Gateway synchronization complete... (4.0s)
      setTimeout(() => {
        setSosTransmissionStep(4);
        setRelayProgress(66);
        setRssiSignal(-102);
        playSystemSound('ping', 0.4);
        setRelayLogs(prev => [
          ...prev, 
          '📡 [4/7 Hops] Gateway synchronization complete.',
          '🛰️ Syncing Core: RF Packet received by Phata Base Gateway Station (RSSI: -108dB)'
        ]);
      }, 4000);

      // Step 5: AI triaging incident... (5.0s)
      setTimeout(() => {
        setSosTransmissionStep(5);
        setRelayProgress(83);
        playSystemSound('tick', 0.8);
        setRelayLogs(prev => [
          ...prev, 
          '🧠 [5/7 Hops] AI triaging incident...',
          '🤖 NLP Analyzer running. Translating voice transcription, checking priority tags...'
        ]);
        
        // Count up confidence rating
        setDisplayedConfidence(62);
        setTimeout(() => setDisplayedConfidence(82), 400);
        setTimeout(() => setDisplayedConfidence(96), 800);
      }, 5000);

      // Step 6: Volunteer dispatched... (6.0s)
      setTimeout(() => {
        setSosTransmissionStep(6);
        setRelayProgress(100);
        playSystemSound('confirm', 1.0); // Right-panned chime
        
        const childDetected = /child|kid|baby|infant|bacha|baccha|bachhe|बच्चे|बच्चा/i.test(sosMessage);
        const childLog = childDetected ? '👶 Children detected in transcript! Priority elevated to Critical (triage boost to 95+).' : '';
        
        setRelayLogs(prev => [
          ...prev, 
          `🚁 [6/7 Hops] Volunteer dispatched. UAV supply route suggested (ETA: 2m 31s).`,
          childLog ? `⚠️ ${childLog}` : '✓ Incident triaged successfully.'
        ].filter(Boolean));
      }, 6000);

      // Step 7: Completed (7.0s)
      setTimeout(async () => {
        const encrypted = simulateEncryption(sosMessage, mockMyLocation);
        const aiResult = await triageAlertWithAI(sosMessage, sosCategory, mobileBattery, mockMyLocation);

        // Offline Plus Code generator simulator
        const alphabet = '23456789CFGHJMPQRVWX';
        const mockPlusCode = `8G4P85${alphabet[Math.floor(Math.random() * 20)]}${alphabet[Math.floor(Math.random() * 20)]}+${alphabet[Math.floor(Math.random() * 20)]}${alphabet[Math.floor(Math.random() * 20)]}`;

        const newAlert = {
          alertId: `alert-${Date.now()}`,
          userId: 'user-self',
          name: 'Mock Victim (Self)',
          emergencyType: sosCategory,
          encryptedPayload: encrypted.ciphertext,
          iv: encrypted.iv,
          decryptedMessage: sosMessage,
          lat: mockMyLocation.lat + (Math.random() - 0.5) * 0.01,
          lng: mockMyLocation.lng + (Math.random() - 0.5) * 0.01,
          plusCode: mockPlusCode,
          batteryAtTrigger: mobileBattery,
          hopCount: 2,
          createdAt: new Date().toISOString(),
          status: 'pending',
          assignedVolunteerId: null,
          ...aiResult
        };

        if (dashboardOfflineMode) {
          setSyncQueue(prev => [newAlert, ...prev]);
          setRelayLogs(prev => [...prev, '⚡ Dashboard is Offline. Packet cached on server gateway waiting for network sync!']);
        } else {
          setAlerts(prev => {
            if (prev.some(a => a.alertId === newAlert.alertId)) return prev;
            return [newAlert, ...prev];
          });
          setRelayLogs(prev => [...prev, '✓ Success! Alert uploaded and processed by Rescue Command AI.']);
          playSystemSound('aiPrediction'); // subtle synth tick on AI triage update
          
          // Trigger drone flight automatically since command center received the SOS and suggested a UAV route!
          setDroneTargetCoords([newAlert.lat, newAlert.lng]);
          setDroneFlightActive(true);
          setDroneEta(151);
          setDroneCoords([30.5732, 79.0435]);
          // Automatically enable UAV routes layer
          setMapLayers(prev => ({ ...prev, uavRoutes: true }));
          injectFeedbackLog(`🚀 UAV Drone-01 launched automatically to Mock Victim coords. ETA: 2m 31s.`, 'success');

          // Sync to Firebase!
          if (firestoreDb) {
            addDoc(collection(firestoreDb, 'alerts'), newAlert)
              .then(() => {
                console.log('[Firebase] Alert successfully synced to Firestore!');
              })
              .catch(err => {
                console.error('[Firebase] Alert sync failed:', err);
              });
          }
        }

        setIsRelaying(false);
        setSosBroadcasting(false);
        setSosTransmissionStep(null);
      }, 7000);
    }, 1200);
  };

  // Start simulation of voice recorder
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback if SpeechRecognition is not supported by the browser
      if (isRecording) {
        setIsRecording(false);
        setSosMessage('बाढ़ का पानी हमारे घर में आ गया है, हम छत पर हैं। कोई मदद के लिए नाव भेज दो। (Water has entered our house, we are on the roof. Send a rescue boat)');
      } else {
        setIsRecording(true);
        setSosMessage('Speech recognition not supported in this browser. Loading fallback text...');
        setTimeout(() => {
          setIsRecording(false);
          setSosMessage('बाढ़ का पानी हमारे घर में आ गया है, हम छत पर हैं। कोई मदद के लिए नाव भेज दो। (Water has entered our house, we are on the roof. Send a rescue boat)');
        }, 1500);
      }
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      if (window.resqmeshRecognition) {
        window.resqmeshRecognition.stop();
      }
    } else {
      setIsRecording(true);
      setSosMessage('Listening... Speak now in Hindi or English.');
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSosMessage(transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setSosMessage('बाढ़ का पानी हमारे घर में आ गया है, हम छत पर हैं। कोई मदद के लिए नाव भेज दो। (Speech recognition error)');
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      window.resqmeshRecognition = recognition;
      recognition.start();
    }
  };

  const handleVolunteerModeChange = () => {
    const nextState = !volunteerModeActive;
    setVolunteerModeActive(nextState);
    if (nextState) {
      const selfVol = {
        volunteerId: 'v-self',
        name: 'You (Volunteer Active)',
        skills: ['first_aid', 'local_guide'],
        availability: 'active',
        lat: mockMyLocation.lat,
        lng: mockMyLocation.lng,
        phone: '+91 99999 88888',
        assignedAlertId: null
      };
      setVolunteers(prev => [selfVol, ...prev]);
    } else {
      setVolunteers(prev => prev.filter(v => v.volunteerId !== 'v-self'));
    }
  };

  const handleReportResourceGap = () => {
    if (!gapDesc.trim()) {
      alert('Please fill in details about the resource gap.');
      return;
    }
    
    const encrypted = simulateEncryption(`${gapType.toUpperCase()}: ${gapDesc}`, mockMyLocation);

    const newResource = {
      resourceId: `res-${Date.now()}`,
      userId: 'user-self',
      type: gapType,
      quantity: gapQuantity,
      lat: mockMyLocation.lat + (Math.random() - 0.5) * 0.01,
      lng: mockMyLocation.lng + (Math.random() - 0.5) * 0.01,
      description: gapDesc,
      reportedGap: true,
      encryptedPayload: encrypted.ciphertext,
      iv: encrypted.iv
    };

    setResources(prev => [newResource, ...prev]);
    alert('Resource Gap reported encrypted via P2P Mesh. Decryptable only at Emergency Headquarters.');
    setGapDesc('');
    setMobileTab('home');
  };

  const decryptAlertPayload = (alertObj) => {
    setDecryptingAnimation(true);
    setTimeout(() => {
      setDecryptingAnimation(false);
      setShowDecryptionView(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([alertObj.lat, alertObj.lng], 15);
      }
    }, 1500);
  };

  const handleAssignVolunteer = (volId, alertId) => {
    const activeAlert = alerts.find(a => a.alertId === alertId);
    const activeVolunteer = volunteers.find(v => v.volunteerId === volId);
    
    setAlerts(prev => prev.map(a => 
      a.alertId === alertId 
        ? { ...a, status: 'assigned', assignedVolunteerId: volId, etaSecs: 12 } 
        : a
    ));
    setVolunteers(prev => prev.map(v => 
      v.volunteerId === volId 
        ? { ...v, assignedAlertId: alertId, availability: 'busy' } 
        : v
    ));
    
    if (activeAlert && activeVolunteer) {
      setDispatchRoute([[activeVolunteer.lat, activeVolunteer.lng], [activeAlert.lat, activeAlert.lng]]);
    }
    
    setShowAssignModal(false);
    playSystemSound('rescueAssigned');
    
    injectFeedbackLog(`👨‍🚒 Volunteer Dispatched. ETA: 12s.`, 'info');
    injectOperationalLog(`Volunteer Dispatched to emergency location.`);
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY_ALERTS);
    localStorage.removeItem(STORAGE_KEY_RESOURCES);
    localStorage.removeItem(STORAGE_KEY_VOLUNTEERS);
    setAlerts(INITIAL_ALERTS);
    setResources(INITIAL_RESOURCES);
    setVolunteers(INITIAL_VOLUNTEERS);
    setDroneFlightActive(false);
    alert('Data reset to default simulation state.');
  };

  return (
    <div className={`app-container mobile-view-${mobileView}`}>
      {/* Mobile view navigation top bar */}
      <div className="mobile-view-toggle">
        <button 
          className={`mobile-toggle-btn ${mobileView === 'victim' ? 'active' : ''}`}
          onClick={() => {
            setMobileView('victim');
            playSystemSound('tick');
          }}
        >
          📱 Victim App
        </button>
        <button 
          className={`mobile-toggle-btn ${mobileView === 'map' ? 'active' : ''}`}
          onClick={() => {
            setMobileView('map');
            playSystemSound('tick');
          }}
        >
          🗺️ Command Map
        </button>
        <button 
          className={`mobile-toggle-btn ${mobileView === 'command' ? 'active' : ''}`}
          onClick={() => {
            setMobileView('command');
            playSystemSound('tick');
          }}
        >
          📊 Dashboard
        </button>
      </div>

      {/* =================================LEFT PANE: MOBILE PHONE SIMULATOR =================================*/}
      <div className={`phone-pane ${showPhoneSimulator ? '' : 'collapsed'} ${mobileView === 'victim' ? 'mobile-visible' : 'mobile-hidden'}`}>
        <div className="phone-mockup">
          {/* Futuristic iPhone 17 Pro Max Dynamic Island with 3D Tilt, Click Expansion, and Blackout Morph */}
          <div 
            onClick={() => {
              if (!isIslandExpanded && !isRelaying && !networkTransitioning) {
                setIsIslandExpanded(true);
                playSystemSound('ping');
              }
            }}
            onMouseMove={handleIslandMouseMove}
            onMouseLeave={handleIslandMouseLeave}
            className={`dynamic-island ${isIslandExpanded ? 'expanded' : networkTransitioning ? 'transitioning' : mobileNetwork === 'offline' && !isRelaying && !volunteerModeActive ? 'blackout' : isRelaying ? 'broadcasting' : volunteerModeActive ? 'online-mesh' : ''}`}
            style={{
              transform: isIslandExpanded 
                ? 'translateX(-50%) translateZ(25px)' 
                : `translateX(-50%) rotateX(${islandTilt.x}deg) rotateY(${islandTilt.y}deg) translateZ(10px)`,
            }}
          >
            {isIslandExpanded ? (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', color: '#fff', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--color-rescue-blue)', fontSize: '10px' }}>⚡ RESQMESH CORE TELEMETRY</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIslandExpanded(false);
                      playSystemSound('ping');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '11px' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Grid Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', textTransform: 'uppercase' }}>Cipher Profile</div>
                    <div style={{ fontWeight: '700', color: 'var(--color-safety-green)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Lock size={10} /> AES-GCM (E2EE)
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', textTransform: 'uppercase' }}>RF Mesh Carrier</div>
                    <div style={{ fontWeight: '700', color: '#fff', marginTop: '2px' }}>{loraFrequency.split(' ')[0]} Band</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', textTransform: 'uppercase' }}>Multi-hop Latency</div>
                    <div style={{ fontWeight: '700', color: 'var(--color-warning-orange)', marginTop: '2px' }}>420ms / Hop</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', textTransform: 'uppercase' }}>Battery Health</div>
                    <div style={{ fontWeight: '700', color: mobileBattery < 20 ? 'var(--color-critical-red)' : 'var(--color-safety-green)', marginTop: '2px' }}>
                      {mobileBattery}% (Stretched)
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>
                  <span>Sync Node: Phata HQ</span>
                  <span style={{ color: 'var(--color-safety-green)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-safety-green)' }}></span>
                    SECURE MESH
                  </span>
                </div>
              </div>
            ) : networkTransitioning ? (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', gap: '8px', color: '#fff', animation: 'fade-in 0.2s', padding: '0 6px' }}>
                <RefreshCw size={11} className="animate-spin" />
                <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.2px' }}>
                  {networkPhase === 'searching' && 'SCANNING RELAYS...'}
                  {networkPhase === 'relayFound' && 'ESTABLISHING LINK...'}
                  {networkPhase === 'forwarding' && 'ROUTING MESH...'}
                  {networkPhase === 'restored' && 'SYNCING CORE...'}
                </span>
              </div>
            ) : mobileNetwork === 'offline' && !isRelaying && !volunteerModeActive ? (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', padding: '0 4px', color: '#fff', animation: 'fade-in 0.3s' }}>
                <WifiOff size={11} className="animate-pulse" style={{ color: '#fff' }} />
                <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.4px' }}>⚠️ CELLULAR BLACKOUT</span>
                <span style={{ fontSize: '7px', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.15)', padding: '1px 4px', borderRadius: '4px', fontFamily: 'monospace' }}>OFFLINE</span>
              </div>
            ) : isRelaying ? (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', padding: '0 6px', color: 'var(--color-emergency-red)', animation: 'fade-in 0.3s' }}>
                <div className="dynamic-island-wave"></div>
                <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.2px' }}>
                  SOS RELAYING ({relayProgress}%)
                </span>
                <Wifi size={10} className="animate-pulse" style={{ color: 'var(--color-emergency-red)' }} />
              </div>
            ) : volunteerModeActive ? (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', padding: '0 6px', color: 'var(--color-safety-green)', animation: 'fade-in 0.3s' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-safety-green)' }}></div>
                <span style={{ fontSize: '9px', fontWeight: '800' }}>VOLUNTEER ACTIVE</span>
                <Shield size={10} style={{ color: 'var(--color-safety-green)' }} />
              </div>
            ) : (
              <>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-hover-surface)', border: '1.5px solid var(--color-border)' }}></div>
                <div style={{ width: '30px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--color-text-secondary)' }}></div>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-safety-green)', opacity: 0.8 }}></div>
              </>
            )}
          </div>
          
          <div className="phone-screen">
            {/* Fullscreen Dramatic Outage Overlay */}
            {networkTransitioning && networkPhase === 'searching' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(194, 106, 106, 0.96)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff',
                animation: 'fade-in 0.3s ease',
                padding: '20px',
                textAlign: 'center'
              }}>
                <AlertOctagon size={48} className="animate-bounce" style={{ color: '#fff', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>CELLULAR OUTAGE DETECTED</h3>
                <p style={{ fontSize: '10px', opacity: 0.9, lineHeight: '1.4', margin: 0 }}>
                  Standard BSNL/Jio cellular backhaul down.<br />
                  Initiating fallback to <b>ResQMesh local emergency link...</b>
                </p>
              </div>
            )}

            {/* Phone Status Bar */}
            <div className="phone-status-bar">
              <span>9:41 AM</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {mobileNetwork === 'online' ? (
                  <>
                    <Wifi size={12} style={{ color: 'var(--color-safety-green)' }} />
                    <span style={{ color: 'var(--color-safety-green)' }}>4G LTE</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} style={{ color: 'var(--color-emergency-red)' }} />
                    <span style={{ color: 'var(--color-emergency-red)', fontWeight: 'bold' }}>NO SERVICE</span>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                  <Battery size={14} className={mobileBattery < 20 ? 'text-red-500' : ''} />
                  <span>{mobileBattery}%</span>
                </div>
              </div>
            </div>

            {/* Screen Content Wrapper */}
            <div className="phone-content" style={{ paddingTop: '28px' }}>
              {mobileTab === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-emergency-red)', letterSpacing: '-0.02em', marginBottom: '10px' }}>ResQMesh</h2>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Disaster Offline P2P Relay</p>
                  </div>

                  {/* DYNAMIC NETWORK TOGGLE FOR INTERACTIVE DEMO */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    backgroundColor: 'var(--color-card-bg)', 
                    border: '1px solid var(--color-border)',
                    padding: '8px 12px',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Simulate Network</span>
                    <button
                      onClick={handleNetworkToggle}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: networkTransitioning ? '#C6925B' : mobileNetwork === 'online' ? 'var(--color-safety-green)' : 'var(--color-emergency-red)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '9px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        transition: 'background-color 0.3s'
                      }}
                    >
                      {networkTransitioning ? 'SWITCHING...' : mobileNetwork === 'online' ? 'WiFi/Cell: ON' : 'WiFi/Cell: OFF'}
                    </button>
                  </div>

                  {/* CINEMATIC 4-PHASE NETWORK FAILURE MOMENT */}
                  {networkTransitioning ? (
                    <div style={{
                      backgroundColor: networkPhase === 'restored' ? 'rgba(87, 165, 115, 0.1)' : 'rgba(198, 146, 91, 0.12)',
                      border: `1.5px solid ${networkPhase === 'restored' ? 'rgba(111,175,131,0.6)' : '#C6925B'}`,
                      padding: '12px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: networkPhase === 'restored' ? '#6FAF83' : '#C6925B',
                      animation: 'fade-in 0.3s',
                      transition: 'all 0.4s'
                    }}>
                      <RefreshCw size={20} style={{
                        flexShrink: 0,
                        animation: networkPhase === 'restored' ? 'none' : 'spin 1s linear infinite',
                        color: networkPhase === 'restored' ? '#6FAF83' : '#C6925B'
                      }} />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          {networkPhase === 'searching' && 'Searching nearby relay nodes...'}
                          {networkPhase === 'relayFound' && 'Relay path established...'}
                          {networkPhase === 'forwarding' && 'Forwarding via volunteer mesh...'}
                          {networkPhase === 'restored' && 'Gateway sync restored...'}
                        </div>
                        <div style={{ fontSize: '9px', lineHeight: '1.4', marginTop: '2px' }}>
                          {networkPhase === 'searching' && 'Scanning for local Bluetooth/LoRa beacons'}
                          {networkPhase === 'relayFound' && 'Connected to Gaurikund volunteer node'}
                          {networkPhase === 'forwarding' && 'Forwarding emergency payload package'}
                          {networkPhase === 'restored' && 'Packet uploaded to Phata Gateway base'}
                        </div>
                      </div>
                    </div>
                  ) : mobileNetwork === 'offline' ? (
                    <div style={{ 
                      backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                      border: '1.5px dashed var(--color-emergency-red)', 
                      padding: '12px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      color: 'var(--color-emergency-red)',
                      textAlign: 'left',
                      animation: 'live-status-pulse 2s infinite ease-in-out'
                    }}>
                      <WifiOff size={22} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3px' }}>NO CELLULAR NETWORK</div>
                        <div style={{ fontSize: '9px', opacity: 0.95, lineHeight: '1.3', marginTop: '2px' }}>Towers offline. SOS routing via P2P mesh relay. 4 nodes active.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      backgroundColor: 'rgba(87, 165, 115, 0.06)', 
                      border: '1px solid rgba(87, 165, 115, 0.15)', 
                      padding: '10px 12px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      color: 'var(--color-safety-green)',
                      textAlign: 'left'
                    }}>
                      <Wifi size={20} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Cellular Network Active</div>
                        <div style={{ fontSize: '9px', opacity: 0.85, lineHeight: '1.2', marginTop: '2px' }}>Toggle OFF to demo offline P2P rescue mesh relay.</div>
                      </div>
                    </div>
                  )}

                  {/* PULSING SOS TRIGGER BUTTON — armed/broadcasting state */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <button
                      onClick={() => setMobileTab('sos')}
                      className={sosBroadcasting ? 'sos-armed-button' : 'pulse-button'}
                      style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: sosBroadcasting ? '13px' : '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      <ShieldAlert size={sosBroadcasting ? 32 : 42} style={{ animation: sosBroadcasting ? 'pulse-ring 1s infinite' : undefined }} />
                      <span>{sosBroadcasting ? 'BROADCASTING...' : 'SOS'}</span>
                      {sosBroadcasting && <span style={{ fontSize: '9px', opacity: 0.8, fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>MESH RELAY ACTIVE</span>}
                    </button>
                  </div>

                  {/* Telemetry info cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', backgroundColor: 'var(--color-card-bg)', padding: '12px', borderRadius: '12px', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Radio size={18} style={{ color: 'var(--color-safety-green)' }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '500' }}>Offline Status</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{nearbyNodesCount} nodes active</div>
                        </div>
                      </div>
                      <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: 'var(--color-safety-green)' }}></span>
                    </div>

                    <div style={{ display: 'flex', backgroundColor: 'var(--color-card-bg)', padding: '12px', borderRadius: '12px', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={18} style={{ color: 'var(--color-rescue-blue)' }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '500' }}>Volunteer Mode</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Offer local search & aid</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={volunteerModeActive}
                        onChange={handleVolunteerModeChange}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {mobileTab === 'sos' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Create SOS Message</h3>
                    <button onClick={() => setMobileTab('home')} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Emergency Category</label>
                    <select value={sosCategory} onChange={(e) => setSosCategory(e.target.value)} className="form-control" style={{ backgroundColor: 'var(--color-card-bg)' }}>
                      <option value="medical">Medical Immediate Aid</option>
                      <option value="trapped">Trapped / Flooding</option>
                      <option value="fire">Fire Emergency</option>
                      <option value="food_water">Food & Clean Water Gap</option>
                      <option value="lost_person">Missing / Lost Person</option>
                    </select>
                  </div>

                  {/* VOICE INPUT SIMULATOR */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--color-card-bg)', padding: '12px', borderRadius: '10px' }}>
                    <button
                      onClick={toggleVoiceRecording}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: isRecording ? 'var(--color-critical-red)' : 'var(--color-card-grey)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '500' }}>{isRecording ? 'Recording Voice...' : 'Tap Mic for Voice SOS'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Supports Offline Voice processing</div>
                    </div>
                  </div>

                  <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label">SOS Message Description</label>
                    <textarea
                      placeholder="Describe details (e.g. number of family members, medical symptoms, road blocks)..."
                      value={sosMessage}
                      onChange={(e) => setSosMessage(e.target.value)}
                      className="form-control"
                      style={{ flex: 1, resize: 'none', backgroundColor: 'var(--color-card-bg)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: '#1C1C1E', backgroundColor: 'rgba(0, 122, 255, 0.05)', padding: '8px', borderRadius: '6px' }}>
                    <Shield size={12} style={{ color: 'var(--color-safety-green)' }} />
                    <span>Enabling offline Plus Code: <b>8G4P85PQ+2C</b> (3m grid accuracy)</span>
                  </div>

                  <button
                    disabled={isButtonTransmitting}
                    onClick={handleTriggerSOS}
                    className={isButtonTransmitting ? 'sos-transmitting-button' : 'pulse-button'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: isButtonTransmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s'
                    }}
                  >
                    {isButtonTransmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>TRANSMITTING...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Broadcast SOS Offline</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {mobileTab === 'relay' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', textAlign: 'center' }}>Mesh Routing Log</h3>

                  <div className="radar-circle">
                    <div className="radar-sweep-hand"></div>
                    <Activity size={24} style={{ color: 'var(--color-emergency-red)' }} />
                    <div className="radar-node" style={{ top: '30px', left: '40px', backgroundColor: 'var(--color-safety-green)' }}></div>
                    <div className="radar-node" style={{ bottom: '40px', right: '50px' }}></div>
                    <div className="radar-node" style={{ top: '120px', right: '20px' }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span>Mesh Transit Hops: {Math.min(Math.floor(relayProgress / 33), 3)}</span>
                    <span>TTL: 255</span>
                  </div>

                  <div style={{ width: '100%', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${relayProgress}%`, height: '100%', backgroundColor: 'var(--color-emergency-red)', transition: 'width 0.5s' }}></div>
                  </div>

                  <div style={{ flex: 1, backgroundColor: '#1C1C1E', borderRadius: '10px', padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', color: '#34C759', border: '1px solid #3A3A3C' }}>
                    {relayLogs.map((log, index) => (
                      <div key={index} className="feed-log-item-animated" style={{ wordBreak: 'break-all' }}>{log}</div>
                    ))}
                  </div>

                  <button
                    disabled={isRelaying}
                    onClick={() => setMobileTab('home')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: isRelaying ? 'var(--color-card-grey)' : 'var(--color-safety-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isRelaying ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {isRelaying ? 'Broadcasting Mesh...' : 'Return to Home'}
                  </button>
                </div>
              )}

              {mobileTab === 'map' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Collaborative Mapping</h3>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Report local resource availability or urgent survival gaps to help targeted rescue missions.</p>

                  <div className="form-group">
                    <label className="form-label">Report Type</label>
                    <select value={gapType} onChange={(e) => setGapType(e.target.value)} className="form-control" style={{ backgroundColor: 'var(--color-card-bg)' }}>
                      <option value="food_water">Food & Water Shortage</option>
                      <option value="medicine">Medicine Supply Needed</option>
                      <option value="shelter">Shelter Space Available</option>
                      <option value="transport">Rescue Vehicle/Boat Available</option>
                      <option value="blockage">Road Blocked / Inaccessible Path</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Approximate Unit Quantity</label>
                    <input
                      type="number"
                      value={gapQuantity}
                      onChange={(e) => setGapQuantity(parseInt(e.target.value) || 0)}
                      className="form-control"
                      style={{ backgroundColor: 'var(--color-card-bg)' }}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label">Gap / Supply Details</label>
                    <textarea
                      placeholder="e.g. Drinking water fully run out at relief zone B..."
                      value={gapDesc}
                      onChange={(e) => setGapDesc(e.target.value)}
                      className="form-control"
                      style={{ flex: 1, resize: 'none', backgroundColor: 'var(--color-card-bg)' }}
                    />
                  </div>

                  <button
                    onClick={handleReportResourceGap}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--color-rescue-blue)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Broadcast Resource Details
                  </button>
                </div>
              )}

              {mobileTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px', overflowY: 'auto' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Safe Zones Nearby</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {INITIAL_SAFE_ZONES.map(sz => (
                      <div key={sz.safeZoneId} style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>{sz.name}</span>
                          <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            backgroundColor: sz.status === 'open' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                            color: sz.status === 'open' ? 'var(--color-safety-green)' : 'var(--color-emergency-red)'
                          }}>{sz.status.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Capacity: {sz.capacityCurrent}/{sz.capacityMax} beds</div>
                        <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: 'var(--color-rescue-blue)' }}>
                          <MapPin size={10} />
                          <span>Distance: ~600m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigator */}
            <div className="phone-nav">
              <button onClick={() => setMobileTab('home')} className={`phone-nav-item ${mobileTab === 'home' || mobileTab === 'relay' ? 'active' : ''}`}>
                <Shield size={22} />
                <span>SOS</span>
              </button>
              <button onClick={() => setMobileTab('map')} className={`phone-nav-item ${mobileTab === 'map' ? 'active' : ''}`}>
                <MapPin size={22} />
                <span>Report Gap</span>
              </button>
              <button onClick={() => setMobileTab('profile')} className={`phone-nav-item ${mobileTab === 'profile' ? 'active' : ''}`}>
                <Map size={22} />
                <span>Safe Zones</span>
              </button>
              <button onClick={() => setShowSettingsModal(true)} className="phone-nav-item">
                <Settings size={22} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================RIGHT PANE: FULL-SCREEN MAP & COMMAND INTERFACE =================================*/}
      {/* =================================CENTER COLUMN: CONSOLIDATED LEFT SIDEBAR =================================*/}
      <div className={`left-sidebar-pane ${mobileView === 'command' ? 'mobile-visible' : 'mobile-hidden'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-title-container">
            <div>
              <h2 className="sidebar-title">ResQMesh Command</h2>
              <p className="sidebar-subtitle">Uttarakhand Emergency Grid</p>
              {/* STATUS: DISASTER RESPONSE ACTIVE badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#6FAF83', boxShadow: '0 0 5px #6FAF83', animation: 'live-status-pulse 1.5s infinite' }} />
                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#6FAF83', textTransform: 'uppercase', letterSpacing: '0.8px' }}>STATUS: DISASTER RESPONSE ACTIVE</span>
              </div>
              <div className="operational-metadata" style={{ display: 'flex', gap: '6px', fontSize: '9px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: '500' }}>
                <span>Kedarnath Area</span>
                <span>•</span>
                <span>Relay Stability: 89%</span>
                <span>•</span>
                <span>Last Sync: 1s ago</span>
              </div>
            </div>
            
            <button
              onClick={() => setDashboardOfflineMode(!dashboardOfflineMode)}
              className={`dashboard-status-indicator ${dashboardOfflineMode ? 'offline' : ''}`}
            >
              {dashboardOfflineMode ? (
                <>
                  <WifiOff size={11} />
                  <span>Downtime Sync</span>
                </>
              ) : (
                <>
                  <Wifi size={11} />
                  <span>Gateway Link</span>
                </>
              )}
            </button>
          </div>

          <div className="sidebar-actions-row">
            <button onClick={handleResetData} className="clean-action-link" title="Reset Database to default">
              <RefreshCw size={11} />
              <span>Reset Grid Data</span>
            </button>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
              Relay Band: {loraFrequency}
            </span>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <div className="sidebar-tabs">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          >
            SOS Alerts ({displayAlertsCount})
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          >
            System Status
          </button>
        </div>

        {/* Sidebar Scrollable Content */}
        <div className="sidebar-scrollable-content">
          {activeTab === 'alerts' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="sidebar-sec-title" style={{ fontSize: '11px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} strokeWidth={1.75} style={{ color: 'var(--color-emergency-red)' }} />
                <span>Severity Ranked Feeds</span>
              </div>

              {/* DRAMATIC AI PREDICTION INSIGHT */}
              <div style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.06)', 
                border: '1.5px solid var(--color-emergency-red)', 
                borderRadius: '8px', 
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-emergency-red)' }}>
                  <AlertTriangle size={14} className="animate-pulse" />
                  <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>AI Predictive Insight</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  Mandakini Trail Slip Advisory
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  <b>AI Prediction:</b> Trail collapse probability increasing near Rambara sector. Recommend immediate evacuation.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '4px' }}>
                  <span>CONFIDENCE: 96%</span>
                  <span>UPDATED: JUST NOW</span>
                </div>
              </div>

              {/* Active Alerts List */}
              {alerts
                .filter(a => a.status !== 'rescued' && a.status !== 'resolved')
                .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
                .map(a => {
                  const isSelected = selectedAlert?.alertId === a.alertId;
                  const isAssigned = a.status === 'assigned';
                  const showEta = isAssigned && typeof a.etaSecs === 'number';
                  
                  return (
                    <div 
                      key={a.alertId} 
                      className={`alert-card ${a.severity.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAlert(a);
                        setShowDecryptionView(true);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([a.lat, a.lng], 15);
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid var(--color-rescue-blue)' : '1px solid #E5E5EA',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.2s ease',
                        color: '#1C1C1E'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: '700', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.6px',
                          color: a.severity === 'Critical' ? '#FF3B30' : a.severity === 'High' ? '#FF9F0A' : '#007AFF',
                          backgroundColor: a.severity === 'Critical' ? 'rgba(255, 59, 48, 0.1)' : a.severity === 'High' ? 'rgba(255, 159, 10, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '100px'
                        }}>
                          {a.severity}
                        </span>
                        <span style={{ fontSize: '10px', color: '#8E8E93', fontFamily: 'var(--font-mono)' }}>
                          Priority: {a.priorityScore}/100
                        </span>
                      </div>
                      
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#1C1C1E' }}>
                        {a.name}
                      </div>
                      
                      <p style={{ fontSize: '11px', color: '#3A3A3C', margin: 0, lineHeight: '1.4' }}>
                        {a.aiSummary || a.decryptedMessage}
                      </p>

                      {showEta && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '10px', 
                          fontWeight: '700', 
                          color: 'var(--color-safety-green)',
                          backgroundColor: 'rgba(52, 199, 89, 0.1)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          marginTop: '4px'
                        }}>
                          <span className="live-status-dot-blink" style={{
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-safety-green)'
                          }}></span>
                          <span>👨‍🚒 RESCUER EN ROUTE (ETA: {a.etaSecs}s)</span>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Collapsible Completed Rescues Panel */}
              {alerts.filter(a => a.status === 'rescued' || a.status === 'resolved').length > 0 && (
                <div style={{
                  marginTop: '10px',
                  border: '1px solid #E5E5EA',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(52, 199, 89, 0.05)',
                  overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => setIsCompletedRescuesCollapsed(!isCompletedRescuesCollapsed)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      backgroundColor: 'rgba(52, 199, 89, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      fontWeight: '700',
                      fontSize: '12px',
                      color: '#1C1C1E'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34C759' }}>
                      <CheckCircle size={14} />
                      <span>Completed Rescues ({alerts.filter(a => a.status === 'rescued' || a.status === 'resolved').length})</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#8E8E93' }}>
                      {isCompletedRescuesCollapsed ? '▼' : '▲'}
                    </span>
                  </button>

                  {!isCompletedRescuesCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                      {alerts.filter(a => a.status === 'rescued' || a.status === 'resolved').map(a => (
                        <div 
                          key={a.alertId}
                          style={{
                            padding: '10px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid rgba(52, 199, 89, 0.2)',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ fontWeight: '700', color: '#1C1C1E', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{a.name}</span>
                            <span style={{ color: '#34C759', fontWeight: 'bold' }}>RESCUED</span>
                          </div>
                          <p style={{ color: '#8E8E93', margin: '4px 0 0 0', lineHeight: '1.3' }}>
                            {a.aiSummary || a.decryptedMessage}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pulsing Live Feed Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-safety-green)',
                backgroundColor: 'rgba(87, 165, 115, 0.06)',
                border: '1px solid rgba(87, 165, 115, 0.12)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                <span className="live-status-dot-blink" style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-safety-green)',
                  boxShadow: '0 0 6px var(--color-safety-green)'
                }}></span>
                <span>● LIVE FEED</span>
              </div>

              {/* Network Integrity & Mesh Stability KPIs */}
              <div className="sidebar-metrics-grid">
                <div className="sidebar-metric-card" style={{ borderLeft: '3px solid var(--color-safety-green)' }}>
                  <Shield size={14} style={{ color: 'var(--color-safety-green)' }} />
                  <div>
                    <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Mesh Stability</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-safety-green)' }}>87.4% (Stable)</div>
                  </div>
                </div>

                <div className="sidebar-metric-card" style={{ borderLeft: '3px solid var(--color-rescue-blue)' }}>
                  <Radio size={14} style={{ color: 'var(--color-rescue-blue)' }} />
                  <div>
                    <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Relay Nodes</div>
                    <div style={{ fontSize: '13px', fontWeight: '800' }}>14 Active</div>
                  </div>
                </div>
              </div>

              {/* Core Mesh Performance Indicators */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div className="sidebar-sec-title">
                  <Database size={12} style={{ color: 'var(--color-rescue-blue)' }} />
                  <span>Mesh Telemetry Core</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '8px', textTransform: 'uppercase', marginBottom: '2px' }}>Packets</div>
                    <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>182</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '8px', textTransform: 'uppercase', marginBottom: '2px' }}>Uptime</div>
                    <div style={{ fontWeight: '700', color: 'var(--color-safety-green)' }}>98.2%</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '8px', textTransform: 'uppercase', marginBottom: '2px' }}>Helpers</div>
                    <div style={{ fontWeight: '700', color: 'var(--color-rescue-blue)' }}>12 Active</div>
                  </div>
                </div>
              </div>

              {/* Communications Status & Infrastructure */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div className="sidebar-sec-title">
                  <WifiOff size={12} style={{ color: 'var(--color-emergency-red)' }} />
                  <span>Comm Infrastructure Status</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Telecom Towers:</span>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#fff', backgroundColor: 'var(--color-emergency-red)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OFFLINE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Mesh Relay Network:</span>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#fff', backgroundColor: 'var(--color-safety-green)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', animation: 'live-status-pulse 1.5s infinite ease-in-out' }}>ACTIVE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Satellite Fallback:</span>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#fff', backgroundColor: 'var(--color-rescue-blue)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CONNECTED</span>
                  </div>
                </div>
              </div>

              {/* Risk Intelligence Panel (AI Disaster Prediction Layer) */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div className="sidebar-sec-title">
                  <Activity size={12} style={{ color: 'var(--color-emergency-red)' }} />
                  <span>Risk Intelligence & Weather</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                  <div style={{ backgroundColor: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.15)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '8px', color: 'var(--color-text-muted)' }}>FLOOD PROBABILITY</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-emergency-red)' }}>92% Hotspot</div>
                  </div>
                  <div style={{ backgroundColor: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.15)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '8px', color: 'var(--color-text-muted)' }}>WEATHER THREAT</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#D97706' }}>Heavy Storm</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '8px', backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Rainfall Rate:</span>
                    <span style={{ fontWeight: '600' }}>78 mm/hour</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Wind Speed:</span>
                    <span style={{ fontWeight: '600' }}>42 km/h (East)</span>
                  </div>
                </div>
              </div>

              {/* LoRa Telemetry Details */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div className="sidebar-sec-title">
                  <Cpu size={12} style={{ color: 'var(--color-warning-orange)' }} />
                  <span>RF Mesh Hardware</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Gateway Module:</span>
                    <span style={{ fontWeight: '600' }}>Heltec V3 (LoRa)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>RF Frequency:</span>
                    <span style={{ fontWeight: '600' }}>{loraFrequency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Relay Latency:</span>
                    <span style={{ fontWeight: '600' }}>420ms (Avg/Hop)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Nodes Active:</span>
                    <span style={{ fontWeight: '600', color: 'var(--color-safety-green)' }}>{nearbyNodesCount} Relays</span>
                  </div>
                </div>
              </div>

              {/* Deficit Logs */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div className="sidebar-sec-title">
                  <TrendingDown size={12} style={{ color: 'var(--color-emergency-red)' }} />
                  <span>Resource Gaps</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '3px' }}>
                      <span>Clean Drinking Water</span>
                      <span style={{ color: 'var(--color-emergency-red)' }}>-150 Units</span>
                    </div>
                    <div className="deficit-bar-bg">
                      <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--color-emergency-red)' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '3px' }}>
                      <span>Medical Inhalers</span>
                      <span style={{ color: 'var(--color-warning-orange)' }}>-5 Units</span>
                    </div>
                    <div className="deficit-bar-bg">
                      <div style={{ width: '40%', height: '100%', backgroundColor: 'var(--color-warning-orange)' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '3px' }}>
                      <span>Dry Rations & Tents</span>
                      <span style={{ color: 'var(--color-rescue-blue)' }}>-85 Units</span>
                    </div>
                    <div className="deficit-bar-bg">
                      <div style={{ width: '55%', height: '100%', backgroundColor: 'var(--color-rescue-blue)' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation in System */}
              <div className="clean-info-box" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="clean-info-box-title">
                  <Zap size={11} />
                  <span>AI Disaster Dispatch Recommendations</span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Landslide slipped at Rambara gorge, washing away hiking track. Suresh Rawat is trapped. Phata helipad is restricted due to cloud ceiling. Suggest dispatching autonomous UAV route carrying trauma medicine to Rambara coords.
                </p>
                {!droneFlightActive && (
                  <button
                    onClick={() => {
                      const targetAlert = alerts.find(a => a.name.includes('Suresh') || a.decryptedMessage.includes('Rambara')) || alerts[0];
                      if (targetAlert) {
                        setSelectedAlert(targetAlert);
                      }
                      const coords = targetAlert ? [targetAlert.lat, targetAlert.lng] : [30.7346, 79.0669];
                      setDroneTargetCoords(coords);
                      setDroneFlightActive(true);
                      setDroneEta(151);
                      setDroneCoords([30.5732, 79.0435]);
                      setMapLayers(prev => ({ ...prev, uavRoutes: true }));
                      injectFeedbackLog(`🚀 UAV Drone-01 launched to Suresh Rawat coordinates. ETA: 2m 31s.`, 'success');
                      injectOperationalLog(`UAV Drone dispatched to Rambara sector.`);
                      playSystemSound('confirm');
                    }}
                    style={{
                      marginTop: '4px',
                      padding: '6px 10px',
                      backgroundColor: 'var(--color-warning-orange)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(245,158,11,0.25)'
                    }}
                  >
                    <Navigation size={10} style={{ transform: 'rotate(45deg)' }} />
                    <span>Launch UAV Supply Drop Now</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================RIGHT COLUMN: HERO MAP PANE (Unobstructed) =================================*/}
      <div className={`map-pane ${is3dTiltedView ? 'tilted-view' : ''} ${isMapShaking ? 'map-shake' : ''} ${mobileView === 'map' ? 'mobile-visible' : 'mobile-hidden'}`}>
        
        {/* Floating Toggle Button for Mobile Simulator */}
        <button
          onClick={() => setShowPhoneSimulator(!showPhoneSimulator)}
          className="phone-toggle-btn"
        >
          <Radio size={14} className={showPhoneSimulator ? 'animate-pulse' : ''} />
          <span>{showPhoneSimulator ? 'Hide Victim Simulator' : 'Show Victim Simulator'}</span>
        </button>

        {/* Full-screen Leaflet container */}
        <div ref={mapRef} className={`map-container ${isTransitioningLayer ? 'layer-swap-transition' : ''} ${networkTransitioning ? 'map-pulse-network-offline' : ''} ${weatherIntensity !== 'normal' ? `weather-${weatherIntensity}` : ''}`}></div>

        {/* Subtle Conic Radar Sweep Overlay */}
        <div className="radar-sweep-overlay"></div>

        {/* Weather Atmospheric & Terrain Shading Overlays */}
        <div className="weather-fog-overlay"></div>
        <div className="weather-rain-overlay"></div>
        <div className="weather-cloud-shadow-overlay"></div>
        <div className="map-elevation-depth-overlay"></div>

        {/* Red vignette flash on critical alert */}
        {isMapFlashing && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1999, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(194,106,106,0.18) 0%, rgba(194,106,106,0.08) 50%, transparent 80%)',
            animation: 'map-red-flash 0.8s ease-out forwards'
          }} />
        )}

        {/* ⚠ CRITICAL EVENT POPUP — slides in from top, 6s auto-dismiss */}
        {criticalEventPopup && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            backgroundColor: 'rgba(194, 106, 106, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid #C26A6A',
            borderRadius: '10px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(194,106,106,0.35)',
            animation: 'slide-down-popup 0.5s cubic-bezier(0.16,1,0.3,1)',
            fontFamily: 'var(--font-mono)',
            minWidth: '300px'
          }}>
            <AlertTriangle size={22} style={{ flexShrink: 0, animation: 'pulse-ring 1s infinite' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.3px' }}>{criticalEventPopup.title}</div>
              <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>{criticalEventPopup.detail}</div>
            </div>
            <button onClick={() => setCriticalEventPopup(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, fontSize: '16px' }}>✕</button>
          </div>
        )}

        {/* ⚡ ALERT INTERRUPTION TOAST — bottom-center, away from drone card */}
        {mapLayers.toastAlerts && alertToast && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2001,
            backgroundColor: 'rgba(30, 40, 50, 0.92)',
            backdropFilter: 'blur(14px)',
            border: '1.5px solid rgba(111, 175, 131, 0.45)',
            borderRadius: '10px',
            padding: '11px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(111,175,131,0.15)',
            animation: 'slide-up-toast 0.4s cubic-bezier(0.16,1,0.3,1)',
            fontFamily: 'var(--font-mono)',
            minWidth: '260px',
            maxWidth: '340px',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6FAF83', flexShrink: 0, boxShadow: '0 0 8px #6FAF83', animation: 'pulse-ring 1s infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.2px', color: '#6FAF83' }}>{alertToast.title}</div>
              <div style={{ fontSize: '9.5px', opacity: 0.8, marginTop: '2px', lineHeight: '1.3' }}>{alertToast.detail}</div>
            </div>
            <button onClick={() => setAlertToast(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>✕</button>
          </div>
        )}


        {/* ============================================================
             MERGED: Operational Feed + Grid Legend (TABBED) — bottom-right
             Replaces two overlapping floating cards with one clean widget
        ============================================================ */}
        {(() => {
          const availableTabs = [];
          if (mapLayers.feed) availableTabs.push('feed');
          if (mapLayers.legend) availableTabs.push('legend');
          if (availableTabs.length === 0) return null;
          const currentTab = availableTabs.includes(feedViewTab) ? feedViewTab : availableTabs[0];
          return (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              width: '295px',
              backgroundColor: 'rgba(236, 231, 222, 0.52)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              borderRadius: '10px',
              padding: '0',
              zIndex: 1000,
              boxShadow: '0 1px 8px rgba(0,0,0,0.025)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden'
            }}>
              {/* Tab header */}
              {availableTabs.length > 1 && (
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  {availableTabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFeedViewTab(tab)}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        fontSize: '8px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        background: 'none',
                        border: 'none',
                        borderBottom: currentTab === tab ? '2px solid #6FAF83' : '2px solid transparent',
                        color: currentTab === tab ? '#6FAF83' : 'rgba(71,71,71,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab === 'feed' ? '● Feed' : '◈ Legend'}
                    </button>
                  ))}
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6FAF83', alignSelf: 'center', marginRight: '10px', flexShrink: 0, animation: currentTab === 'feed' ? 'pulse-ring 1.5s infinite' : 'none' }} />
                </div>
              )}
              {availableTabs.length === 1 && (
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '5px 11px', fontWeight: '700', fontSize: '8px', textTransform: 'uppercase', color: '#6FAF83', alignItems: 'center', justifyContent: 'space-between', height: '26px' }}>
                  <span>{currentTab === 'feed' ? '● Operational Feed' : '◈ Grid Legend'}</span>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6FAF83', flexShrink: 0, animation: currentTab === 'feed' ? 'pulse-ring 1.5s infinite' : 'none' }} />
                </div>
              )}

              <div style={{ padding: '6px 11px 8px' }}>
                {currentTab === 'feed' ? (
                  <div ref={feedScrollRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5px', maxHeight: '92px', overflowY: 'auto' }}>
                    {systemFeedbackLogs.map(log => (
                      <div
                        key={log.id}
                        className="feed-log-item-animated"
                        style={{
                          display: 'flex',
                          gap: '5px',
                          lineHeight: '1.25',
                          fontSize: '11px',
                          color: log.type === 'danger' ? '#C26A6A' : log.type === 'success' ? '#6FAF83' : log.type === 'warning' ? '#C6925B' : 'rgba(55,55,55,0.72)'
                        }}
                      >
                        <span style={{ opacity: 0.4, flexShrink: 0, fontSize: '10px' }}>[{log.time}]</span>
                        <span style={{ fontWeight: '500' }}>{log.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: 'var(--color-text-secondary)', fontSize: '9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C26A6A', flexShrink: 0 }} />
                      <span>Victim SOS Node</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#5B8DEF', flexShrink: 0 }} />
                      <span>Resource Safe Zone</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#6FAF83', transform: 'rotate(45deg)', flexShrink: 0 }} />
                      <span>Volunteer Active</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '8px solid #C6925B', flexShrink: 0 }} />
                      <span>Active UAV Drone</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="8" height="10" viewBox="0 0 8 10" style={{ flexShrink: 0 }}>
                        <line x1="4" y1="0" x2="4" y2="8" stroke="#C26A6A" strokeWidth="1"/>
                        <line x1="1" y1="3" x2="7" y2="3" stroke="#C26A6A" strokeWidth="1"/>
                        <line x1="1" y1="1" x2="7" y2="7" stroke="#C26A6A" strokeWidth="1.2" opacity="0.6"/>
                      </svg>
                      <span>Telecom OFFLINE Tower</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* DRONE DISPATCH TELEMETRY FLOATING CARD */}
        {droneFlightActive && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 1000,
            width: '270px',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Navigation size={14} className="animate-pulse" style={{ color: 'var(--color-emergency-red)' }} />
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UAV Drone-01 Active</span>
              </div>
              <span style={{ 
                fontSize: '9px', 
                backgroundColor: droneEta <= 6 ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)', 
                color: droneEta <= 6 ? 'var(--color-safety-green)' : 'var(--color-rescue-blue)', 
                padding: '2px 6px', 
                borderRadius: '10px', 
                fontWeight: '700' 
              }}>
                {droneEta <= 6 ? 'RELEASED' : 'EN-ROUTE'}
              </span>
            </div>
            
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div>ALTITUDE</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {weatherIntensity === 'normal' ? '120 meters' : weatherIntensity === 'storm' ? '95 meters (Low Ceiling)' : '80 meters (Crit Ceiling)'}
                </div>
              </div>
              <div>
                <div>AIRSPEED</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {weatherIntensity === 'normal' ? '42 km/h' : weatherIntensity === 'storm' ? '32 km/h (Headwind)' : '24 km/h (Storm Drag)'}
                </div>
              </div>
              <div>
                <div>BATTERY</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-safety-green)' }}>87%</div>
              </div>
              <div>
                <div>ETA TO TARGET</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: droneEta <= 6 ? 'var(--color-safety-green)' : '#f59e0b', animation: droneEta <= 6 ? 'pulse 1s infinite' : 'none' }}>
                  {droneEta <= 6 ? '0m 00s' : `${Math.floor(droneEta / 60)}m ${String(droneEta % 60).padStart(2, '0')}s`}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px', fontSize: '10px' }}>
              <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Wind / Visibility</div>
              <div style={{ fontWeight: '600', color: weatherIntensity === 'normal' ? 'var(--color-text-secondary)' : weatherIntensity === 'storm' ? 'var(--color-warning-orange)' : 'var(--color-critical-red)' }}>
                {weatherIntensity === 'normal' && 'Wind: 12kt (W) | Vis: 8km'}
                {weatherIntensity === 'storm' && '⚠️ Wind: 24kt (Gale) | Vis: 4.5km | Auto-Drift Compensating'}
                {weatherIntensity === 'cloudburst' && '🚨 Wind: 38kt (Severe Turb) | Vis: 1.2km | Rerouting East Ridge Bypass'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px', fontSize: '10px' }}>
              <div style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Payload Config</div>
              <div style={{ fontWeight: '700', color: droneEta <= 6 ? 'var(--color-safety-green)' : 'var(--color-rescue-blue)', animation: droneEta <= 6 ? 'pulse 0.8s infinite' : 'none' }}>
                {droneEta <= 6 
                  ? '📦 SUPPLY CRATE RELEASED AT TARGET' 
                  : selectedAlert?.emergencyType === 'medical' ? '✓ Rapid Nebulizer + Insulin Pack' : '✓ 2.5L Clean Water + Food Rations'}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
             NEW UNIFIED DOCK & CONTROLS: Top-Center & Top-Right
        ============================================================ */}
        {/* MAP FLOATING LAYER CONTROLS (Top-Right) */}
        <div className="map-layer-controls" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {/* Focus Toggle Trigger */}
          <button
            onClick={() => {
              setIsFocusMode(!isFocusMode);
              playSystemSound('confirm');
            }}
            className={`minimal-pill-btn ${isFocusMode ? 'active' : ''}`}
            style={{
              fontWeight: '700',
              background: isFocusMode ? 'var(--color-rescue-blue)' : '',
              borderColor: isFocusMode ? 'var(--color-rescue-blue)' : '',
              color: isFocusMode ? '#fff' : '',
              boxShadow: isFocusMode ? '0 0 10px rgba(59,130,246,0.3)' : ''
            }}
          >
            <Shield size={11} />
            <span>{isFocusMode ? 'Exit Focus' : 'Focus Map'}</span>
          </button>

          {/* Additional Layers - only shown if not in Focus Mode */}
          {!isFocusMode && (
            <>
              {/* Base Layer Row */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setMapBaseLayer('terrain')}
                  className={`minimal-pill-btn ${mapBaseLayer === 'terrain' ? 'active' : ''}`}
                >
                  <Compass size={11} />
                  <span>Terrain</span>
                </button>
                <button
                  onClick={() => setMapBaseLayer('satellite')}
                  className={`minimal-pill-btn ${mapBaseLayer === 'satellite' ? 'active' : ''}`}
                >
                  <Layers size={11} />
                  <span>Satellite</span>
                </button>
                <button
                  onClick={() => setMapBaseLayer('standard')}
                  className={`minimal-pill-btn ${mapBaseLayer === 'standard' ? 'active' : ''}`}
                >
                  <Globe size={11} />
                  <span>Standard</span>
                </button>
              </div>

              {/* Overlays Row */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '520px', alignItems: 'center' }}>
                {/* Weather Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-bg-dark)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '2px 8px', height: '22px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: '600' }}>🌧️ WEATHER:</span>
                  <select 
                    value={weatherIntensity} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setWeatherIntensity(val);
                      playSystemSound('beep');
                      if (val === 'normal') {
                        injectFeedbackLog('Weather: Normal clearing (Wind: 12kt, Vis: 8km)', 'info');
                      } else if (val === 'storm') {
                        injectFeedbackLog('Weather Warning: Rainfall Intensity Rising (Wind: 24kt, Vis: 4.5km)', 'warning');
                      } else if (val === 'cloudburst') {
                        playSystemSound('landslideWarning');
                        injectFeedbackLog('🚨 WEATHER CRITICAL: Cloudburst active! High flood risk (Wind: 38kt, Vis: 1.2km)', 'error');
                      }
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--color-text-primary)', 
                      fontSize: '9px', 
                      fontFamily: 'monospace', 
                      fontWeight: '800',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="normal" style={{background: 'var(--color-panel-dark)', color: 'var(--color-text-primary)'}}>NORMAL</option>
                    <option value="storm" style={{background: 'var(--color-panel-dark)', color: 'var(--color-text-primary)'}}>STORM</option>
                    <option value="cloudburst" style={{background: 'var(--color-panel-dark)', color: 'var(--color-text-primary)'}}>CLOUDBURST</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setIsCommunityMode(!isCommunityMode);
                    playSystemSound('ping');
                    injectFeedbackLog(
                      !isCommunityMode 
                        ? '👥 Community Mesh Active: Civilian relay nodes online (+3.2km range)' 
                        : '👥 Community Mesh Disabled: Reverting to standard command beacons',
                      'info'
                    );
                  }}
                  className={`minimal-pill-btn ${isCommunityMode ? 'active' : ''}`}
                  style={{
                    background: isCommunityMode ? '#3B82F6' : '',
                    borderColor: isCommunityMode ? '#3B82F6' : '',
                    color: isCommunityMode ? '#fff' : ''
                  }}
                  title="Activate civilian peer-to-peer relay nodes"
                >
                  <User size={11} />
                  <span>Mesh Mode</span>
                </button>

                <button
                  onClick={() => setIs3dTiltedView(!is3dTiltedView)}
                  className={`minimal-pill-btn ${is3dTiltedView ? 'active' : ''}`}
                  title="Toggle 3D Perspective Tilt"
                >
                  <Map size={11} />
                  <span>3D Tilt</span>
                </button>

                {/* Map Layers Dropdown Button */}
                <div className="map-layers-container" style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setIsLayersDropdownOpen(!isLayersDropdownOpen);
                      playSystemSound('ping');
                    }}
                    className={`minimal-pill-btn ${isLayersDropdownOpen ? 'active' : ''}`}
                    style={{
                      fontWeight: '700',
                      background: isLayersDropdownOpen ? 'rgba(59,130,246,0.2)' : 'rgba(30, 41, 59, 0.4)',
                      borderColor: isLayersDropdownOpen ? 'var(--color-rescue-blue)' : 'rgba(148, 163, 184, 0.3)',
                      color: isLayersDropdownOpen ? 'var(--color-rescue-blue)' : 'var(--color-text-primary)',
                      boxShadow: isLayersDropdownOpen ? '0 0 10px rgba(59,130,246,0.3)' : '',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Layers size={11} />
                    <span>Map Layers ({Object.values(mapLayers).filter(Boolean).length}/17)</span>
                  </button>

                  {isLayersDropdownOpen && (
                    <div className="map-layers-dropdown" style={{ zIndex: 1100 }}>
                      <div className="map-layers-presets-row">
                        <button onClick={() => { applyFocusPreset(); playSystemSound('confirm'); }} className={`preset-btn focus ${isFocusMode ? 'active' : ''}`}>Focus</button>
                        <button onClick={() => { applyCommandPreset(); playSystemSound('confirm'); }} className={`preset-btn command ${!isFocusMode && mapLayers.telemetry && mapLayers.uavRoutes ? 'active' : ''}`}>Command</button>
                        <button onClick={() => { applyPublicPreset(); playSystemSound('confirm'); }} className={`preset-btn public ${!isFocusMode && !mapLayers.telemetry && !mapLayers.uavRoutes ? 'active' : ''}`}>Public</button>
                      </div>

                      <div className="map-layers-groups">
                        <div className="map-layers-group">
                          <span className="map-layers-group-title">Mission</span>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.timeline} onChange={e => { setMapLayers(prev => ({ ...prev, timeline: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-green"></span>
                            <span className="toggle-label">Mission Timeline</span>
                          </label>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.incidentCommander} onChange={e => { setMapLayers(prev => ({ ...prev, incidentCommander: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-green"></span>
                            <span className="toggle-label">Incident AI</span>
                          </label>
                        </div>

                        <div className="map-layers-group">
                          <span className="map-layers-group-title">Network</span>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.telemetry} onChange={e => { setMapLayers(prev => ({ ...prev, telemetry: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-blue"></span>
                            <span className="toggle-label">Network Telemetry</span>
                          </label>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.meshRadius} onChange={e => { setMapLayers(prev => ({ ...prev, meshRadius: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-blue"></span>
                            <span className="toggle-label">Mesh Radius</span>
                          </label>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.meshNodes} onChange={e => { setMapLayers(prev => ({ ...prev, meshNodes: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-blue"></span>
                            <span className="toggle-label">Mesh Topology</span>
                          </label>
                        </div>

                        <div className="map-layers-group">
                          <span className="map-layers-group-title">Rescue</span>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.rescueRoutes} onChange={e => { setMapLayers(prev => ({ ...prev, rescueRoutes: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-green"></span>
                            <span className="toggle-label">Rescue Routes</span>
                          </label>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.uavRoutes} onChange={e => { setMapLayers(prev => ({ ...prev, uavRoutes: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-green"></span>
                            <span className="toggle-label">UAV Routes</span>
                          </label>
                        </div>

                        <div className="map-layers-group">
                          <span className="map-layers-group-title">Hazards</span>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.hazardZones} onChange={e => { setMapLayers(prev => ({ ...prev, hazardZones: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-red"></span>
                            <span className="toggle-label">Hazards</span>
                          </label>
                        </div>

                        <div className="map-layers-group">
                          <span className="map-layers-group-title">Feed & Info</span>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.feed} onChange={e => { setMapLayers(prev => ({ ...prev, feed: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-blue"></span>
                            <span className="toggle-label">Operational Feed</span>
                          </label>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.legend} onChange={e => { setMapLayers(prev => ({ ...prev, legend: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-blue"></span>
                            <span className="toggle-label">Map Symbols / Legend</span>
                          </label>
                          <label className="toggle-switch">
                            <input type="checkbox" checked={mapLayers.toastAlerts} onChange={e => { setMapLayers(prev => ({ ...prev, toastAlerts: e.target.checked })); playSystemSound('beep'); }} />
                            <span className="slider toggle-blue"></span>
                            <span className="toggle-label">Toast Alerts</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ============================================================
             NEW UNIFIED NAVBAR: Top-Center View Layers
        ============================================================ */}
        {!isFocusMode && (
          <div className="mission-control-dock" style={{
            position: 'absolute',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid #E5E5EA',
            borderRadius: '20px',
            padding: '4px 8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px'
          }}>
            <span style={{ color: '#8E8E93', fontWeight: '800', paddingRight: '6px', borderRight: '1px solid #E5E5EA', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '9px' }}>View Layers</span>
            <button onClick={toggleMissionLayerGroup} className="minimal-pill-btn" style={{ border: 'none', background: mapLayers.mission ? 'rgba(52,199,89,0.15)' : 'none', color: mapLayers.mission ? 'var(--color-safety-green)' : 'var(--color-text-secondary)', fontWeight: mapLayers.mission ? 'bold' : '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{mapLayers.mission ? '✓' : '○'}</span>
              <span>Mission</span>
            </button>
            <button onClick={toggleNetworkLayerGroup} className="minimal-pill-btn" style={{ border: 'none', background: mapLayers.network ? 'rgba(0,122,255,0.15)' : 'none', color: mapLayers.network ? 'var(--color-rescue-blue)' : 'var(--color-text-secondary)', fontWeight: mapLayers.network ? 'bold' : '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{mapLayers.network ? '✓' : '○'}</span>
              <span>Network</span>
            </button>
            <button onClick={toggleRescueLayerGroup} className="minimal-pill-btn" style={{ border: 'none', background: mapLayers.rescue ? 'rgba(52,199,89,0.15)' : 'none', color: mapLayers.rescue ? 'var(--color-safety-green)' : 'var(--color-text-secondary)', fontWeight: mapLayers.rescue ? 'bold' : '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{mapLayers.rescue ? '✓' : '○'}</span>
              <span>Rescue</span>
            </button>
            <button onClick={toggleHazardsLayerGroup} className="minimal-pill-btn" style={{ border: 'none', background: mapLayers.hazards ? 'rgba(255,59,48,0.15)' : 'none', color: mapLayers.hazards ? 'var(--color-emergency-red)' : 'var(--color-text-secondary)', fontWeight: mapLayers.hazards ? 'bold' : '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{mapLayers.hazards ? '✓' : '○'}</span>
              <span>Hazards</span>
            </button>
            <button onClick={toggleFeedLayerGroup} className="minimal-pill-btn" style={{ border: 'none', background: mapLayers.feed ? 'rgba(0,122,255,0.15)' : 'none', color: mapLayers.feed ? 'var(--color-rescue-blue)' : 'var(--color-text-secondary)', fontWeight: mapLayers.feed ? 'bold' : '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{mapLayers.feed ? '✓' : '○'}</span>
              <span>Feed</span>
            </button>
            <button onClick={toggleLegendLayerGroup} className="minimal-pill-btn" style={{ border: 'none', background: mapLayers.legend ? 'rgba(0,122,255,0.15)' : 'none', color: mapLayers.legend ? 'var(--color-rescue-blue)' : 'var(--color-text-secondary)', fontWeight: mapLayers.legend ? 'bold' : '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{mapLayers.legend ? '✓' : '○'}</span>
              <span>Legend</span>
            </button>
          </div>
        )}
      </div>

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>ResQMesh Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
            </div>

            <div className="form-group">
              <label className="form-label">Gemini API Key (Optional)</label>
              <input
                type="password"
                placeholder="Paste Gemini API Key to enable live triage translation..."
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                className="form-control"
              />
              <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                If provided, incoming offline messages will be parsed live using the <b>Gemini 1.5 Flash</b> API to translate regional languages and score priorities. If left empty, the app uses local emergency matching heuristics.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Firebase Configuration JSON</label>
              <textarea
                placeholder="Paste Firebase Config JSON here..."
                value={settings.firebaseConfigText || ''}
                onChange={(e) => setSettings({ ...settings, firebaseConfigText: e.target.value })}
                className="form-control"
                style={{ width: '100%', height: '80px', fontFamily: 'var(--font-mono)', fontSize: '10px', resize: 'vertical' }}
              />
              <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                Paste the configuration JSON from your Firebase console to synchronize alerts in real-time.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">RF Carrier Band Frequency</label>
              <select value={loraFrequency} onChange={(e) => setLoraFrequency(e.target.value)} className="form-control" style={{ width: '100%' }}>
                <option value="868 MHz (IN/EU)">868 MHz India / Europe license-free</option>
                <option value="915 MHz (US)">915 MHz United States</option>
                <option value="433 MHz (APAC)">433 MHz Asia-Pacific</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-dark)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>Simulate Network Downtime</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Disable dashboard sync to cache alerts in transit</div>
              </div>
              <input
                type="checkbox"
                checked={dashboardOfflineMode}
                onChange={(e) => setDashboardOfflineMode(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-rescue-blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================MODAL 2: E2EE DECRYPTION & AI SUMMARY VIEW =================================*/}
      {showDecryptionView && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowDecryptionView(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>SOS Dispatch & Security Metadata</h3>
              <button onClick={() => setShowDecryptionView(false)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: mapLayers.incidentCommander ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '20px' }}>
              {/* E2EE Data Card */}
              <div style={{ backgroundColor: 'var(--color-bg-dark)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-safety-green)' }}>
                  <Lock size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Encrypted P2P Envelope</span>
                </div>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '9px' }}>AES IV Hex</label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)' }}>{selectedAlert.iv}</div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '9px' }}>Encrypted Ciphertext</label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', wordBreak: 'break-all', height: '60px', overflowY: 'auto', backgroundColor: '#F2F2F7', padding: '6px', borderRadius: '6px', border: '1px solid #E5E5EA', color: '#1C1C1E' }}>
                    {selectedAlert.encryptedPayload}
                  </div>
                </div>

                <button
                  disabled={decryptingAnimation}
                  onClick={() => decryptAlertPayload(selectedAlert)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'var(--color-safety-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Unlock size={12} />
                  <span>{decryptingAnimation ? 'Decrypting AES-GCM Key...' : 'Decrypt Location Metrics'}</span>
                </button>
              </div>

              {/* AI Triage Details */}
              {mapLayers.incidentCommander && (
                <div style={{ backgroundColor: 'var(--color-bg-dark)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-emergency-red)' }}>
                    <Activity size={16} />
                    <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Gemini AI Triage Result</span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>PRIORITY SCORE</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-emergency-red)' }}>{selectedAlert.priorityScore}/100</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>TRIPPED BATTERY</div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{selectedAlert.batteryAtTrigger}%</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Confidence Rating</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: (selectedAlert.confidenceScore || 90) > 90 ? 'var(--color-safety-green)' : 'var(--color-warning-orange)' }}>
                        {displayedConfidence || selectedAlert.confidenceScore || 90}% (High)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Spam/Fake Risk</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: (selectedAlert.fakeRiskScore || 8) > 20 ? 'var(--color-emergency-red)' : 'var(--color-safety-green)' }}>
                        {selectedAlert.fakeRiskScore || 8}% (Low)
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '9px' }}>AI Safety Action Suggestion</label>
                    <div style={{ fontSize: '11px', color: 'var(--color-rescue-blue)', lineHeight: '1.4' }}>{selectedAlert.suggestedAction}</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '9px' }}>Required Resources</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {selectedAlert.requiredResources?.map((res, index) => (
                        <span key={index} style={{ fontSize: '9px', backgroundColor: 'rgba(245,158,11,0.12)', color: 'var(--color-warning-orange)', padding: '2px 6px', borderRadius: '10px' }}>
                          {res.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Victim details decrypted */}
            <div style={{ backgroundColor: 'var(--color-panel-dark)', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Decrypted Plaintext SOS Description</div>
              <p style={{ fontSize: '13px', lineHeight: '1.5', fontWeight: '500' }}>"{selectedAlert.decryptedMessage}"</p>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                <span>Coordinates: {selectedAlert.lat.toFixed(5)}, {selectedAlert.lng.toFixed(5)}</span>
                <span>Offline Plus Code: <b>{selectedAlert.plusCode}</b></span>
                <span>Hops: {selectedAlert.hopCount}</span>
              </div>
            </div>

            {/* Routing Transit Timeline */}
            {mapLayers.timeline && (
              <div style={{ backgroundColor: 'var(--color-panel-dark)', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Packet Transit & AI Verification Timeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedAlert.triageTimeline || [
                    `10:02 AM - SOS Packet Generated`,
                    `10:14 AM - Forwarded through 2 Relays`,
                    `10:25 AM - Uploaded via Gateway`,
                    `10:26 AM - AI Priority Classified: ${selectedAlert.severity}`
                  ]).map((stepText, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: idx === 3 ? 'var(--color-emergency-red)' : 'var(--color-safety-green)'
                      }} />
                       <span style={{ color: idx === 3 ? 'var(--color-emergency-red)' : 'var(--color-text-secondary)' }}>{stepText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              {!droneFlightActive && (
                <button
                  onClick={() => {
                    setDroneTargetCoords([selectedAlert.lat, selectedAlert.lng]);
                    setDroneFlightActive(true);
                    setDroneEta(151); // 2m 31s
                    setDroneCoords([30.5732, 79.0435]); // start at Phata Gateway
                    setShowDecryptionView(false);
                    // Automatically turn on UAV Routes layer if it's off, so they see the drone path!
                    setMapLayers(prev => ({ ...prev, uavRoutes: true }));
                    injectFeedbackLog(`🚀 UAV Drone-01 launched to ${selectedAlert.name} coordinates. ETA: 2m 31s.`, 'success');
                    injectOperationalLog(`UAV Drone dispatched to emergency location.`);
                    playSystemSound('confirm');
                  }}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'var(--color-warning-orange)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Navigation size={12} style={{ transform: 'rotate(45deg)' }} />
                  <span>Launch UAV Supply Drop</span>
                </button>
              )}
              
              <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                {selectedAlert.status !== 'assigned' ? (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'var(--color-rescue-blue)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '12px'
                    }}
                  >
                    Assign Volunteer Dispatch
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAlerts(prev => prev.map(a => a.alertId === selectedAlert.alertId ? { ...a, status: 'resolved' } : a));
                      setShowDecryptionView(false);
                      alert('SOS Emergency resolved and cleared.');
                    }}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'var(--color-safety-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '12px'
                    }}
                  >
                    Mark Case Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================MODAL 3: ASSIGN VOLUNTEERS =================================*/}
      {showAssignModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Dispatch ResQMesh Volunteer</h3>
              <button onClick={() => setShowAssignModal(false)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Assign volunteer team located closest to victim <b>{selectedAlert.name}</b>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {volunteers.map(v => (
                <div key={v.volunteerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)', padding: '12px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{v.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Skills: {v.skills.join(', ')}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-rescue-blue)', marginTop: '4px' }}>Phone: {v.phone}</div>
                  </div>

                  <button
                    onClick={() => handleAssignVolunteer(v.volunteerId, selectedAlert.alertId)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-safety-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    Assign & Track
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* CINEMATIC SOS TRANSMISSION HUD OVERLAY ("Wow Moment") */}
      {isRelaying && (
        <div className="modal-overlay" style={{ backgroundColor: 'rgba(7, 11, 20, 0.45)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
          <div style={{
            backgroundColor: 'var(--color-panel-dark)',
            border: '1.5px solid var(--color-emergency-red)',
            borderRadius: '16px',
            padding: '28px',
            width: '440px',
            boxShadow: '0 20px 60px rgba(214, 69, 69, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            animation: 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-emergency-red)', animation: 'pulse-ring 1.5s infinite' }}></span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-emergency-red)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                SOS P2P Mesh Routing Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: relayProgress >= 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                <span>
                  1. Broadcasting emergency payload...
                  {relayProgress >= 0 && relayProgress < 16 && <span className="terminal-cursor"></span>}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {relayProgress >= 16 ? (
                    <span style={{ color: 'var(--color-safety-green)' }}>✓ DONE</span>
                  ) : (
                    <span style={{ color: 'var(--color-emergency-red)' }} className="animate-pulse">BROADCASTING...</span>
                  )}
                </span>
              </div>
              
              {/* Step 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: relayProgress >= 16 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                <span>
                  2. Searching nearby mesh nodes...
                  {relayProgress >= 16 && relayProgress < 33 && <span className="terminal-cursor"></span>}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {relayProgress >= 33 ? (
                    <span style={{ color: 'var(--color-safety-green)' }}>✓ DONE</span>
                  ) : relayProgress >= 16 ? (
                    <span style={{ color: 'var(--color-warning-orange)' }} className="animate-pulse">SCANNING...</span>
                  ) : (
                    <span>WAITING...</span>
                  )}
                </span>
              </div>

              {/* Step 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: relayProgress >= 33 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                <span>
                  3. Relay path established...
                  {relayProgress >= 33 && relayProgress < 50 && <span className="terminal-cursor"></span>}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {relayProgress >= 50 ? (
                    <span style={{ color: 'var(--color-safety-green)' }}>✓ DONE</span>
                  ) : relayProgress >= 33 ? (
                    <span style={{ color: 'var(--color-rescue-blue)' }} className="animate-pulse">CONNECTING...</span>
                  ) : (
                    <span>WAITING...</span>
                  )}
                </span>
              </div>

              {/* Step 4 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: relayProgress >= 50 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                <span>
                  4. Gateway synchronization complete...
                  {relayProgress >= 50 && relayProgress < 66 && <span className="terminal-cursor"></span>}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {relayProgress >= 66 ? (
                    <span style={{ color: 'var(--color-safety-green)' }}>✓ DONE</span>
                  ) : relayProgress >= 50 ? (
                    <span style={{ color: 'var(--color-warning-orange)' }} className="animate-pulse">SYNCING...</span>
                  ) : (
                    <span>WAITING...</span>
                  )}
                </span>
              </div>

              {/* Step 5 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: relayProgress >= 66 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                <span>
                  5. AI triaging incident...
                  {relayProgress >= 66 && relayProgress < 83 && <span className="terminal-cursor"></span>}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {relayProgress >= 83 ? (
                    <span style={{ color: 'var(--color-safety-green)' }}>✓ CLASSIFIED</span>
                  ) : relayProgress >= 66 ? (
                    <span style={{ color: 'var(--color-ai-accent)' }} className="animate-pulse">TRIAGING...</span>
                  ) : (
                    <span>WAITING...</span>
                  )}
                </span>
              </div>

              {/* Step 6 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: relayProgress >= 83 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                <span>
                  6. Volunteer dispatched...
                  {relayProgress >= 83 && relayProgress < 100 && <span className="terminal-cursor"></span>}
                </span>
                <span style={{ fontWeight: '600' }}>
                  {relayProgress >= 100 ? (
                    <span style={{ color: 'var(--color-safety-green)' }}>✓ DISPATCHED</span>
                  ) : relayProgress >= 83 ? (
                    <span style={{ color: 'var(--color-emergency-red)' }} className="animate-pulse">ASSIGNING...</span>
                  ) : (
                    <span>WAITING...</span>
                  )}
                </span>
              </div>
            </div>

            <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${relayProgress}%`, height: '100%', backgroundColor: 'var(--color-emergency-red)', transition: 'width 0.4s ease' }}></div>
            </div>

            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '10px' }}>
              P2P Payload: user-self • Hop Count: 2 • Band: {loraFrequency}
            </div>
          </div>
        </div>
      )}

      {/* Inline SVG turbulence displacement filter for organic vector overlay styling */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="disaster-noise-filter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
