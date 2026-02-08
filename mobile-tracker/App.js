import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';

export default function App() {
  const [vehicleId, setVehicleId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [status, setStatus] = useState('OFFLINE');
  const [logs, setLogs] = useState([]);
  const [battery, setBattery] = useState(100);
  const [isLinked, setIsLinked] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const cameraRef = useRef(null);
  const streamInterval = useRef(null);

  useEffect(() => {
    checkCachedSession();
    requestPermissions();
  }, []);

  // Real-time Command Listener
  useEffect(() => {
    if (!vehicleId) return;

    addLog('SYSTEM: COMMAND_LISTENER_ACTIVE');
    const channel = supabase
      .channel(`commands:${vehicleId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `vehicle_id=eq.${vehicleId}`
      }, payload => {
        const type = payload.new.event_type;
        if (type === 'CAPTURE_REQUEST') {
          addLog('COMMAND: REMOTE_CAPTURE');
          takeSnapshot();
        } else if (type === 'START_LIVE_FEED') {
          addLog('COMMAND: START_STREAM');
          startTacticalStream();
        } else if (type === 'STOP_LIVE_FEED') {
          addLog('COMMAND: STOP_STREAM');
          stopTacticalStream();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopTacticalStream();
    };
  }, [vehicleId]);

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  const checkCachedSession = async () => {
    const cachedId = await AsyncStorage.getItem('vehicle_id');
    const cachedPlate = await AsyncStorage.getItem('license_plate');
    if (cachedId && cachedPlate) {
      setVehicleId(cachedId);
      setPlateNumber(cachedPlate);
      setIsLinked(true);
      setStatus('IDLE');
      startLocationTracking();
    }
  };

  const requestPermissions = async () => {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: bgLocStatus } = await Location.requestBackgroundPermissionsAsync();
    const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: micStatus } = await Camera.requestMicrophonePermissionsAsync();

    if (locStatus !== 'granted') addLog('ERROR: LOCATION_PERMISSION_DENIED');
    if (camStatus !== 'granted') addLog('ERROR: CAMERA_PERMISSION_DENIED');
  };

  const linkVehicle = async () => {
    if (!plateNumber) return Alert.alert('Error', 'Please enter a license plate.');
    setStatus('CONNECTING');

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('license_plate', plateNumber.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        Alert.alert('Error', 'Vehicle not found on dashboard.');
        setStatus('OFFLINE');
        return;
      }

      await AsyncStorage.setItem('vehicle_id', data.id);
      await AsyncStorage.setItem('license_plate', plateNumber.toUpperCase());
      await AsyncStorage.setItem('org_context', JSON.stringify({
        organization_id: data.organization_id,
        branch_id: data.branch_id
      }));

      setVehicleId(data.id);
      setIsLinked(true);
      setStatus('READY');
      addLog(`LINKED: ${plateNumber.toUpperCase()}`);
      startLocationTracking();
    } catch (err) {
      addLog(`LINK_FAILED: ${err.message}`);
    }
  };

  const startLocationTracking = async () => {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: 'FleetGuardian Tracker',
          notificationBody: 'Live tracking active...',
          notificationColor: '#10b981',
        },
      });
      addLog('SYSTEM: GPS_TRACKING_ON');
    } catch (e) {
      addLog('ERROR: BG_LOCATION_FAILED');
    }
  };

  const takeSnapshot = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          base64: true,
          scale: 0.5
        });

        const fileName = `${vehicleId}/${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from('media')
          .upload(fileName, photo, { contentType: 'image/jpeg' });

        if (!error) addLog('EVENT: SNAPSHOT_UPLOADED');
      } catch (e) {
        addLog('ERROR: CAPTURE_FAILED');
      }
    }
  };

  const startTacticalStream = () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setStatus('STREAMING');

    streamInterval.current = setInterval(async () => {
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.1, // Ultra low quality for speed
            base64: true,
            scale: 0.3 // Small resolution
          });

          await supabase.channel('tactical-stream').send({
            type: 'broadcast',
            event: 'frame',
            payload: {
              vId: vehicleId,
              image: `data:image/jpeg;base64,${photo.base64}`
            },
          });
        } catch (e) {
          console.log('Stream frame failed');
        }
      }
    }, 800); // ~1.2 frames per second (Supabase safe rate)
  };

  const stopTacticalStream = () => {
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
    setIsStreaming(false);
    setStatus('READY');
    addLog('SYSTEM: STREAM_STOPPED');
  };

  const handleSOS = async () => {
    if (!vehicleId) return;
    setStatus('SOS_SIGNALING');
    addLog('EVENT: SOS_EMISSION');

    const loc = await Location.getCurrentPositionAsync({});
    const contextStr = await AsyncStorage.getItem('org_context');
    const context = JSON.parse(contextStr || '{}');

    await supabase.from('events').insert({
      vehicle_id: vehicleId,
      organization_id: context.organization_id,
      branch_id: context.branch_id,
      event_type: 'SOS',
      meta: { lat: loc.coords.latitude, lng: loc.coords.longitude }
    });

    setTimeout(() => setStatus(isStreaming ? 'STREAMING' : 'READY'), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header HUD */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>FLEETGUARDIAN</Text>
          <Text style={styles.model}>TACTICAL UNIT v2.0</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.dot, { backgroundColor: isLinked ? (isStreaming ? '#f59e0b' : '#10b981') : '#f43f5e' }]} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      {!isLinked ? (
        <View style={styles.linkCard}>
          <Text style={styles.label}>INITIALIZE TARGET LINK</Text>
          <TextInput
            style={styles.input}
            placeholder="PLATE NUMBER"
            placeholderTextColor="#475569"
            value={plateNumber}
            onChangeText={setPlateNumber}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.button} onPress={linkVehicle}>
            <Text style={styles.buttonText}>ESTABLISH LINK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.main}>
          {isStreaming && (
            <View style={styles.streamBanner}>
              <Text style={styles.streamBannerText}>LIVE TACTICAL STREAM ACTIVE</Text>
            </View>
          )}

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BATTERY</Text>
              <Text style={styles.statValue}>{battery}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>NETWORK</Text>
              <Text style={styles.statValue}>ENCRYPTED</Text>
            </View>
          </View>

          {/* Log Monitor */}
          <Text style={styles.sectionTitle}>SYSTEM TELEMETRY</Text>
          <View style={styles.logContainer}>
            {logs.map((log, i) => (
              <Text key={i} style={styles.logText}>{log}</Text>
            ))}
          </View>

          {/* SOS Control */}
          <TouchableOpacity
            style={[styles.sosButton, status === 'SOS_SIGNALING' && { backgroundColor: '#be123c' }]}
            onLongPress={handleSOS}
          >
            <Text style={styles.sosText}>HOLD FOR SOS</Text>
          </TouchableOpacity>

          {/* Hidden Camera Component for Snapshots/Streaming */}
          <Camera.CameraView
            ref={cameraRef}
            style={{ width: 1, height: 1, opacity: 0.1 }}
            facing="back"
          />
        </ScrollView>
      )}

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>SECURE ENCRYPTION ACTIVE</Text>
      </View>
    </SafeAreaView>
  );
}

// Background Task Definition
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const location = locations[0];
    const vehicleId = await AsyncStorage.getItem('vehicle_id');
    const contextStr = await AsyncStorage.getItem('org_context');
    const context = JSON.parse(contextStr || '{}');

    if (vehicleId) {
      await supabase.from('locations').insert({
        vehicle_id: vehicleId,
        organization_id: context.organization_id,
        branch_id: context.branch_id,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        speed: (location.coords.speed || 0) * 3.6,
        heading: location.coords.heading || 0
      });

      await supabase.from('vehicles').update({
        last_seen: new Date().toISOString(),
        status: (location.coords.speed || 0) > 2 ? 'moving' : 'active'
      }).eq('id', vehicleId);
    }
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brand: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  model: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
  },
  linkCard: {
    padding: 40,
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 3,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    color: '#3b82f6',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  main: {
    flex: 1,
    padding: 24,
  },
  streamBanner: {
    backgroundColor: '#f59e0b20',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b40',
    marginBottom: 24,
    alignItems: 'center',
  },
  streamBannerText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  logContainer: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 24,
    height: 200,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 32,
  },
  logText: {
    color: '#10b981',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 8,
  },
  sosButton: {
    backgroundColor: '#f43f5e',
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  sosText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerText: {
    color: '#334155',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});
