import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';
import { COLORS, SPACING } from '../constants/theme';
import MapView, { Polyline, Marker } from 'react-native-maps';

export default function SpectatorScreen({ route: navRoute }) {
  const { runId } = navRoute.params || { runId: 'test-run' };
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [stats, setStats] = useState({ distance: 0, time: 0 });

  useEffect(() => {
    if (!runId) return;

    // Escuchar ubicación en tiempo real
    const locationRef = ref(database, `locations/${runId}`);
    const unsubscribeLocation = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const points = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setRoute(points);
        setLocation(points[points.length - 1]);
      }
    });

    // Escuchar estadísticas
    const statsRef = ref(database, `runs/${runId}`);
    const unsubscribeStats = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats(data);
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeStats();
    };
  }, [runId]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
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
        <Text style={styles.title}>CORREDOR EN VIVO</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DISTANCIA</Text>
            <Text style={styles.statValue}>{stats.distance?.toFixed(2) || '0.00'} KM</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>RITMO</Text>
            <Text style={styles.statValue}>{stats.pace || '--:--'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const darkMapStyle = [ /* Reutilizar estilo oscuro */ ];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  statsOverlay: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: SPACING.md,
    borderRadius: 15,
  },
  title: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
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
