document.addEventListener('DOMContentLoaded', function () {
    // --- UTILIDADES GLOBALES ---
    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    // --- CONFIGURACIÓN INICIAL ---
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWZlbGlwZm8iLCJhIjoiY21lcnF1cXh2MDllMDJscHk2eHFxMmVsdSJ9.afb7XVzY_ZAQcu0JLS9xaA';

    const reportContent = document.getElementById('report-content');
    const searchInput = document.getElementById('comuna-search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const infoSidebar = document.getElementById('info-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const locateBtn = document.getElementById('locate-btn');
    const locationStatus = document.getElementById('location-status');
    
    let comunasData = null;
    let hoveredComunaId = null;
    let userMarker = null;
    let lastComunaId = localStorage.getItem('lastComunaId') || null;
    let isLocating = false;

    // --- INICIALIZACIÓN DEL MAPA ---
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-75.5636, 6.2518],
        zoom: 11.5,
        pitch: 60,
        bearing: -17.6,
        antialias: true
    });

    // --- CONTROLES DEL MAPA ---
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // --- CARGA DE DATOS Y RENDERIZADO DEL MAPA ---
    map.on('load', async () => {
        try {
            const response = await fetch('comunas.geojson');
            comunasData = await response.json();
            initializeMapLayers();
            setupInteractions();
            
            if (window.location.hash.startsWith('#comuna-')) {
                const id = window.location.hash.replace('#comuna-', '');
                const feature = comunasData.features.find(f => f.properties.IDENTIFICADOR === id);
                if (feature) showComunaInfo(feature.properties, true);
            } else if (lastComunaId) {
                const feature = comunasData.features.find(f => f.properties.IDENTIFICADOR === lastComunaId);
                if (feature) showComunaInfo(feature.properties, true);
            }
        } catch (error) {
            console.error("Error cargando los datos de las comunas:", error);
            alert("No se pudo cargar el archivo comunas.geojson. Asegúrate de que el archivo exista en la misma carpeta.");
        }
    });

    // El resto de las funciones base (initializeMapLayers, setupInteractions, etc.) se mantienen igual que en app.js

    // --- MEJORAS EN LA GEOLOCALIZACIÓN ---
    function showLocationStatus(message, isError = false) {
        locationStatus.innerHTML = `
            <div class="flex items-center gap-3">
                ${isError ? 
                    '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>' :
                    '<div class="animate-spin"><i class="fas fa-circle-notch text-blue-600 text-xl"></i></div>'
                }
                <span class="text-gray-700 font-medium">${message}</span>
            </div>
        `;
        locationStatus.style.transform = 'translateY(0)';
        locationStatus.style.opacity = '1';
    }

    function hideLocationStatus() {
        locationStatus.style.transform = 'translateY(2px)';
        locationStatus.style.opacity = '0';
    }

    async function handleLocate() {
        if (isLocating) return;
        isLocating = true;

        if (!navigator.geolocation) {
            showLocationStatus('Tu navegador no soporta geolocalización', true);
            setTimeout(hideLocationStatus, 3000);
            isLocating = false;
            return;
        }

        showLocationStatus('Buscando tu ubicación...');

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { longitude, latitude } = position.coords;
            const userPoint = [longitude, latitude];

            showLocationStatus('Analizando tu ubicación...');

            // Añadir o actualizar el marcador del usuario con animación
            if (userMarker) {
                await animateMarker(userMarker.getLngLat(), userPoint);
            } else {
                userMarker = new mapboxgl.Marker({
                    color: '#FF5733',
                    scale: 1.2,
                    draggable: false
                })
                .setLngLat(userPoint)
                .addTo(map);

                // Agregar animación de "bounce" al marcador
                const markerElement = userMarker.getElement();
                markerElement.style.animation = 'bounce 0.5s ease-in-out infinite';
            }

            // Encontrar la comuna que contiene la ubicación
            const foundComuna = comunasData.features.find(feature => 
                pointInPolygon(userPoint, feature.geometry.coordinates[0])
            );

            if (foundComuna) {
                showLocationStatus('¡Comuna encontrada!');
                setTimeout(() => {
                    hideLocationStatus();
                    showComunaInfo(foundComuna.properties);
                }, 1000);
            } else {
                showLocationStatus('Ubicación fuera de las comunas de Medellín', true);
                map.flyTo({ center: userPoint, zoom: 14 });
                setTimeout(hideLocationStatus, 3000);
            }

        } catch (error) {
            console.error('Error de geolocalización:', error);
            showLocationStatus('No se pudo obtener tu ubicación', true);
            setTimeout(hideLocationStatus, 3000);
        }

        isLocating = false;
    }

    async function animateMarker(start, end) {
        const steps = 30;
        const duration = 1000; // ms
        const stepDuration = duration / steps;

        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const currentLng = start.lng + (end[0] - start.lng) * progress;
            const currentLat = start.lat + (end[1] - start.lat) * progress;
            
            await new Promise(resolve => setTimeout(resolve, stepDuration));
            userMarker.setLngLat([currentLng, currentLat]);
        }
    }

    // --- El resto del código sigue igual que en app.js original ---
    // [Aquí va el código existente de setupInteractions(), handleSearch(), etc.]

});
