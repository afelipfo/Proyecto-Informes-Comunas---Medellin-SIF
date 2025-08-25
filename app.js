document.addEventListener('DOMContentLoaded', function () {
    // --- CONFIGURACIÓN INICIAL ---
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWZlbGlwZm8iLCJhIjoiY21lcnF1cXh2MDllMDJscHk2eHFxMmVsdSJ9.afb7XVzY_ZAQcu0JLS9xaA'; // <-- RECUERDA PONER TU CLAVE AQUÍ

    const reportContent = document.getElementById('report-content');
    const searchInput = document.getElementById('comuna-search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const infoSidebar = document.getElementById('info-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    
    let comunasData = null;
    let hoveredComunaId = null;

    // --- INICIALIZACIÓN DEL MAPA ---
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-75.5636, 6.2518],
        zoom: 11.5,
        pitch: 60,
        bearing: -17.6,
        antialias: true,
        preserveDrawingBuffer: true // **NUEVO**: Necesario para poder tomar capturas del mapa
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

        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('focus', handleSearch);
        document.addEventListener('click', (e) => {
            if (!searchResultsContainer.contains(e.target) && e.target !== searchInput) {
                searchResultsContainer.classList.add('hidden');
            }
        });

        closeSidebarBtn.addEventListener('click', () => {
            infoSidebar.classList.add('-translate-x-full');
        });
    }
    
    function handleSearch(e) {
        const query = e.target.value.toLowerCase();
        if (query.length < 1) {
            searchResultsContainer.classList.add('hidden');
            return;
        }

        const filtered = comunasData.features.filter(feature => 
            feature.properties.NOMBRE.toLowerCase().includes(query)
        );

        searchResultsContainer.innerHTML = '';
        if (filtered.length > 0) {
            filtered.forEach(feature => {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.textContent = feature.properties.NOMBRE;
                item.addEventListener('click', () => {
                    showComunaInfo(feature.properties);
                    searchInput.value = feature.properties.NOMBRE;
                    searchResultsContainer.classList.add('hidden');
                });
                searchResultsContainer.appendChild(item);
            });
            searchResultsContainer.classList.remove('hidden');
        } else {
            searchResultsContainer.classList.add('hidden');
        }
    }

    function showComunaInfo(properties) {
        const feature = comunasData.features.find(f => f.properties.IDENTIFICADOR === properties.IDENTIFICADOR);
        if (feature) {
             const coordinates = feature.geometry.coordinates[0];
             const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

            map.fitBounds(bounds, {
                padding: { top: 50, bottom:50, left: 500, right: 50 },
                pitch: 65,
                duration: 2000
            });
        }
        
        // **NUEVO**: Contenido del panel con el botón para generar PDF
        reportContent.innerHTML = `
            <div id="printable-area">
                <h2 class="text-3xl font-extrabold text-blue-900 border-b-4 border-orange-500 pb-3 mb-6">${properties.NOMBRE}</h2>
                <div class="space-y-4 text-lg">
                    <p><strong class="text-gray-800">Identificador:</strong> ${properties.IDENTIFICADOR}</p>
                    <p class="text-gray-600 leading-relaxed">Aquí se mostraría la información detallada, estadísticas, proyectos y reportes específicos para esta comuna, cargados dinámicamente.</p>
                </div>
            </div>
            <button id="generate-pdf-btn" class="w-full mt-8 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-3">
                <i class="fas fa-file-pdf"></i> Generar Reporte PDF
            </button>
        `;
        
        document.getElementById('generate-pdf-btn').addEventListener('click', () => {
            generatePDF(properties.NOMBRE);
        });

        infoSidebar.classList.remove('-translate-x-full');
    }

    // **NUEVA FUNCIÓN**: Para generar el PDF
    async function generatePDF(comunaName) {
        const { jsPDF } = window.jspdf;
        const reportArea = document.getElementById('printable-area');
        const mapCanvas = map.getCanvas();
        const pdfButton = document.getElementById('generate-pdf-btn');

        // Ocultar el botón para que no salga en la captura
        pdfButton.style.display = 'none';
        
        // Mostrar un mensaje de carga
        pdfButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        pdfButton.disabled = true;

        // Capturar el contenido del panel y del mapa
        const reportCanvas = await html2canvas(reportArea);
        const mapImage = mapCanvas.toDataURL();

        const reportImgData = reportCanvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Añadir Título
        pdf.setFontSize(22);
        pdf.text(`Reporte - ${comunaName}`, pdfWidth / 2, 20, { align: 'center' });

        // Añadir información del panel
        const reportImgProps = pdf.getImageProperties(reportImgData);
        const reportAspectRatio = reportImgProps.height / reportImgProps.width;
        const reportPdfWidth = pdfWidth - 20;
        const reportPdfHeight = reportPdfWidth * reportAspectRatio;
        pdf.addImage(reportImgData, 'PNG', 10, 30, reportPdfWidth, reportPdfHeight);

        // Añadir captura del mapa
        const mapImgProps = pdf.getImageProperties(mapImage);
        const mapAspectRatio = mapImgProps.height / mapImgProps.width;
        const mapPdfWidth = pdfWidth - 20;
        const mapPdfHeight = mapPdfWidth * mapAspectRatio;
        const mapYPosition = 35 + reportPdfHeight; // Posición debajo del reporte
        
        if (mapYPosition + mapPdfHeight < pdfHeight) {
             pdf.addImage(mapImage, 'PNG', 10, mapYPosition, mapPdfWidth, mapPdfHeight);
        } else {
            pdf.addPage();
            pdf.addImage(mapImage, 'PNG', 10, 20, mapPdfWidth, mapPdfHeight);
        }
       
        // Descargar el PDF
        pdf.save(`Reporte-${comunaName.replace(/ /g, '_')}.pdf`);
        
        // Restaurar el botón
        pdfButton.style.display = 'flex';
        pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i> Generar Reporte PDF';
        pdfButton.disabled = false;
    }
});