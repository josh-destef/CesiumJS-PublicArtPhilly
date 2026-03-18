// src/components/globe/CesiumGlobe.tsx
// ─────────────────────────────────────────────────────────────────────────────
// This component owns the CesiumJS Viewer — the 3D globe engine.
//
// WHAT IT DOES:
//  1. Creates the Viewer and attaches it to a <div> in the DOM
//  2. Loads Google Photorealistic 3D Tiles (buildings, terrain)
//  3. Sets the initial camera over Philadelphia
//  4. Exposes the Viewer instance via a callback so the parent can fly the camera
//
// TEACHING CONCEPTS:
//  • useRef for DOM element access (the div CesiumJS attaches to)
//  • useEffect for "mount" logic — runs once after first render
//  • Cleanup in useEffect: always destroy the Viewer to release WebGL memory
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Philadelphia city center coordinates (WGS-84)
const PHILLY_LAT = 39.9526;
const PHILLY_LON = -75.1652;

interface CesiumGlobeProps {
  /** Callback fired once the viewer is ready — parent stores it for fly-to */
  onViewerReady: (viewer: Cesium.Viewer) => void;
}

export default function CesiumGlobe({ onViewerReady }: CesiumGlobeProps) {
  // This ref attaches to the <div> that CesiumJS will render into
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: Cesium.Viewer | null = null;
    let isCancelled = false;

    async function initViewer() {
      if (!containerRef.current) return;

      // 1. Fetch terrain
      const terrainProvider = await Cesium.createWorldTerrainAsync();
      
      // If the component unmounted while waiting for terrain, stop here.
      if (isCancelled) return;

      // ── Create the Viewer ────────────────────────────────────────────────────
      viewer = new Cesium.Viewer(containerRef.current, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,             // Disables the default iframe popup
        selectionIndicator: false,  // Disables the default green selection box
        scene3DOnly: true,
        baseLayer: false,           // Disable default imagery
        terrainProvider,
      });

      // ── Load Google Photorealistic 3D Tiles ──────────────────────────────────
      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset();
        // Check cancel state again before modifying the scene
        if (isCancelled) {
          viewer.destroy();
          return;
        }
        viewer.scene.primitives.add(tileset);
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('[CesiumGlobe] Could not load Google 3D Tiles:', err.message);
        }
      }

      if (isCancelled) return;

      // ── Set the Initial Camera ────────────────────────────────────────────────
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          PHILLY_LON,
          PHILLY_LAT,
          15000 
        ),
        orientation: {
          heading: 0, 
          pitch: Cesium.Math.toRadians(-45), 
          roll: 0,
        },
      });

      // ── Extra Visual Tweaks ───────────────────────────────────────────────────
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;

      // ── Notify Parent ─────────────────────────────────────────────────────────
      onViewerReady(viewer);
    }

    initViewer();

    return () => {
      isCancelled = true;
      if (viewer) {
        viewer.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps → run once on mount

  return (
    // This div fills its parent container (App sets it to 100vw / 100vh)
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
