# Spec: Philly Public Art Explorer

## Project Overview
The Philly Public Art Explorer is an immersive 3D web application that allows users to discover and explore Philadelphia's massive collection of public art. Built on CesiumJS and powered by a high-precision dataset from philart.net, the app places sculptures, murals, and monuments within a photorealistic 3D recreation of the city. Users can filter by era and medium, search for specific artists, and experience cinematic "fly-to" transitions to see the art in its urban context.

## Data Story
The application is powered by a JSON export from the Philadelphia Public Art API (`art_data.json`). While the data is local for this build, it is processed through a modern API lifecycle to ensure performance and scalability.

### Data Source & Schema
* **Format:** JSON (GeoJSON-like structure).
* **Key Fields:**
    * `title.display`: The name of the artwork.
    * `artists[]`: Array containing artist names and external links.
    * `location.latitude / .longitude`: High-precision coordinates for 3D placement.
    * `pictures[]`: Contains `small` (thumbnail) and `large` (high-res) JPEGs.
    * `content[]`: Descriptive tags (e.g., "abstract", "standing person") used for categorization.
    * `artist_comments`: Used to detect "Moved" or "Missing" status.

### Data Flow
1.  **Fetch:** `@tanstack/react-query` loads the JSON file on app initialization.
2.  **Process:** A utility function transforms the raw JSON into an internal `ArtFeature` type, mapping specific content tags into broad categories: **Sculpture, Mural, Monument, Fountain, or Other**.
3.  **Globe Mapping:** Each piece of art is rendered as a Cesium `Entity` using a `Billboard` (icon). 
4.  **Status Styling:** Logic checks the `artist_comments` field. If keywords like "Moved", "Missing", or "Destroyed" are found, the icon's `color` property is set to a desaturated grey with `0.5` alpha to indicate its absence.
5.  **Reactivity:** Filtering does not re-fetch data. Instead, the `entity.show` property is toggled based on the global filter state managed by Zustand.

## Technical Architecture
The project follows a clean, decoupled architecture where the 3D engine and the UI communicate through a shared state.

* **Framework:** React + TypeScript + Vite.
* **3D Engine:** CesiumJS with `vite-plugin-cesium` for automated asset configuration.
* **Base Layer:** Google Photorealistic 3D Tiles (via Cesium Ion) to provide high-detail buildings and context.
* **State Management:** `Zustand` manages the following:
    * `selectedArtId`: The ID of the currently focused artwork.
    * `filters`: Active year ranges and medium categories.
    * `searchQuery`: The string used to filter the gallery and map.
* **Data Management:** `React Query` handles the JSON lifecycle with a 5-minute stale-time.

## Key Features & Interactions

### 1. The 3D Explorer
* **Billboard Icons:** Every artwork appears as a marker on the globe.
* **Selection:** Clicking a marker updates the `selectedArtId` in the store, which triggers the UI popup and high-res image display.
* **Fly-To:** Selecting "Fly to Art" triggers a `viewer.camera.flyTo` with a 45-degree pitch and a 200m offset, providing a "drone view" of the piece.

### 2. Filtering & Search
* **Era Filter:** A slider or multi-select for Art Year (e.g., 1900-1950, 1951-2000, 2001-Present).
* **Medium Filter:** Broad category toggles (Sculpture, Mural, etc.).
* **Search Bar:** Filters the global list by Artist Name or Art Name. As the user types, markers on the map that don't match are hidden (`entity.show = false`).

### 3. Bottom Gallery
* **Visual Scroll:** A horizontal ribbon of thumbnails (`small` image URLs).
* **Synchronized Selection:** Clicking a thumbnail centers the map on that piece and opens its details.

### 4. Discovery Tools
* **Randomizer Button:** A "Surprise Me" button that selects a random entry from the active (filtered) dataset and initiates a camera fly-to.

## Project Structure
```text
src/
├── assets/             # Static icons and placeholder images
├── components/
│   ├── globe/          # Cesium Viewer and Entity logic
│   ├── ui/             # Overlay components
│   │   ├── Search.tsx  # Search input logic
│   │   ├── Filters.tsx # Year and Medium controls
│   │   ├── Gallery.tsx # Bottom thumbnail ribbon
│   │   └── Popup.tsx   # Art details and high-res image
│   └── shared/         # Common UI elements (buttons, inputs)
├── hooks/              # Custom hooks for Cesium interactions
├── store/              # Zustand state definitions
├── types/              # TypeScript interfaces for Art data
├── utils/              # Data transformation and filtering logic
├── App.tsx             # Main layout and provider setup
└── main.tsx            # Ion token config and React Query setup