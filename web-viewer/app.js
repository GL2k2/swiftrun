import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Credenciales (Placeholder - deben ser actualizadas por el usuario)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Obtener ID de la carrera de la URL (?runId=xxxx)
const urlParams = new URLSearchParams(window.location.search);
const runId = urlParams.get('runId') || 'test-run';

// Inicializar Mapa (CartoDB Dark Matter)
const map = L.map('map', { zoomControl: false }).setView([0, 0], 15);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

let routeLine = L.polyline([], {color: '#CCFF00', weight: 5, opacity: 0.8}).addTo(map);
let marker = L.circleMarker([0, 0], {
    radius: 8, 
    color: '#CCFF00', 
    fillColor: '#FFFFFF', 
    fillOpacity: 1,
    weight: 3
}).addTo(map);

// Escuchar ubicación en tiempo real
const locationRef = ref(db, `locations/${runId}`);
onValue(locationRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const points = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        const latLngs = points.map(p => [p.latitude, p.longitude]);
        
        routeLine.setLatLngs(latLngs);
        const lastPoint = latLngs[latLngs.length - 1];
        marker.setLatLng(lastPoint);
        
        // Auto-zoom suave al primer punto, luego solo mover
        if (routeLine.getLatLngs().length === 1) {
            map.setView(lastPoint, 16);
        } else {
            map.panTo(lastPoint);
        }
    }
});

// Escuchar estadísticas de la carrera
const statsRef = ref(db, `runs/${runId}`);
onValue(statsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        document.getElementById('distance').innerText = `${data.distance?.toFixed(2) || '0.00'} km`;
        document.getElementById('pace').innerText = data.pace || '--:--';
        
        // Calcular tiempo transcurrido si está activa
        if (data.startTime) {
            updateTimer(data.startTime);
        }
    }
});

function updateTimer(startTime) {
    setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        document.getElementById('time').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}
