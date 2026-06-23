import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BLEPeripheral from 'react-native-ble-peripheral';
import * as Device from 'expo-device';

const SERVICE_UUID = '46f16e3d-dca3-4325-aea8-43a181e56531';
const CHARACTERISTIC_UUID = '46f16e3d-dca3-4325-aea8-43a181e56532';

const BleManagerModule = NativeModules?.BleManager;
const bleManagerEmitter = BleManagerModule
  ? new NativeEventEmitter(BleManagerModule)
  : { addListener: () => ({ remove: () => {} }) };

class BLEMeshService {
  constructor() {
    this.alerts = [];
    this.onAlertsUpdated = null;
    this.onLog = null;
    
    this.isScanning = false;
    this.isAdvertising = false;
    this.isSyncing = false;
    
    // Rate limit synchronization with same peers: Map of peerId -> lastSyncTime
    this.syncedPeers = new Map();
    this.syncCooldownMs = 30000; // 30 seconds cooldown between syncs with the same peer
    
    // Track all discovered peers: Map of peerId -> lastDiscoveryTime
    this.discoveredPeers = new Map();
    
    this.discoverListener = null;
    this.stopScanListener = null;
    this.scanInterval = null;
  }

  log(message) {
    console.log(`[BLEMesh] ${message}`);
    if (this.onLog) {
      this.onLog(message);
    }
  }

  // Request permissions for BLE on Android
  async requestPermissions() {
    if (Platform.OS === 'ios') {
      this.log('iOS BLE permissions are handled by plist and OS prompts.');
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;
        this.log(`Android API Level: ${apiLevel}`);

        if (apiLevel >= 31) {
          // Android 12+ requires scan, connect, and advertise permissions
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          const allGranted =
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

          this.log(`Android 12+ permissions status: ${allGranted ? 'GRANTED' : 'DENIED'}`);
          return allGranted;
        } else {
          // Android 11 and below require location permission for BLE scanning
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          this.log(`Android 11- Location permission status: ${isGranted ? 'GRANTED' : 'DENIED'}`);
          return isGranted;
        }
      } catch (err) {
        this.log(`Permissions request failed: ${err.message}`);
        return false;
      }
    }

    return false;
  }

  // Convert string to bytes array
  stringToBytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
  }

  // Convert bytes array to string
  bytesToString(bytes) {
    if (!bytes) return '';
    return bytes.map((b) => String.fromCharCode(b)).join('');
  }

  // Serialize active alerts to a highly compressed format to stay within BLE limits (512 bytes max)
  serializeAlerts(alertsList) {
    // Take active alerts, sort by timestamp descending, keep top 3 (to stay safe under MTU limit)
    const activeAlerts = alertsList
      .filter((a) => a.status === 'active')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);

    const compact = activeAlerts.map((a) => ({
      i: a.id,
      s: (a.sender || '').slice(0, 15),
      t: a.type || 'general',
      m: (a.message || '').slice(0, 60), // Truncate long messages to prevent payload overflow
      la: a.latitude || 0,
      lo: a.longitude || 0,
      ts: a.timestamp || Date.now(),
      st: a.status || 'active',
      h: a.hops || 0,
    }));

    const jsonStr = JSON.stringify(compact);
    this.log(`Serialized payload size: ${jsonStr.length} bytes`);
    return jsonStr;
  }

  // Decompact remote serialized list to standard alert structure
  deserializeAlerts(compactList) {
    try {
      const parsed = JSON.parse(compactList);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((c) => ({
        id: c.i,
        sender: c.s,
        type: c.t,
        message: c.m,
        latitude: c.la,
        longitude: c.lo,
        timestamp: c.ts,
        status: c.st,
        hops: (c.h || 0) + 1, // Increment hops count as it passes through this node
      }));
    } catch (e) {
      this.log(`Failed to parse remote alerts: ${e.message}`);
      return [];
    }
  }

  // Initialize and start advertising BLE Peripheral role
  async startPeripheral() {
    try {
      this.log('Configuring BLE Peripheral role...');
      
      // Determine device name
      const nodeName = `ResQNode_${(Device.deviceName || Device.modelName || 'Device').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;
      this.log(`Advertising as: ${nodeName}`);
      BLEPeripheral.setName(nodeName);

      // Add service
      BLEPeripheral.addService(SERVICE_UUID, true);

      // Add characteristic
      // Permissions: 1 (Readable) | 16 (Writable)
      // Properties: 2 (Read) | 8 (Write) | 16 (Notify) -> 26
      const permissions = 1 | 16;
      const properties = 2 | 8 | 16;

      if (Platform.OS === 'android') {
        BLEPeripheral.addCharacteristicToService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          permissions,
          properties
        );
      } else {
        // iOS requires the fifth parameter 'data'
        BLEPeripheral.addCharacteristicToService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          permissions,
          properties,
          ''
        );
      }

      // Start advertising
      await BLEPeripheral.start();
      this.isAdvertising = true;
      this.log('BLE Advertising started successfully.');

      // Set initial characteristic payload
      await this.updatePeripheralPayload();
    } catch (err) {
      this.log(`Error starting BLE Peripheral: ${err.message}`);
    }
  }

  // Update advertising/GATT database with latest alerts payload
  async updatePeripheralPayload() {
    if (!this.isAdvertising) return;

    try {
      const payloadStr = this.serializeAlerts(this.alerts);
      const payloadBytes = this.stringToBytes(payloadStr);

      // In react-native-ble-peripheral, sendNotificationToDevices also updates the local characteristic value
      await BLEPeripheral.sendNotificationToDevices(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        payloadBytes
      );
      this.log('BLE characteristic payload updated.');
    } catch (err) {
      this.log(`Failed to update characteristic payload: ${err.message}`);
    }
  }

  // Starts the continuous central scanning loop
  startScanning() {
    this.log('Initializing BLE Central scanner...');
    
    // Set up discovered listener
    this.discoverListener = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      (peripheral) => this.handleDiscoveredPeripheral(peripheral)
    );

    this.stopScanListener = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        this.isScanning = false;
        this.log('Scan cycle finished.');
      }
    );

    // Run continuous scanning cycles (e.g. scan for 8s, pause 4s, repeat)
    const scanCycle = () => {
      if (this.isSyncing) {
        this.log('Currently syncing with a peer, delaying scan cycle...');
        return;
      }

      this.isScanning = true;
      this.log('Starting scan cycle...');
      BleManager.scan([], 8, true)
        .then(() => {
          this.log('Scanner active.');
        })
        .catch((err) => {
          this.log(`Scan start failed: ${err.message}`);
          this.isScanning = false;
        });
    };

    scanCycle();
    this.scanInterval = setInterval(scanCycle, 12000);
  }

  // Peer discovery handler
  async handleDiscoveredPeripheral(peripheral) {
    // Track discovery timestamp
    this.discoveredPeers.set(peripheral.id, Date.now());

    // Safety check: Filter devices advertising our service UUID or matching name
    const serviceUUIDs = peripheral.advertising?.serviceUUIDs || [];
    const lowerService = SERVICE_UUID.toLowerCase();
    const matchesService = serviceUUIDs.some(
      (uuid) => uuid.toLowerCase() === lowerService
    );
    const matchesName = peripheral.name && peripheral.name.startsWith('ResQNode_');
    const isResQNode = matchesService || matchesName;

    if (!isResQNode) return;

    const peerId = peripheral.id;
    const peerName = peripheral.name || 'Unknown ResQMesh Node';

    // Rate limiting check: Avoid re-connecting to a peer too quickly
    const lastSync = this.syncedPeers.get(peerId);
    if (lastSync && Date.now() - lastSync < this.syncCooldownMs) {
      return;
    }

    if (this.isSyncing) {
      return; // Only sync with one device at a time to prevent conflicts
    }

    this.isSyncing = true;
    this.log(`Discovered target peer: ${peerName} (${peerId})`);
    
    try {
      this.log(`Connecting to peer ${peerId}...`);
      await BleManager.connect(peerId);
      this.log(`Connected to peer ${peerId}. Discovering GATT services...`);
      
      await BleManager.retrieveServices(peerId);
      
      if (Platform.OS === 'android') {
        this.log(`Requesting MTU size of 512 for Android peer...`);
        try {
          const mtu = await BleManager.requestMTU(peerId, 512);
          this.log(`MTU negotiated to: ${mtu} bytes`);
        } catch (mtuErr) {
          this.log(`MTU negotiation failed: ${mtuErr.message}. Falling back to default.`);
        }
      }
      
      this.log(`GATT services retrieved. Reading alerts characteristic...`);
      
      const bytes = await BleManager.read(
        peerId,
        SERVICE_UUID.toLowerCase(),
        CHARACTERISTIC_UUID.toLowerCase()
      );
      
      const rawPayload = this.bytesToString(bytes);
      this.log(`Read payload successfully (${rawPayload.length} bytes).`);

      const remoteAlerts = this.deserializeAlerts(rawPayload);
      this.log(`Parsed ${remoteAlerts.length} remote alerts.`);

      // Sync and merge
      this.syncAndMerge(remoteAlerts, peerName);

      // Record successful sync timestamp
      this.syncedPeers.set(peerId, Date.now());
    } catch (err) {
      this.log(`Sync session with ${peerId} failed: ${err.message}`);
    } finally {
      try {
        await BleManager.disconnect(peerId);
        this.log(`Disconnected from peer ${peerId}.`);
      } catch (disError) {
        // Ignore disconnection failures
      }
      this.isSyncing = false;
    }
  }

  // Merge remote alerts list into local database
  syncAndMerge(remoteAlerts, peerName) {
    let updated = false;
    const merged = [...this.alerts];

    remoteAlerts.forEach((remote) => {
      const localIdx = merged.findIndex((l) => l.id === remote.id);
      
      if (localIdx === -1) {
        // Completely new alert propagated from another node!
        merged.push(remote);
        updated = true;
        this.log(`PROPAGATED: Received new offline alert from ${peerName}: "${remote.message}" (Hops: ${remote.hops})`);
      } else {
        const local = merged[localIdx];
        
        // If remote has newer information or status update
        if (remote.timestamp > local.timestamp || remote.status !== local.status) {
          merged[localIdx] = remote;
          updated = true;
          this.log(`PROPAGATED: Updated status for alert ${remote.id} via ${peerName}`);
        } else if (remote.hops < local.hops) {
          // If remote represents a shorter routing path for this alert
          merged[localIdx].hops = remote.hops;
          updated = true;
          this.log(`PROPAGATED: Discovered shorter route for alert ${remote.id} via ${peerName}`);
        }
      }
    });

    if (updated) {
      this.alerts = merged;
      if (this.onAlertsUpdated) {
        this.onAlertsUpdated(merged);
      }
      // Instantly update our peripheral GATT database to reflect newly merged alerts
      this.updatePeripheralPayload();
    }
  }

  // Starts the entire BLE Mesh network
  async startMesh(initialAlerts, onAlertsUpdated, onLog) {
    this.alerts = initialAlerts || [];
    this.onAlertsUpdated = onAlertsUpdated;
    this.onLog = onLog;

    this.log('Initializing ResQMesh BLE engine...');

    if (Platform.OS === 'web' || !BleManagerModule || !BLEPeripheral) {
      this.log('BLE is not supported on this platform/environment.');
      return;
    }

    try {
      await BleManager.start({ showAlert: false });
      
      // Start advertising as a peripheral node
      await this.startPeripheral();

      // Start scanning for neighboring peripheral nodes
      this.startScanning();

      this.log('ResQMesh offline engine started successfully.');
    } catch (err) {
      this.log(`Failed to start ResQMesh engine: ${err.message}`);
    }
  }

  // Update local alert cache directly (e.g. when initiating SOS or receiving firebase snapshot updates)
  updateLocalAlerts(newAlertsList) {
    this.alerts = newAlertsList;
    this.updatePeripheralPayload();
  }

  // Stop the entire BLE Mesh engine
  async stopMesh() {
    this.log('Stopping ResQMesh BLE engine...');
    
    // Clear scanning interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    // Unsubscribe listeners
    if (this.discoverListener) {
      this.discoverListener.remove();
      this.discoverListener = null;
    }
    if (this.stopScanListener) {
      this.stopScanListener.remove();
      this.stopScanListener = null;
    }

    // Stop advertiser
    if (this.isAdvertising) {
      try {
        await BLEPeripheral.stop();
        this.isAdvertising = false;
        this.log('BLE Advertising stopped.');
      } catch (err) {
        this.log(`Failed to stop BLE peripheral: ${err.message}`);
      }
    }

    this.isScanning = false;
    this.isSyncing = false;
    this.syncedPeers.clear();
    this.discoveredPeers.clear();
    this.log('ResQMesh offline engine completely stopped.');
  }

  // Get active nearby nodes count discovered in the last 45s
  getNearbyNodesCount() {
    const now = Date.now();
    let count = 0;
    for (const [_, timestamp] of this.discoveredPeers.entries()) {
      if (now - timestamp < 45000) {
        count++;
      }
    }
    return count;
  }
}

export default new BLEMeshService();
