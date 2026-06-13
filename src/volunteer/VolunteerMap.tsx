import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface VolunteerMapProps {
  map: L.Map | null;
  volunteerLocation: [number, number];
  dispatchRoute: Array<[number, number]> | null;
  landslides: Array<{ lat: number; lng: number }>;
  showFloodOverlay: boolean;
  showLandslideOverlay: boolean;
  activeMission: any;
}

export const VolunteerMap: React.FC<VolunteerMapProps> = ({
  map,
  volunteerLocation,
  dispatchRoute,
  landslides,
  showFloodOverlay,
  showLandslideOverlay,
  activeMission
}) => {
  // Layer refs for cleanup
  const volunteerMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeStartMarkerRef = useRef<L.CircleMarker | null>(null);
  const hazardsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Draw Volunteer Position Marker
  useEffect(() => {
    if (!map) return;

    if (volunteerMarkerRef.current) {
      volunteerMarkerRef.current.setLatLng(volunteerLocation);
    } else {
      const volIconHtml = `
        <div style="
          width: 14px;
          height: 14px;
          background-color: var(--color-safety-green);
          border: 2px solid white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px var(--color-safety-green), 0 0 20px var(--color-safety-green);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -6px;
            left: -6px;
            right: -6px;
            bottom: -6px;
            border: 2.5px solid var(--color-safety-green);
            border-radius: 50%;
            animation: pulse-ring 1.5s infinite;
            opacity: 0.8;
          "></div>
        </div>
      `;

      const volIcon = L.divIcon({
        className: 'volunteer-beacon-leaflet-icon',
        html: volIconHtml,
        iconSize: [0, 0]
      });

      volunteerMarkerRef.current = L.marker(volunteerLocation, { 
        icon: volIcon,
        zIndexOffset: 1200 
      })
      .bindTooltip('<b>Your Current Location</b><br/>Battery: 92% | RSSI: -67dBm', { direction: 'top', offset: [0, -10] })
      .addTo(map);
    }

    return () => {
      // Don't remove marker here to avoid flickering, let parent unmount handle it
    };
  }, [map, volunteerLocation]);

  // 2. Draw Route Polyline
  useEffect(() => {
    if (!map) return;

    // Remove existing route
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (routeStartMarkerRef.current) {
      routeStartMarkerRef.current.remove();
      routeStartMarkerRef.current = null;
    }

    if (dispatchRoute && dispatchRoute.length > 0) {
      // Draw path
      routePolylineRef.current = L.polyline(dispatchRoute, {
        color: 'var(--color-rescue-blue)',
        weight: 4,
        dashArray: '2, 8',
        className: 'mesh-routing-path'
      })
      .bindTooltip('Safe Routing Path (detours active)', { sticky: true })
      .addTo(map);

      // Start circle marker
      routeStartMarkerRef.current = L.circleMarker(dispatchRoute[0], {
        radius: 6,
        color: 'var(--color-rescue-blue)',
        fillColor: '#fff',
        fillOpacity: 0.9,
        weight: 2
      }).addTo(map);
    }
  }, [map, dispatchRoute]);

  // 3. Draw Hazard / Landslide Circles
  useEffect(() => {
    if (!map) return;

    if (!hazardsLayerGroupRef.current) {
      hazardsLayerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      hazardsLayerGroupRef.current.clearLayers();
    }

    if (showLandslideOverlay) {
      landslides.forEach((ls, idx) => {
        L.circle([ls.lat, ls.lng], {
          radius: 280,
          color: 'var(--color-emergency-red)',
          fillColor: 'var(--color-emergency-red)',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        })
        .bindTooltip(`⚠️ Active Landslide Danger Area ${idx + 1}`, { sticky: true })
        .addTo(hazardsLayerGroupRef.current!);
      });
    }

    if (showFloodOverlay) {
      // Draw flood zone expand overlay
      L.circle([30.715, 79.078], {
        radius: 600,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 1
      })
      .bindTooltip('🌊 Mandakini River Flash Flood Warning Sector', { sticky: true })
      .addTo(hazardsLayerGroupRef.current!);
    }
  }, [map, landslides, showLandslideOverlay, showFloodOverlay]);

  // 4. Cleanup on unmount
  useEffect(() => {
    return () => {
      if (volunteerMarkerRef.current) {
        volunteerMarkerRef.current.remove();
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }
      if (routeStartMarkerRef.current) {
        routeStartMarkerRef.current.remove();
      }
      if (hazardsLayerGroupRef.current) {
        hazardsLayerGroupRef.current.remove();
      }
    };
  }, []);

  return null; // This component manages map layers, doesn't render DOM
};
export default VolunteerMap;
