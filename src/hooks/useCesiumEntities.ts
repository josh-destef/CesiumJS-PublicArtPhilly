// src/hooks/useCesiumEntities.ts
// ─────────────────────────────────────────────────────────────────────────────
// This custom hook owns the relationship between our ArtFeature data and
// the CesiumJS Entity objects on the globe.
//
// RESPONSIBILITIES:
//  1. Create one Billboard Entity per artwork when data first loads
//  2. Store a lookup Map<id → Entity> so we can find entities fast
//  3. Toggle entity.show on/off whenever the filter changes (no re-render!)
//  4. Handle clicks on the globe → translate to art ID → update Zustand store
//
// TEACHING CONCEPTS:
//  • useRef for non-reactive mutable values (the Cesium Viewer reference)
//  • useEffect with cleanup (removing event handlers on unmount)
//  • Cesium Screeen Space Event Handler for mouse/touch pick
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import type { ArtFeature } from '../types/art';
import { useAppStore } from '../store/useAppStore';

// ── Billboard Icon Generator ──────────────────────────────────────────────────

/**
 * Creates a small colored circle as a PNG data URL using a Canvas element.
 * This avoids needing any external icon image files.
 *
 * TEACHING NOTE: <canvas> is an HTML element we can draw on with JavaScript.
 * We use it here purely to generate a PNG image in-memory — the canvas never
 * appears in the DOM.
 *
 * @param color  A CSS color string, e.g. 'rgba(0, 220, 255, 0.9)'
 * @param size   Diameter of the circle in pixels
 */
function makeCircleIcon(color: string, size: number = 20): string {
  // Create a canvas element (not attached to the DOM)
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;
  const radius = size / 2;

  // Draw filled circle
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Draw white border for visibility against terrain
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Convert the canvas to a PNG data URL
  return canvas.toDataURL('image/png');
}

// Pre-generate the two icon types at module load time (only done once)
const ICON_PRESENT = makeCircleIcon('rgba(0, 220, 255, 0.9)', 22);   // Bright cyan
const ICON_ABSENT  = makeCircleIcon('rgba(160, 160, 160, 0.5)', 18); // Faded grey

// ── The Hook ──────────────────────────────────────────────────────────────────

interface UseCesiumEntitiesProps {
  /** The initialized Cesium Viewer instance (may be null before init) */
  viewer: Cesium.Viewer | null;
  /** All artwork features (from React Query data transform) */
  artFeatures: ArtFeature[];
  /** The currently-visible subset (after filters applied) */
  filteredIds: Set<string>;
}

export function useCesiumEntities({
  viewer,
  artFeatures,
  filteredIds,
}: UseCesiumEntitiesProps): void {
  // We use a ref (not state) to store the entity map because:
  //  - We never need React to re-render when this changes
  //  - We need the same map across re-renders
  const entityMapRef = useRef<Map<string, Cesium.Entity>>(new Map());

  // ── Effect 1: Create entities when art data loads ─────────────────────────
  useEffect(() => {
    // Can't do anything without a Viewer or data
    if (!viewer || artFeatures.length === 0) return;

    const entityMap = entityMapRef.current;

    // Remove any existing entities from a previous data load (safety)
    entityMap.forEach(entity => viewer.entities.remove(entity));
    entityMap.clear();

    // Create one Cesium Entity for each artwork
    artFeatures.forEach(art => {
      const entity = viewer.entities.add({
        // Position: CesiumJS uses Cartesian3, not lat/lon directly.
        // fromDegrees converts WGS-84 lat/lon to the 3D coordinate system.
        position: Cesium.Cartesian3.fromDegrees(art.lon, art.lat),

        // Store our art ID on the entity so we can retrieve it on click
        id: art.id,

        // Billboard: a 2D icon that always faces the camera (like a sprite)
        billboard: {
          image: art.isAbsent ? ICON_ABSENT : ICON_PRESENT,
          width: art.isAbsent ? 18 : 22,
          height: art.isAbsent ? 18 : 22,
          // verticalOrigin pins the bottom of the icon to the coordinates
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          // disableDepthTestDistance makes the icon always draw on top of buildings
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          // scaleByDistance makes icons smaller as you zoom out (nicer look)
          scaleByDistance: new Cesium.NearFarScalar(500, 1.5, 50000, 0.5),
        },

        // Show or hide based on the current filter state
        show: filteredIds.has(art.id),
      });

      // Store in our lookup map
      entityMap.set(art.id, entity);
    });

    // Cleanup: remove all entities when this component unmounts
    return () => {
      entityMap.forEach(entity => viewer.entities.remove(entity));
      entityMap.clear();
    };
    // We intentionally OMIT filteredIds here — we handle show/hide separately
    // in Effect 2 to avoid re-creating all entities on every filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, artFeatures]);

  // ── Effect 2: Sync visibility when filters change ─────────────────────────
  useEffect(() => {
    const entityMap = entityMapRef.current;

    // Update entity.show for every entity — no entities are re-created
    entityMap.forEach((entity, id) => {
      entity.show = filteredIds.has(id);
    });
  }, [filteredIds]);

  // ── Effect 3: Handle click events on the globe ────────────────────────────
  useEffect(() => {
    if (!viewer) return;

    const selectArt = useAppStore.getState().selectArt;

    // ScreenSpaceEventHandler listens to mouse/touch events on the 3D canvas
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      // Pick the entity at the clicked screen position
      const picked = viewer.scene.pick(click.position);

      if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
        // The entity's ID is our art ID string
        const artId = picked.id.id as string;
        selectArt(artId);
      } else {
        // Clicked empty space → deselect
        selectArt(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Cleanup: always remove event handlers when the component unmounts!
    return () => {
      handler.destroy();
    };
  }, [viewer]);
}
