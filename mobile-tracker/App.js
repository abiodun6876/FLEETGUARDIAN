import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, StatusBar, Alert, ScrollView, Dimensions, Linking } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const LOCATION_TASK_NAME = 'logistics-location-task';

// Background task to track location during a ride
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('BG_TASK_ERROR:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    const vehicleId = await AsyncStorage.getItem('vehicle_id');
    const rideId = await AsyncStorage.getItem('active_ride_id');

    if (vehicleId) {
      try {
        // Log location
        await supabase.from('locations').insert({
          vehicle_id: vehicleId,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          speed: (location.coords.speed || 0) * 3.6,
          heading: location.coords.heading || 0
        });

        // Update vehicle's last seen
        await supabase.from('vehicles').update({
          last_seen: new Date().toISOString(),
          status: 'moving'
        }).eq('id', vehicleId);
      } catch (err) {
        console.error('BG_SYNC_ERROR:', err);
      }
    }
  }
});

export default function App() {
  const [appState, setAppState] = useState('LINKING'); // LINKING, INIT_RIDE, ACTIVE_RIDE
  const [vehicleId, setVehicleId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);

  // Ride Details
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [items, setItems] = useState('');
  const [price, setPrice] = useState('');
  const [activeRide, setActiveRide] = useState(null);

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [selectionMode, setSelectionMode] = useState('pickup'); // pickup, dropoff

  // Search/Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [searchingField, setSearchingField] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    checkCachedData();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      calculateEstimate();
    }
  }, [pickupCoords, dropoffCoords]);

  const calculateEstimate = async () => {
    try {
      const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${pickupCoords.longitude},${pickupCoords.latitude};${dropoffCoords.longitude},${dropoffCoords.latitude}?overview=full&geometries=geojson`);
      const json = await res.json();
      if (json.routes && json.routes[0]) {
        const route = json.routes[0];
        setEstimatedTime(Math.ceil(route.duration / 60));

        // Map GeoJSON [lng, lat] to {latitude, longitude}
        const coords = route.geometry.coordinates.map(c => ({
          latitude: c[1],
          longitude: c[0]
        }));
        setRouteCoords(coords);
      }
    } catch (err) {
      console.error('ESTIMATE_ERROR:', err);
    }
  };

  const startNavigation = () => {
    if (!dropoffCoords) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dropoffCoords.latitude},${dropoffCoords.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const checkCachedData = async () => {
    const cachedId = await AsyncStorage.getItem('vehicle_id');
    const cachedPlate = await AsyncStorage.getItem('license_plate');
    const cachedRide = await AsyncStorage.getItem('active_ride_id');

    if (cachedId && cachedPlate) {
      setVehicleId(cachedId);
      setPlateNumber(cachedPlate);
      if (cachedRide) {
        // Fetch ride details if exists
        const { data } = await supabase.from('rides').select('*').eq('id', cachedRide).single();
        if (data && data.status === 'ongoing') {
          setActiveRide(data);
          setPickupCoords({ latitude: data.pickup_lat, longitude: data.pickup_lng });
          setDropoffCoords({ latitude: data.dropoff_lat, longitude: data.dropoff_lng });
          setAppState('ACTIVE_RIDE');
          startLocationTracking();
          startForegroundWatching();
        } else {
          setAppState('INIT_RIDE');
        }
      } else {
        setAppState('INIT_RIDE');
      }
    }
  };

  const requestPermissions = async () => {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation(loc.coords);
      await Location.requestBackgroundPermissionsAsync();
    }
  };

  const linkVehicle = async () => {
    if (!plateNumber) return Alert.alert('Error', 'Enter plate number');
    const { data, error } = await supabase.from('vehicles').select('*').eq('license_plate', plateNumber.toUpperCase()).maybeSingle();

    if (error || !data) return Alert.alert('Error', 'Vehicle not found');

    await AsyncStorage.setItem('vehicle_id', data.id);
    await AsyncStorage.setItem('license_plate', plateNumber.toUpperCase());
    setVehicleId(data.id);
    setAppState('INIT_RIDE');
  };

  const [locationWatcher, setLocationWatcher] = useState(null);

  const handleMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    if (selectionMode === 'pickup') {
      setPickupCoords(coords);
      setSelectionMode('dropoff');
    } else {
      setDropoffCoords(coords);
    }
  };

  const fetchSuggestions = async (text, field) => {
    if (field === 'pickup') setPickup(text);
    else setDropoff(text);
    setSearchingField(field);

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
      const json = await res.json();
      const simplified = json.features.map(f => ({
        name: [f.properties.name, f.properties.street, f.properties.city].filter(Boolean).join(', '),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0]
      }));
      setSuggestions(simplified);
    } catch (err) {
      console.error('SEARCH_ERROR:', err);
    }
  };

  const onSelectSuggestion = (item) => {
    if (searchingField === 'pickup') {
      setPickup(item.name);
      setPickupCoords({ latitude: item.lat, longitude: item.lng });
    } else {
      setDropoff(item.name);
      setDropoffCoords({ latitude: item.lat, longitude: item.lng });
    }
    setSuggestions([]);
    setSearchingField(null);

    mapRef.current?.animateToRegion({
      latitude: item.lat,
      longitude: item.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }, 1000);
  };

  const startRide = async () => {
    if (!pickup || !dropoff || !items || !price) return Alert.alert('Error', 'Fill all fields');
    if (!pickupCoords || !dropoffCoords) return Alert.alert('Error', 'Please select pickup and dropoff on the map');

    const { data, error } = await supabase.from('rides').insert({
      vehicle_id: vehicleId,
      pickup_location: pickup,
      pickup_lat: pickupCoords.latitude,
      pickup_lng: pickupCoords.longitude,
      dropoff_location: dropoff,
      dropoff_lat: dropoffCoords.latitude,
      dropoff_lng: dropoffCoords.longitude,
      items: items,
      price: parseFloat(price),
      estimated_time: estimatedTime,
      status: 'ongoing',
      started_at: new Date().toISOString()
    }).select().single();

    if (error) return Alert.alert('Error', 'Failed to start ride');

    await AsyncStorage.setItem('active_ride_id', data.id);
    setActiveRide(data);
    setAppState('ACTIVE_RIDE');
    startLocationTracking();
    startForegroundWatching();
  };

  const startForegroundWatching = async () => {
    if (locationWatcher) return;
    const watcher = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (loc) => {
        setCurrentLocation(loc.coords);
      }
    );
    setLocationWatcher(watcher);
  };

  const stopForegroundWatching = () => {
    if (locationWatcher) {
      if (typeof locationWatcher.remove === 'function') {
        locationWatcher.remove();
      }
      setLocationWatcher(null);
    }
  };

  const completeRide = async () => {
    if (!activeRide) return;
    const { error } = await supabase.from('rides').update({
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', activeRide.id);

    if (error) return Alert.alert('Error', 'Failed to complete');

    await AsyncStorage.removeItem('active_ride_id');
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    stopForegroundWatching();
    setAppState('INIT_RIDE');
    setActiveRide(null);
    setEstimatedTime(null);
    setPickup(''); setDropoff(''); setItems(''); setPrice('');
    setPickupCoords(null); setDropoffCoords(null);
  };

  const startLocationTracking = async () => {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
      foregroundService: {
        notificationTitle: 'Ride in Progress',
        notificationBody: 'Tracking your delivery real-time',
        notificationColor: '#f59e0b'
      }
    });
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setAppState('LINKING');
    setVehicleId('');
    setPlateNumber('');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {appState === 'LINKING' && (
          <View style={styles.content}>
            <Text style={styles.title}>FLEETGUARDIAN</Text>
            <Text style={styles.subtitle}>Logistics Driver Terminal</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="VEHICLE PLATE NUMBER"
                placeholderTextColor="#64748b"
                value={plateNumber}
                onChangeText={setPlateNumber}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.primaryButton} onPress={linkVehicle}>
                <Text style={styles.buttonText}>LINK DEVICE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {appState === 'INIT_RIDE' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{plateNumber}</Text>
              <TouchableOpacity onPress={logout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>New Delivery</Text>
            <View style={styles.mapSelectionContainer}>
              <Text style={styles.mapLabel}>Select {selectionMode.toUpperCase()} on map</Text>
              <MapView
                ref={mapRef}
                style={styles.initMap}
                provider={PROVIDER_GOOGLE}
                showsTraffic={true}
                initialRegion={{
                  latitude: currentLocation?.latitude || 6.52,
                  longitude: currentLocation?.longitude || 3.37,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                onPress={handleMapPress}
              >
                {pickupCoords && <Marker coordinate={pickupCoords} title="Pickup" pinColor="green" />}
                {dropoffCoords && <Marker coordinate={dropoffCoords} title="Dropoff" pinColor="red" />}
                {routeCoords.length > 0 && (
                  <Polyline
                    coordinates={routeCoords}
                    strokeWidth={4}
                    strokeColor="#fbbf24"
                  />
                )}
              </MapView>
              <View style={styles.selectionControls}>
                <TouchableOpacity
                  style={[styles.modeButton, selectionMode === 'pickup' && styles.activeMode]}
                  onPress={() => setSelectionMode('pickup')}>
                  <Text style={[styles.modeText, selectionMode === 'pickup' && styles.activeModeText]}>SET PICKUP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, selectionMode === 'dropoff' && styles.activeMode]}
                  onPress={() => setSelectionMode('dropoff')}>
                  <Text style={[styles.modeText, selectionMode === 'dropoff' && styles.activeModeText]}>SET DROPOFF</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.formCard}>
              <View style={{ zIndex: 10 }}>
                <TextInput
                  style={styles.formInput}
                  placeholder="Pickup Name/Address"
                  placeholderTextColor="#94a3b8"
                  value={pickup}
                  onChangeText={(t) => fetchSuggestions(t, 'pickup')}
                />
                {searchingField === 'pickup' && suggestions.length > 0 && (
                  <View style={styles.suggestionBox}>
                    {suggestions.map((s, i) => (
                      <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => onSelectSuggestion(s)}>
                        <Text style={styles.suggestionText}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ zIndex: 5 }}>
                <TextInput
                  style={styles.formInput}
                  placeholder="Drop-off Name/Address"
                  placeholderTextColor="#94a3b8"
                  value={dropoff}
                  onChangeText={(t) => fetchSuggestions(t, 'dropoff')}
                />
                {searchingField === 'dropoff' && suggestions.length > 0 && (
                  <View style={styles.suggestionBox}>
                    {suggestions.map((s, i) => (
                      <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => onSelectSuggestion(s)}>
                        <Text style={styles.suggestionText}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TextInput style={styles.formInput} placeholder="Items (e.g. Bread, Furniture)" placeholderTextColor="#94a3b8" value={items} onChangeText={setItems} />
              <TextInput style={styles.formInput} placeholder="Price ($)" keyboardType="numeric" placeholderTextColor="#94a3b8" value={price} onChangeText={setPrice} />

              {estimatedTime && (
                <View style={styles.estimateBanner}>
                  <Text style={styles.estimateLabel}>ESTIMATED TRAVEL TIME</Text>
                  <Text style={styles.estimateValue}>{estimatedTime} MINUTES</Text>
                </View>
              )}

              <TouchableOpacity style={styles.startButton} onPress={startRide}>
                <Text style={styles.buttonText}>START RIDE</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {appState === 'ACTIVE_RIDE' && (
          <View style={styles.container}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              showsTraffic={true}
              initialRegion={{
                latitude: currentLocation?.latitude || pickupCoords?.latitude || 0,
                longitude: currentLocation?.longitude || pickupCoords?.longitude || 0,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation
            >
              {pickupCoords && <Marker coordinate={pickupCoords} title="Pickup Point" pinColor="green" />}
              {dropoffCoords && <Marker coordinate={dropoffCoords} title="Dropoff Point" pinColor="red" />}
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeWidth={5}
                  strokeColor="#fbbf24"
                />
              )}
            </MapView>

            <View style={styles.activeRideOverlay}>
              <View style={styles.rideDetailBox}>
                <Text style={styles.rideDetailLabel}>ONGOING DELIVERY</Text>
                <Text style={styles.rideDetailInfo}>{activeRide?.items}</Text>
                <Text style={styles.rideDetailSub}>To: {activeRide?.dropoff_location}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <Text style={styles.rideDetailPrice}>$ {activeRide?.price}</Text>
                  {activeRide?.estimated_time && (
                    <Text style={styles.rideDetailEstimate}>{activeRide.estimated_time} MIN EST.</Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.completeButton, { flex: 1, backgroundColor: '#3b82f6' }]} onPress={startNavigation}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>NAVIGATE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.completeButton, { flex: 1.5 }]} onPress={completeRide}>
                  <Text style={styles.buttonText}>COMPLETE DELIVERY</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  scrollContent: { padding: 24 },
  title: { color: '#fbbf24', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: '#1e293b', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  input: { backgroundColor: '#0f172a', color: '#ffffff', padding: 16, borderRadius: 8, fontSize: 18, marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  primaryButton: { backgroundColor: '#fbbf24', padding: 18, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { color: '#fbbf24', fontSize: 20, fontWeight: 'bold' },
  logoutText: { color: '#ef4444', fontSize: 14 },
  sectionTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  formCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16 },
  formInput: { backgroundColor: '#0f172a', color: '#ffffff', padding: 14, borderRadius: 8, marginBottom: 12, fontWeight: 'bold' },
  startButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  map: { flex: 1 },
  mapSelectionContainer: { height: 350, backgroundColor: '#1e293b', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  initMap: { flex: 1 },
  mapLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', padding: 10, backgroundColor: '#0f172a', textAlign: 'center', letterSpacing: 1 },
  selectionControls: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#334155' },
  modeButton: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#1e293b' },
  activeMode: { backgroundColor: '#fbbf24' },
  modeText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  activeModeText: { color: '#0f172a' },
  suggestionBox: { backgroundColor: '#0f172a', borderRadius: 8, marginTop: -8, marginBottom: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  suggestionText: { color: '#ffffff', fontSize: 12 },
  estimateBanner: { backgroundColor: '#fbbf2410', padding: 15, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fbbf2430', alignItems: 'center' },
  estimateLabel: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  estimateValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  activeRideOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  rideDetailBox: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#fbbf24' },
  rideDetailLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  rideDetailInfo: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  rideDetailSub: { color: '#94a3b8', fontSize: 14 },
  rideDetailPrice: { color: '#fbbf24', fontSize: 20, fontWeight: 'bold' },
  rideDetailEstimate: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  completeButton: { backgroundColor: '#fbbf24', padding: 18, borderRadius: 8, alignItems: 'center' },
});
