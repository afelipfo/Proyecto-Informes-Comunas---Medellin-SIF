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
    const locateBtn = document.getElementById('locate-btn'); // NUEVO: Referencia al botón
    
    let comunasData = null;
    let hoveredComunaId = null;
    let userMarker = null;
    let lastComunaId = localStorage.getItem('lastComunaId') || null;

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
            // Deep linking: abrir comuna por hash
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

        map.addLayer({
            'id': 'comunas-3d-fill',
            'type': 'fill-extrusion',
            'source': 'comunas-source',
            'paint': {
                'fill-extrusion-color': '#64B5F6',
                'fill-extrusion-height': 200,
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.8,
                    0.5
                ]
            }
        });

        map.addLayer({
            'id': 'comunas-borders',
            'type': 'line',
            'source': 'comunas-source',
            'layout': {},
            'paint': {
                'line-color': '#FFFFFF',
                'line-width': 2
            }
        });
    }

    // --- INTERACCIONES DEL MAPA Y UI ---
    function setupInteractions() {
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'comuna-popup'
        });

        map.on('mousemove', 'comunas-3d-fill', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            if (e.features.length > 0) {
                if (hoveredComunaId !== null) {
                    map.setFeatureState({ source: 'comunas-source', id: hoveredComunaId }, { hover: false });
                }
                hoveredComunaId = e.features[0].id;
                map.setFeatureState({ source: 'comunas-source', id: hoveredComunaId }, { hover: true });

                const properties = e.features[0].properties;
                popup.setLngLat(e.lngLat).setHTML(`<div class="comuna-popup-title">${properties.NOMBRE}</div>`).addTo(map);
            }
        });

        map.on('mouseleave', 'comunas-3d-fill', () => {
            map.getCanvas().style.cursor = '';
            if (hoveredComunaId !== null) {
                map.setFeatureState({ source: 'comunas-source', id: hoveredComunaId }, { hover: false });
            }
            hoveredComunaId = null;
            popup.remove();
        });
        
        map.on('click', 'comunas-3d-fill', (e) => {
            if (e.features.length > 0) {
                showComunaInfo(e.features[0].properties);
            }
        });

        searchInput.addEventListener('input', debounce(handleSearch, 120));
        searchInput.addEventListener('focus', handleSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = searchResultsContainer.querySelector('.result-item');
                if (first) first.click();
            }
        });
        document.addEventListener('click', (e) => {
            if (!searchResultsContainer.contains(e.target) && e.target !== searchInput) {
                searchResultsContainer.classList.add('hidden');
            }
        });

        closeSidebarBtn.addEventListener('click', () => {
            infoSidebar.classList.add('-translate-x-full');
        });
        
        // NUEVO: Event listener para el botón de geolocalización
        locateBtn.addEventListener('click', handleLocate);
    }
    
    function handleSearch(e) {
        const query = e.target.value.toLowerCase();
        if (!comunasData || query.length < 1) {
            searchResultsContainer.classList.add('hidden');
            return;
        }
        const filtered = comunasData.features.filter(feature =>
            feature.properties.NOMBRE.toLowerCase().includes(query) ||
            feature.properties.IDENTIFICADOR === query
        );
        searchResultsContainer.innerHTML = '';
        if (filtered.length > 0) {
            filtered.forEach(feature => {
                const item = document.createElement('div');
                item.className = 'result-item px-4 py-2 cursor-pointer hover:bg-blue-50 transition';
                item.innerHTML = `<span class="font-semibold">${feature.properties.NOMBRE}</span> <span class="text-gray-400 ml-2 text-sm">#${feature.properties.IDENTIFICADOR}</span>`;
                item.addEventListener('click', () => {
                    showComunaInfo(feature.properties);
                    searchInput.value = '';
                    searchResultsContainer.classList.add('hidden');
                });
                searchResultsContainer.appendChild(item);
            });
            searchResultsContainer.classList.remove('hidden');
        } else {
            searchResultsContainer.classList.add('hidden');
        }
    }
    
    // --- NUEVA LÓGICA DE GEOLOCALIZACIÓN ---
    function handleLocate() {
        if (!navigator.geolocation) {
            alert('La geolocalización no es soportada por tu navegador.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude } = position.coords;
                const userPoint = [longitude, latitude];

                // Añadir o mover el marcador del usuario
                if (userMarker) {
                    userMarker.setLngLat(userPoint);
                } else {
                    userMarker = new mapboxgl.Marker({ color: '#FF5733' })
                        .setLngLat(userPoint)
                        .addTo(map);
                }
                
                // Encontrar la comuna que contiene la ubicación del usuario
                const foundComuna = comunasData.features.find(feature => 
                    pointInPolygon(userPoint, feature.geometry.coordinates[0])
                );

                if (foundComuna) {
                    showComunaInfo(foundComuna.properties);
                } else {
                    alert('Tu ubicación actual está fuera de los límites de las comunas de Medellín.');
                    map.flyTo({ center: userPoint, zoom: 14 });
                }
            },
            (error) => {
                alert('No se pudo obtener tu ubicación. Asegúrate de haber concedido los permisos.');
                console.error("Error de Geolocalización:", error);
            }
        );
    }
    
    // Función para detectar si un punto está dentro de un polígono (algoritmo ray-casting)
    function pointInPolygon(point, polygon) {
        let x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i][0], yi = polygon[i][1];
            let xj = polygon[j][0], yj = polygon[j][1];

            let intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // --- FIN DE LA NUEVA LÓGICA ---

    function showComunaInfo(properties, skipHash) {
        const feature = comunasData.features.find(f => f.properties.IDENTIFICADOR === properties.IDENTIFICADOR);
        if (feature) {
            const coordinates = feature.geometry.coordinates[0];
            const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
            map.fitBounds(bounds, {
                padding: { top: 100, bottom: 100, left: infoSidebar.offsetWidth + 50, right: 50 },
                pitch: 65,
                duration: 1200
            });
        }
        // Guardar última comuna consultada
        localStorage.setItem('lastComunaId', properties.IDENTIFICADOR);
        if (!skipHash) {
            window.location.hash = `comuna-${properties.IDENTIFICADOR}`;
        }
        // Animación panel
        infoSidebar.classList.remove('opacity-0');
        infoSidebar.classList.remove('-translate-x-full');
        setTimeout(() => infoSidebar.classList.add('shadow-2xl'), 200);
        // Render panel
        reportContent.innerHTML = `
            <div class="p-4 animate-fadeIn">
                <h2 class="text-3xl font-extrabold text-gray-800 border-b-4 border-orange-500 pb-3 mb-6">${properties.NOMBRE}</h2>
                <div class="space-y-4 text-lg">
                    <p><strong class="text-gray-700">Identificador:</strong> ${properties.IDENTIFICADOR}</p>
                    <p class="text-gray-600 leading-relaxed">Haz clic en el botón de abajo para generar el reporte detallado de esta comuna.</p>
                </div>
                <button id="generate-pdf-btn" class="w-full mt-8 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-3 text-lg">
                    <i class="fas fa-file-pdf"></i> Generar Reporte PDF
                </button>
            </div>
        `;
        document.getElementById('generate-pdf-btn').addEventListener('click', () => {
            generatePDFFromHTMLFile(properties);
        });
    }

    async function generatePDFFromHTMLFile(comunaProperties) {
        const pdfButton = document.getElementById('generate-pdf-btn');
        const fileName = `data/comuna${comunaProperties.IDENTIFICADOR}.html`;
        const pdfFileName = `Reporte-${comunaProperties.NOMBRE.replace(/ /g, '_')}.pdf`;

        pdfButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando reporte...';
        pdfButton.disabled = true;

        let tempContainer;

        try {
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`HTML not found: ${fileName}`);
            const htmlContent = await response.text();

            tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '800px'; 
            tempContainer.innerHTML = htmlContent;
            document.body.appendChild(tempContainer);
            
            pdfButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            document.body.removeChild(tempContainer);
            tempContainer = null;

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            const imgHeightOnPDF = pdfWidth / ratio;
            let heightLeft = imgHeightOnPDF;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPDF);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPDF);
                heightLeft -= pdfHeight;
            }

            pdf.save(pdfFileName);

        } catch (error) {
            console.error('Error generando el PDF:', error);
            alert(`No se pudo generar el reporte. Asegúrate de que el archivo "${fileName}" exista.`);
        } finally {
            if (tempContainer && document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
            
            pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i> Generar Reporte PDF';
            pdfButton.disabled = false;
        }
    }
});