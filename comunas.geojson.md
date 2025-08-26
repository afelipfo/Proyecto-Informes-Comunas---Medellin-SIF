# comunas.geojson

Este archivo contiene la representación geoespacial de las comunas de la ciudad de Medellín en formato GeoJSON estándar.

## Estructura del archivo
- `type`: Siempre es `FeatureCollection`.
- `features`: Lista de objetos `Feature`, cada uno representa una comuna.
  - `properties`:
    - `IDENTIFICADOR`: Identificador único de la comuna (string).
    - `NOMBRE`: Nombre de la comuna.
  - `geometry`:
    - `type`: Siempre `Polygon` (polígono que delimita la comuna).
    - `coordinates`: Arreglo de coordenadas `[longitud, latitud]` que definen el polígono.

## Ejemplo de un Feature
```json
{
  "type": "Feature",
  "properties": {
    "IDENTIFICADOR": "1",
    "NOMBRE": "Comuna 1 - Popular"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-75.552, 6.297],
        ...
      ]
    ]
  }
}
```

## Uso en el proyecto
- Este archivo es utilizado para visualizar mapas interactivos y asociar información geográfica a cada comuna en la aplicación RUTA-SIF.
- Compatible con librerías de mapas como Leaflet, Mapbox, OpenLayers, etc.

## Recomendaciones de optimización
- El archivo ya está minificado para uso en producción.
- Si necesitas editarlo, puedes usar herramientas como [geojson.io](https://geojson.io/) para visualizar y validar la geometría.
- Si agregas más propiedades a las comunas, hazlo dentro del objeto `properties` para mantener la compatibilidad.

## Validación
Puedes validar la estructura del archivo usando linters de GeoJSON o plataformas como geojson.io para evitar errores de sintaxis y asegurar la interoperabilidad.
