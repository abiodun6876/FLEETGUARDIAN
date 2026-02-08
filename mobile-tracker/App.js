import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, StatusBar, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';

export default function App() {
  const [vehicleId, setVehicleId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [status, setStatus] = useState('OFFLINE');
  const [battery, setBattery] = useState(100);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    checkCachedSession();
    requestPermissions();
    setupBatteryMonitoring();
  }, []);

  const setupBatteryMonitoring = async () => {
    const level = await Battery.getBatteryLevelAsync();
    setBattery(Math.floor(level * 100));

    Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const per = Math.floor(batteryLevel * 100);
      setBattery(per);
      AsyncStorage.setItem('last_battery_level', per.toString());
      if (per < 20 && isLinked) {
        sendAutoAlert('LOW_BATTERY', { level: per });
      }
    });
  };

  const sendAutoAlert = async (type, meta) => {
    const contextStr = await AsyncStorage.getItem('org_context');
    const context = JSON.parse(contextStr || '{}');
    await supabase.from('events').insert({
      vehicle_id: vehicleId,
      organization_id: context.organization_id || '87cc6b87-b93a-40ef-8ad0-0340f5ff8321',
      branch_id: context.branch_id || 'b5e731df-b8cb-4073-a865-df7602b51a9d',
      event_type: 'ALERT',
      meta: { ...meta, alert_type: type, timestamp: new Date().toISOString() }
    });
  };

  const checkCachedSession = async () => {
    const cachedId = await AsyncStorage.getItem('vehicle_id');
    const cachedPlate = await AsyncStorage.getItem('license_plate');
    if (cachedId && cachedPlate) {
      if (!isUUID(cachedId)) {
        await AsyncStorage.clear();
        return;
      }

      const contextStr = await AsyncStorage.getItem('org_context');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        if (!isUUID(context.organization_id)) {
          await AsyncStorage.clear();
          return;
        }
      }

      setVehicleId(cachedId);
      setPlateNumber(cachedPlate);
      setIsLinked(true);
      setStatus('TERMINAL_LINKED');
      startLocationTracking();
    }
  };

  const resetLink = async () => {
    Alert.alert('WARNING', 'Sever this terminal link?', [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'SEVER LINK', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          setVehicleId('');
          setPlateNumber('');
          setIsLinked(false);
          setStatus('OFFLINE');
        }
      }
    ]);
  };

  const isUUID = (str) => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  const requestPermissions = async () => {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: bgLocStatus } = await Location.requestBackgroundPermissionsAsync();

    if (locStatus !== 'granted') Alert.alert('Permission Denied', 'Location permission is required.');
  };

  const linkVehicle = async () => {
    if (!plateNumber) return Alert.alert('Error', 'Please enter a license plate.');
    setStatus('CONNECTING...');

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

      if (!isUUID(data.id)) {
        Alert.alert('DATABASE_ERROR', 'Remote ID is not a valid UUID. Contact Support.');
        setStatus('ERROR');
        return;
      }

      await AsyncStorage.setItem('vehicle_id', data.id);
      await AsyncStorage.setItem('license_plate', plateNumber.toUpperCase());
      await AsyncStorage.setItem('org_context', JSON.stringify({
        organization_id: isUUID(data.organization_id) ? data.organization_id : '87cc6b87-b93a-40ef-8ad0-0340f5ff8321',
        branch_id: isUUID(data.branch_id) ? data.branch_id : 'b5e731df-b8cb-4073-a865-df7602b51a9d'
      }));

      setVehicleId(data.id);
      setIsLinked(true);
      setStatus('TERMINAL_LINKED');
      startLocationTracking();
    } catch (err) {
      setStatus('LINK_FAILED');
    }
  };

  const startLocationTracking = async () => {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
        foregroundService: {
          notificationTitle: 'FleetGuardian Terminal',
          notificationBody: 'Uplink active...',
          notificationColor: '#10b981',
        },
      });
    } catch (e) {
      console.log('Location error', e);
    }
  };

  const handleSOS = async () => {
    if (!vehicleId) return;
    setStatus('SOS_SIGNALING');

    const loc = await Location.getCurrentPositionAsync({});
    const contextStr = await AsyncStorage.getItem('org_context');
    const context = JSON.parse(contextStr || '{}');

    if (!isUUID(vehicleId)) return;

    await supabase.from('events').insert({
      vehicle_id: vehicleId,
      organization_id: context.organization_id || '87cc6b87-b93a-40ef-8ad0-0340f5ff8321',
      branch_id: context.branch_id || 'b5e731df-b8cb-4073-a865-df7602b51a9d',
      event_type: 'SOS',
      meta: { lat: loc.coords.latitude, lng: loc.coords.longitude }
    });

    setTimeout(() => setStatus('TERMINAL_LINKED'), 3000);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>TERMINAL V.1</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.dot, { backgroundColor: isLinked ? '#10b981' : '#f43f5e' }]} />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        {!isLinked ? (
          <View style={styles.linkCard}>
            <Text style={styles.label}>ENTER TARGET IDENTIFIER</Text>
            <TextInput
              style={styles.input}
              placeholder="PLATE NUMBER"
              placeholderTextColor="#475569"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.button} onPress={linkVehicle}>
              <Text style={styles.buttonText}>INITIALIZE UPLINK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.main}>
            <View style={styles.terminalScreen}>
              <Text style={styles.terminalText}>{'>'} SYSTEM_READY</Text>
              <Text style={styles.terminalText}>{'>'} UPLINK_ESTABLISHED</Text>
              <Text style={styles.terminalText}>{'>'} ID: {plateNumber}</Text>
              <Text style={styles.terminalText}>{'>'} BATTERY: {battery}%</Text>
              <Text style={styles.terminalText}>{'>'} GPS_TRACKING: ACTIVE</Text>
              <Text style={styles.terminalText}>{'>'} ENCRYPTION: AES-256</Text>
              <Text style={styles.terminalText}>{'>'} WAIT_FOR_INSTRUCTION...</Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetLink}>
              <Text style={styles.resetButtonText}>TERMINATE UPLINK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sosButton, status === 'SOS_SIGNALING' && { backgroundColor: '#be123c' }]}
              onLongPress={handleSOS}
            >
              <Text style={styles.sosText}>EMERGENCY ALERT</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>SECURE CONNECTION // HEX_NODE_1</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
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

    if (vehicleId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleId)) {
      await supabase.from('locations').insert({
        vehicle_id: vehicleId,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        speed: (location.coords.speed || 0) * 3.6,
        heading: location.coords.heading || 0
      });

      const currentSpeed = (location.coords.speed || 0) * 3.6;
      if (currentSpeed > 100) {
        await supabase.from('events').insert({
          vehicle_id: vehicleId,
          organization_id: context.organization_id || '87cc6b87-b93a-40ef-8ad0-0340f5ff8321',
          branch_id: context.branch_id || 'b5e731df-b8cb-4073-a865-df7602b51a9d',
          event_type: 'ALERT',
          meta: { alert_type: 'SPEED_VIOLATION', speed: currentSpeed, timestamp: new Date().toISOString() }
        });
      }

      await supabase.from('vehicles').update({
        last_seen: new Date().toISOString(),
        status: (location.coords.speed || 0) > 2 ? 'moving' : 'active',
        // Critical for some RLS policies on update
        organization_id: context.organization_id || '87cc6b87-b93a-40ef-8ad0-0340f5ff8321',
        branch_id: context.branch_id || 'b5e731df-b8cb-4073-a865-df7602b51a9d',
      }).eq('id', vehicleId);
    }
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  brand: {
    color: '#00ff00',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  linkCard: {
    padding: 40,
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: '#00ff00',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#00ff00',
    padding: 20,
    color: '#00ff00',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#00ff00',
    padding: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  main: {
    flex: 1,
    padding: 24,
  },
  terminalScreen: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  terminalText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#333',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  resetButtonText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  sosButton: {
    backgroundColor: '#f43f5e',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  sosText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#555',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
