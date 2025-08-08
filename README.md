# Visualizador de la Secretaría de Infraestructura Física de Medellín 
## Alcaldía de Medellín  - RUTASIF 2025

Un repositorio para la centralización y visualización interactiva de los datos de proyectos de la **Secretaría de Infraestructura Física**.


## 🎯 Objetivo del proyecto

El propósito principal de esta herramienta es **Centralizar y facilitar el acceso a la información de los proyectos de infraestructura física de medellín**. Queremos que tanto funcionarios como ciudadanos puedan consultar de manera ágil e intuitiva el estado y los detalles de las obras que transforman nuestra ciudad, utilizando dashboards interactivos y mapas geográficos.


## ✨ Características principales

  * **📊 Centralización de datos**: Todos los tableros de control de Power BI de la Secretaría en un único lugar.
  * **🤖 Asistente virtual inteligente**: Un bot conversacional que te guía para encontrar exactamente la información que necesitas.
  * **🔎 Filtrado múltiple**: Busca y filtra proyectos por **comuna**, **proyecto estratégico**, **subsecretaría** o **unidad**.
  * **🗺️ Mapa interactivo**: Un geolocalizador que te ubica en el mapa de Medellín y te muestra los proyectos relevantes a tu alrededor.
  * **📍 Visualización geográfica**: Explora los proyectos directamente sobre una capa geográfica de la ciudad, facilitando la comprensión de su impacto territorial.


## ¿Cómo funciona?

Este proyecto se desarrolla en dos etapas principales que trabajan juntas para ofrecerte la mejor experiencia.

### Etapa 1: Asistente Virtual y consulta por filtros 

En esta fase, puedes interactuar con un asistente virtual diseñado para simplificar tu búsqueda.

1.  **Inicia la conversación** con nuestro bot.
2.  **Elige tu criterio de búsqueda**: ¿Te interesa una comuna en particular, un proyecto estratégico como el Metro de la 80, o una unidad específica?
3.  **Recibe tu acceso**: El bot procesará tu solicitud y te proporcionará el enlace directo al tablero de Power BI que contiene la información que buscas. ¡Así de fácil\!

### Etapa 2: Explorador geográfico y descubrimiento por ubicación 

Esta etapa te permite explorar los proyectos de una manera visual y geográfica.

1.  **Comparte tu ubicación**: Al ingresar a la herramienta, puedes permitir que el sistema acceda a tus coordenadas GPS.
2.  **Visualízate en el mapa**: Serás ubicado automáticamente en un mapa interactivo de Medellín.
3.  **Descubre tu entorno**: El sistema identificará la comuna en la que te encuentras y te mostrará los tableros de Power BI asociados a los proyectos de infraestructura de esa zona.


## Descripción técnica (para todos los públicos)

Para que entiendas un poco sobre la magia detrás de este proyecto, aquí te explicamos las tecnologías que utilizamos:

  * **Microsoft Power BI**: Es la herramienta que usamos para **crear los tableros de control interactivos**. Nos permite tomar miles de datos sobre las obras (presupuestos, avances, fechas) y transformarlos en gráficos y reportes fáciles de entender.

  * **Bot Asistente (Python)**: Piensa en él como un **bibliotecario digital**. Es un programa desarrollado en Python que entiende tus peticiones (como "muéstrame los proyectos de la comuna 10") y busca en nuestra base de datos el enlace correcto para darte una respuesta precisa y rápida.

  * **Geolocalizador y Leaflet.js**:

      * El **geolocalizador** es una función del navegador que, con tu permiso, nos dice dónde estás.
      * **Leaflet.js** es una biblioteca de código abierto que nos permite **dibujar el mapa interactivo de Medellín** que ves en la pantalla. Sobre este mapa, podemos superponer capas de información, como los límites de las comunas y los puntos exactos de cada proyecto.


## Estado del Proyecto

  * **[🟢] Etapa 1**: En desarrollo. Estamos trabajando en centralizar y estandarizar la información.
