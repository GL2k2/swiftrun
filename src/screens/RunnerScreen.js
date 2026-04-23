import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Share } from 'react-native';
import * as Location from 'expo-location';
import { ref, set, push, onValue } from 'firebase/database';
import { database } from '../services/firebase';
import { COLORS, SPACING } from '../constants/theme';
import { Play, Pause, Square, Share2, Map as MapIcon } from 'lucide-react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';

export default function RunnerScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [runId, setRunId] = useState(null);
  
  const timerRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requiere permiso de ubicación para rastrear tu carrera.');
        return;
      }
    })();
  }, []);

  const startRun = async () => {
    const newRunRef = push(ref(database, 'runs'));
    const id = newRunRef.key;
    setRunId(id);
    
    setIsTracking(true);
    setStartTime(Date.now());
    setRoute([]);
    setDistance(0);

    // Guardar inicio en Firebase
    await set(ref(database, `runs/${id}`), {
      status: 'active',
      startTime: Date.now(),
      distance: 0,
      pace: 0
    });

    // Iniciar rastreo
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
      },
      (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        const point = { latitude, longitude };
        
        setLocation(point);
        setRoute((prev) => [...prev, point]);

        // Sincronizar con Firebase
        push(ref(database, `locations/${id}`), {
          ...point,
          timestamp: Date.now()
        });
      }
    );

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRun = () => {
    setIsTracking(false);
    clearInterval(timerRef.current);
    if (runId) {
      set(ref(database, `runs/${runId}/status`), 'finished');
    }
  };

  const shareLink = async () => {
    if (!runId) return;
    const link = `https://swiftrun.app/track/${runId}`; // Placeholder link
    try {
      await Share.share({
        message: `Sigue mi carrera en vivo en SwiftRun: ${link}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={location ? { ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 } : null}
        customMapStyle={darkMapStyle}
      >
        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor={COLORS.primary} strokeWidth={4} />
        )}
        {location && (
          <Marker coordinate={location}>
            <View style={styles.marker} />
          </Marker>
        )}
      </MapView>

      <View style={styles.statsOverlay}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>TIEMPO</Text>
            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DISTANCIA</Text>
            <Text style={styles.statValue}>{distance.toFixed(2)} KM</Text>
          </View>
        </View>

        <View style={styles.controls}>
          {!isTracking ? (
            <TouchableOpacity style={styles.primaryButton} onPress={startRun}>
              <Play size={32} color={COLORS.background} fill={COLORS.background} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={stopRun}>
                <Pause size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={shareLink}>
                <Share2 size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  // ... more dark styles
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: SPACING.lg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  shareButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: 'white',
  }
});
