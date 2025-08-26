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
    const legend = document.getElementById('legend-content');
    
    let comunasData = null;
    let hoveredComunaId = null;
    let userMarker = null;
    let lastComunaId = localStorage.getItem('lastComunaId') || null;

    // Paleta de colores para las comunas
    const comunaColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#D4A5A5', '#9B59B6', '#3498DB', '#F1C40F', '#2ECC71',
        '#E74C3C', '#1ABC9C', '#D35400', '#8E44AD', '#27AE60',
        '#C0392B'
    ];

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

            // Asignar colores a las comunas
            comunasData.features.forEach((feature, idx) => {
                const colorIdx = (parseInt(feature.properties.IDENTIFICADOR) - 1) % comunaColors.length;
                feature.properties.color = comunaColors[colorIdx];
            });

            initializeMapLayers();
            setupInteractions();
            initializeLegend();

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

    function initializeMapLayers() {
        if (!comunasData) return;

        map.addSource('comunas-source', {
            'type': 'geojson',
            'data': comunasData,
            'generateId': true
        });

        // Capa principal de comunas con colores únicos
        map.addLayer({
            'id': 'comunas-3d-fill',
            'type': 'fill-extrusion',
            'source': 'comunas-source',
            'paint': {
                'fill-extrusion-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    '#FFA500', // Color al hacer hover
                    ['get', 'color'] // Color asignado a cada comuna
                ],
                'fill-extrusion-height': 200,
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.9,
                    0.7
                ]
            }
        });

        // Bordes de las comunas
        map.addLayer({
            'id': 'comunas-borders',
            'type': 'line',
            'source': 'comunas-source',
            'layout': {},
            'paint': {
                'line-color': '#FFFFFF',
                'line-width': 2.5,
                'line-opacity': 0.8
            }
        });
    }

    function initializeLegend() {
        if (!comunasData) return;

        // Ordenar las comunas por ID
        const sortedComunas = [...comunasData.features].sort((a, b) => 
            parseInt(a.properties.IDENTIFICADOR) - parseInt(b.properties.IDENTIFICADOR)
        );

        // Crear elementos de la leyenda
        const legendHTML = sortedComunas.map(feature => `
            <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-sm" style="background-color: ${feature.properties.color}"></div>
                <span>${feature.properties.NOMBRE}</span>
            </div>
        `).join('');

        legend.innerHTML = legendHTML;
    }

    // --- El resto del código sigue igual que en app.js original ---
    // [Aquí va el código existente de setupInteractions(), handleSearch(), etc.]

});
