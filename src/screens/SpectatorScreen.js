import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../services/firebase';
import { COLORS, SPACING } from '../constants/theme';
import { WebView } from 'react-native-webview';

export default function SpectatorScreen({ route: navRoute }) {
  const { runId } = navRoute.params || { runId: 'test-run' };
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [stats, setStats] = useState({ distance: 0, time: 0 });
  const webviewRef = useRef(null);

  useEffect(() => {
    if (!runId) return;

    const locationRef = ref(database, `locations/${runId}`);
    const unsubscribeLocation = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const points = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setRoute(points);
        const lastPoint = points[points.length - 1];
        setLocation(lastPoint);
        
        // Actualizar mapa web
        if (webviewRef.current) {
          const script = `
            if (window.updateRunner) {
              window.updateRunner(${lastPoint.latitude}, ${lastPoint.longitude}, ${JSON.stringify(points)});
            }
          `;
          webviewRef.current.injectJavaScript(script);
        }
      }
    });

    const statsRef = ref(database, `runs/${runId}`);
    const unsubscribeStats = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setStats(data);
    });

    return () => {
      unsubscribeLocation();
      unsubscribeStats();
    };
  }, [runId]);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { height: 100%; margin: 0; background: #0F172A; }
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
      <WebView 
        ref={webviewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        scrollEnabled={false}
      />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, backgroundColor: '#0F172A' },
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
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statLabel: { color: COLORS.textSecondary, fontSize: 10 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
});
