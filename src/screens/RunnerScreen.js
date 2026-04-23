import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Share } from 'react-native';
import * as Location from 'expo-location';
import { ref, set, push } from 'firebase/database';
import { database } from '../services/firebase';
import { COLORS, SPACING } from '../constants/theme';
import { Play, Pause, Share2 } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

export default function RunnerScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [runId, setRunId] = useState(null);
  
  const timerRef = useRef(null);
  const webviewRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requiere permiso de ubicación para rastrear tu carrera.');
        return;
      }
    })();
  }, []);

  // Inyectar ubicación en el mapa web
  useEffect(() => {
    if (location && webviewRef.current) {
      const script = `
        if (window.updateRunner) {
          window.updateRunner(${location.latitude}, ${location.longitude}, ${JSON.stringify(route)});
        }
      `;
      webviewRef.current.injectJavaScript(script);
    }
  }, [location]);

  const startRun = async () => {
    const newRunRef = push(ref(database, 'runs'));
    const id = newRunRef.key;
    setRunId(id);
    
    setIsTracking(true);
    setRoute([]);
    setDistance(0);

    await set(ref(database, `runs/${id}`), {
      status: 'active',
      startTime: Date.now(),
      distance: 0,
      pace: 0
    });

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
    const link = `https://gl2002.es/sr/index.html?runId=${runId}`;
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

  // HTML para el mapa de OpenStreetMap con Leaflet
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { height: 100%; margin: 0; background: #0F172A; }
        .leaflet-container { background: #0F172A; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {zoomControl: false}).setView([0,0], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var routeLine = L.polyline([], {color: '#CCFF00', weight: 5}).addTo(map);
        var marker = L.circleMarker([0,0], {radius: 7, color: '#CCFF00', fillColor: '#FFF', fillOpacity: 1}).addTo(map);

        window.updateRunner = function(lat, lng, route) {
          var pos = [lat, lng];
          marker.setLatLng(pos);
          routeLine.setLatLngs(route.map(p => [p.latitude, p.longitude]));
          map.panTo(pos);
          if (route.length === 1) map.setView(pos, 16);
        };
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView 
          ref={webviewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          scrollEnabled={false}
        />
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  map: {
    flex: 1,
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
  }
});
