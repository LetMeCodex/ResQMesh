const fs = require('fs');
let content = fs.readFileSync('c:\\\\Users\\\\anish jha\\\\Downloads\\\\ResQMess\\\\dashboard\\\\src\\\\App.jsx', 'utf8');

// 1. Imports
content = content.replace(/import React, { useState, useEffect, useRef } from 'react';\r?\nimport {/, "import React, { useState, useEffect, useRef } from 'react';\nimport L from 'leaflet';\nimport {");

// 2. Refs
content = content.replace(/\/\/ Refs for WebGL 3D Globe mapping[\s\S]*?const globeInstanceRef = useRef\(null\);/, "// Refs for Leaflet 2D mapping\n  const mapRef = useRef(null);\n  const mapInstanceRef = useRef(null);\n  const markersLayerRef = useRef(null);\n  const arcsLayerRef = useRef(null);\n  const floodPolygonRef = useRef(null);");

// 3. Init
const initGlobeRegex = /\/\/ Initialize WebGL 3D Globe[\s\S]*?globe\.controls\(\)\.autoRotateSpeed = 0\.6;\r?\n\r?\n  }, \[alerts, volunteers, selectedAlert, droneFlightActive, droneCoords, showFloodOverlay\]\);/;

const leafletLogic = `// Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([25.5981, 85.1356], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      className: 'dark-map-tiles'
    }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    arcsLayerRef.current = L.layerGroup().addTo(map);
    floodPolygonRef.current = L.layerGroup().addTo(map);
  }, []);

  // Update Map Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !arcsLayerRef.current || !floodPolygonRef.current) return;

    markersLayerRef.current.clearLayers();
    arcsLayerRef.current.clearLayers();
    floodPolygonRef.current.clearLayers();

    const createIcon = (className, html) => L.divIcon({
      className: 'custom-beacon-leaflet-container',
      html: html || \`<div class="\${className}" style="transform: translate(-50%, -50%);"></div>\`,
      iconSize: [0, 0]
    });

    // Gateway Base
    L.marker([25.5971, 85.1256], { icon: createIcon('pulse-beacon-high') })
      .bindTooltip('Gateway Base: ONLINE | 868 MHz', { direction: 'top', offset: [0, -10] })
      .addTo(markersLayerRef.current);

    // Safe Zones
    INITIAL_SAFE_ZONES.forEach(sz => {
      L.marker([sz.lat, sz.lng], { icon: createIcon('beacon-safezone') })
        .bindTooltip(\`Safe Zone: \${sz.name}\`, { direction: 'top', offset: [0, -10] })
        .addTo(markersLayerRef.current);
    });

    // Volunteers
    volunteers.forEach(v => {
      L.marker([v.lat, v.lng], { icon: createIcon('beacon-volunteer') })
        .bindTooltip(\`Volunteer: \${v.name}\`, { direction: 'top', offset: [0, -10] })
        .addTo(markersLayerRef.current);
    });

    // Alerts
    alerts.forEach(a => {
      const marker = L.marker([a.lat, a.lng], { 
        icon: createIcon(a.severity === 'Critical' ? 'pulse-beacon-critical' : 'pulse-beacon-high') 
      })
      .bindTooltip(\`[SOS] \${a.name} (\${a.severity})\`, { direction: 'top', offset: [0, -10] })
      .addTo(markersLayerRef.current);

      marker.on('click', () => {
        setSelectedAlert(a);
        setShowDecryptionView(true);
      });
    });

    // Drone
    if (droneFlightActive && droneCoords) {
      const droneHtml = \`
        <div style="width: 40px; height: 40px; transform: translate(-20px, -20px);">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="5" y1="5" x2="35" y2="35" stroke="#f3f4f6" stroke-width="2" />
            <line x1="35" y1="5" x2="5" y2="35" stroke="#f3f4f6" stroke-width="2" />
            <circle cx="20" cy="20" r="5" fill="#ff2e63" stroke="#f3f4f6" stroke-width="1.5" />
            <circle cx="5" cy="5" r="3" fill="#00f5d4" class="drone-prop drone-prop-1" />
            <circle cx="35" cy="5" r="3" fill="#00f5d4" class="drone-prop drone-prop-2" />
            <circle cx="5" cy="35" r="3" fill="#00f5d4" class="drone-prop drone-prop-3" />
            <circle cx="35" cy="35" r="3" fill="#00f5d4" class="drone-prop drone-prop-4" />
          </svg>
        </div>
      \`;
      L.marker(droneCoords, { icon: createIcon('', droneHtml), zIndexOffset: 1000 })
        .bindTooltip('Active Dispatch Drone', { direction: 'top', offset: [0, -10] })
        .addTo(markersLayerRef.current);
    }

    // Arcs / Trails
    if (selectedAlert) {
      const p2pPoints = [
        [selectedAlert.lat, selectedAlert.lng],
        [selectedAlert.lat - 0.002, selectedAlert.lng + 0.0035],
        [selectedAlert.lat - 0.0005, selectedAlert.lng - 0.003],
        [25.5971, 85.1256]
      ];
      L.polyline(p2pPoints, { color: '#10b981', weight: 2, className: 'mesh-routing-path' }).addTo(arcsLayerRef.current);
    }

    if (droneFlightActive) {
      const targetAlert = selectedAlert || alerts.find(a => a.severity === 'Critical') || alerts[0];
      const end = targetAlert ? [targetAlert.lat, targetAlert.lng] : [25.6051, 85.1376];
      L.polyline([[25.5971, 85.1256], end], { color: '#3b82f6', weight: 2, dashArray: '6, 6', className: 'drone-flight-path' }).addTo(arcsLayerRef.current);
    }

    // Gateway Radius
    L.circle([25.5971, 85.1256], {
      radius: 1500,
      color: '#d97706',
      fillColor: '#d97706',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '4, 4'
    }).addTo(arcsLayerRef.current);

    // Flood Polygon
    if (showFloodOverlay) {
      const floodCoords = [
        [25.618, 85.115],
        [25.612, 85.148],
        [25.601, 85.145],
        [25.603, 85.130],
        [25.610, 85.112]
      ];
      L.polygon(floodCoords, { color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 2 }).addTo(floodPolygonRef.current);
    }
  }, [alerts, volunteers, selectedAlert, droneFlightActive, droneCoords, showFloodOverlay]);`;

content = content.replace(initGlobeRegex, leafletLogic);

// 4. View Reset
content = content.replace(/if \(globeInstanceRef\.current\) \{[\s\S]*?\}/, "if (mapInstanceRef.current) {\n        mapInstanceRef.current.setView([alertObj.lat, alertObj.lng], 15);\n      }");

// 5. Container
content = content.replace(/\{\/\* Full-screen WebGL Globe container \*\/\}\r?\n\s*<div ref=\{globeContainerRef\}.*?<\/div>/, "{/* Full-screen Leaflet container */}\n        <div ref={mapRef} className=\"map-container\"></div>");

fs.writeFileSync('c:\\\\Users\\\\anish jha\\\\Downloads\\\\ResQMess\\\\dashboard\\\\src\\\\App.jsx', content);
