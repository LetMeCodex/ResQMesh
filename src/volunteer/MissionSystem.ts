export interface VolunteerProfile {
  name: string;
  skills: string[];
  medicalTraining: boolean;
  vehicle: string;
  supplies: string[];
}

export interface VolunteerState {
  profile: VolunteerProfile | null;
  location: [number, number]; // [lat, lng]
  battery: number;
  networkStrength: number; // dBm
  capacity: number; // kg
  points: number;
  status: 'available' | 'busy' | 'offline';
  completedMissionsCount: number;
}

export interface Mission {
  id: string;
  survivorName: string;
  lat: number;
  lng: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  requiredResources: string[];
  distanceKm: number;
  estTravelTimeMinutes: number;
  status: 'pending' | 'accepted' | 'located' | 'completed';
  type: 'rescue' | 'delivery';
  deliveryItem?: string;
  pointsReward: number;
}

// Calculate Haversine distance in Km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

// Generate coordinate path from volunteer to destination avoiding hazard coordinates
export function generateVolunteerRoute(
  from: [number, number],
  to: [number, number],
  landslides: Array<{ lat: number; lng: number }>
): Array<[number, number]> {
  const path: Array<[number, number]> = [from];
  
  // Standard trail coordinates (Gaurikund Route Nodes)
  const waypointNodes: Array<[number, number]> = [
    [30.6342, 79.0145], // Sonprayag
    [30.6515, 79.0270], // Gaurikund
    [30.6865, 79.0550], // Rambara
    [30.7346, 79.0669]  // Kedarnath
  ];

  // Filter waypoints that are roughly between starting and destination points
  const minLat = Math.min(from[0], to[0]);
  const maxLat = Math.max(from[0], to[0]);
  const minLng = Math.min(from[1], to[1]);
  const maxLng = Math.max(from[1], to[1]);

  const activeWaypoints = waypointNodes.filter(wp => {
    // Keep waypoints that fall within bounding box plus margin
    return wp[0] >= minLat - 0.01 && wp[0] <= maxLat + 0.01 &&
           wp[1] >= minLng - 0.01 && wp[1] <= maxLng + 0.01;
  });

  // Sort active waypoints in order from 'from' to 'to'
  activeWaypoints.sort((a, b) => {
    const distA = calculateDistance(from[0], from[1], a[0], a[1]);
    const distB = calculateDistance(from[0], from[1], b[0], b[1]);
    return distA - distB;
  });

  // Insert waypoints with hazard avoidance
  activeWaypoints.forEach(wp => {
    let finalWp = wp;
    const hazardRadius = 0.004; // roughly 400m bypass

    // Check if waypoint lies too close to a landslide
    for (const ls of landslides) {
      const dist = calculateDistance(finalWp[0], finalWp[1], ls.lat, ls.lng);
      if (dist < 0.4) {
        // Detour slightly to the east of the gorge
        finalWp = [finalWp[0] + 0.003, finalWp[1] + 0.004];
        break;
      }
    }
    path.push(finalWp);
  });

  // Final point
  path.push(to);
  
  // Deduplicate consecutive points
  return path.filter((pt, idx) => {
    if (idx === 0) return true;
    const prev = path[idx - 1];
    return pt[0] !== prev[0] || pt[1] !== prev[1];
  });
}

// Get points rewarded based on mission type and actions
export function getRewardsForType(type: 'rescue' | 'delivery' | 'medical'): number {
  switch (type) {
    case 'rescue':
      return 50;
    case 'medical':
      return 20;
    case 'delivery':
      return 10;
    default:
      return 5;
  }
}

// Get Responder Title based on score
export function getResponderTitle(points: number): string {
  if (points >= 500) return 'Disaster Hero';
  if (points >= 250) return 'Gold Responder';
  if (points >= 100) return 'Silver Responder';
  return 'Bronze Responder';
}

// Generate travel time based on distance (assuming trail speed is ~5 km/h walking or 15 km/h on bike)
export function getEstTravelTime(distKm: number, vehicle: string): number {
  const speed = vehicle === 'none' ? 4 : vehicle === 'motorcycle' ? 15 : 6; // km/h
  const minutes = (distKm / speed) * 60;
  return Math.max(3, Math.round(minutes));
}
