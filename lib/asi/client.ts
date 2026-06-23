// ASI:ONE client-side helper client
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // If running in local Vite development server, point to our local Node.js proxy server
    if (window.location.port === '5173' || window.location.hostname === 'localhost') {
      return 'http://localhost:8080';
    }
  }
  return '';
};

// Fallback mocks if the API fails or is offline
export const MOCK_FALLBACKS = {
  triage: (message: string, category: string, battery: number, lat: number, lng: number) => {
    const msgLower = (message || '').toLowerCase();
    let severity = 'Medium';
    let priorityScore = 55;
    let summary = message || 'Emergency details reported.';
    let recommendedAction = 'Dispatch nearby assessment volunteers.';
    let requiredResources = ['first_aid'];
    let estimatedRisk = 'Moderate terrain risk. Heavy rain forecasted.';
    
    if (msgLower.includes('landslide') || msgLower.includes('slip') || msgLower.includes('flood') || msgLower.includes('water rising') || msgLower.includes('trapped') || msgLower.includes('gorge')) {
      severity = 'Critical';
      priorityScore = 95;
      summary = 'Flash flood/landslide has isolated victims in deep valley zone requiring helicopter/drone evacuation.';
      recommendedAction = 'Active landslide blocked NH-107 near Sonprayag. Alternate pedestrian track or heavy drone supply drop recommended.';
      requiredResources = ['rescue_boat', 'swimming', 'survival'];
      estimatedRisk = 'High risk of secondary landslide near Sonprayag corridor. Ground access blocked.';
    } else if (msgLower.includes('fracture') || msgLower.includes('tibia') || msgLower.includes('hypothermia') || msgLower.includes('asthma') || msgLower.includes('medical') || msgLower.includes('unconscious') || msgLower.includes('injury')) {
      severity = 'High';
      priorityScore = 88;
      summary = 'High-altitude medical distress or physical trauma. Patient needs stabilizing meds and evacuation.';
      recommendedAction = 'Kedarnath base reports heavy fog. Air rescue visibility low. Send ground guides or dispatch heavy UAV with medicine.';
      requiredResources = ['medicine', 'first_aid'];
      estimatedRisk = 'Low atmospheric visibility restricting aerial operations. Cold rain active.';
    } else if (msgLower.includes('food') || msgLower.includes('water') || msgLower.includes('hungry') || msgLower.includes('rations') || msgLower.includes('depletion')) {
      severity = 'Medium';
      priorityScore = 65;
      summary = 'Evacuation base camp reporting ration shortages and drinking water exhaustion.';
      recommendedAction = 'Redirect ITBP volunteer pack-mule teams or drone drops to supply stranded groups.';
      requiredResources = ['food_water'];
      estimatedRisk = 'Logistical pathways slowed down due to debris on road.';
    }

    const containsChild = /child|kid|baby|infant|bacha|baccha/i.test(msgLower);
    if (containsChild) {
      severity = 'Critical';
      priorityScore = Math.min(100, priorityScore + 10);
      summary = `[👶 CHILDREN DETECTED] ${summary}`;
      recommendedAction = `Priority Dispatch: Children/infants reported. ${recommendedAction}`;
    }

    return {
      severity,
      priorityScore,
      summary,
      reasoning: ['Message analysis matches critical keyword signatures', 'Battery level is ' + battery + '%', 'Mesh hops indicates relative isolation'],
      recommendedAction,
      requiredResources,
      estimatedRisk,
      confidence: 90,
      isFallback: true
    };
  },

  commander: (alertsCount: number, volunteersCount: number, weather: string) => {
    return {
      situationSummary: `Uttarakhand grid active with ${alertsCount} unresolved SOS alerts. Weather intensity is currently ${weather}.`,
      topRisks: [
        'Mandakini River rising above danger limits near Rambara.',
        'NH-107 road blockage halting heavy rescue vehicles.',
        'High-altitude fog limiting chopper dispatch at Kedarnath peaks.'
      ],
      recommendedNextActions: [
        'Deploy heavy supply drone (UAV-01) with emergency rations to Rambara.',
        'Assign medic Amit Negi to high-priority trauma alert at Gaurikund.',
        'Standby ITBP mountain rangers at Sonprayag base command.'
      ],
      resourceGaps: ['Clean water shortage reported near Kedarnath shelter.', 'Nebulizers/splints depleted at Gaurikund camp.'],
      networkAssessment: 'LTE Cellular towers down. Fallback mesh radio network active on 868MHz (IN/EU). Starlink satellite link stable.',
      commanderDecision: 'Prioritize UAV drone supply drops to Rambara and Gaurikund medic dispatches.',
      isFallback: true
    };
  },

  volunteerMatch: (alert: any, volunteers: any[]) => {
    const defaultVol = volunteers[0] || { volunteerId: 'v-1', name: 'Devendra Singh' };
    return {
      bestVolunteerId: defaultVol.volunteerId,
      matchScore: 94,
      reason: `Assigned volunteer (${defaultVol.name}) is closest to victim coords, first aid certified, and route bypasses active mudslide area.`,
      eta: '12s',
      routeAdvice: 'Take Gaurikund East Ridge trail to bypass landslide zone.',
      backupVolunteerId: volunteers[1]?.volunteerId || 'v-2',
      isFallback: true
    };
  },

  disasterSummary: (activeCount: number, weather: string) => {
    return {
      headline: `Cellular outage detected. ${activeCount} active SOS alerts.`,
      summary: `Active mesh networks coordinating rescues. Weather state: ${weather}. 1 route blocked due to landslide near Sonprayag.`,
      urgentAction: 'Deploy UAV drone with medical supplies to critical trapped victims.',
      riskLevel: activeCount > 5 ? 'Critical' : activeCount > 2 ? 'High' : 'Medium',
      isFallback: true
    };
  },

  operationalFeed: (eventType: string) => {
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let title = 'System Log';
    let message = 'Telemetry sync active.';
    let type = 'info';

    if (eventType === 'landslide') {
      title = '⚠️ Landslide Warning';
      message = 'Mudslide detected near Sonprayag corridor. NH-107 marked closed.';
      type = 'critical';
    } else if (eventType === 'cellular_outage') {
      title = '🚨 Cellular Outage';
      message = 'Jio and BSNL telecom tower backhaul link severed. Hops switching to mesh fallback.';
      type = 'critical';
    } else if (eventType === 'sos_received') {
      title = '📩 SOS Alert Received';
      message = 'New E2EE packet relayed and successfully triaged by ASI:ONE.';
      type = 'warning';
    } else if (eventType === 'volunteer_assigned') {
      title = '👨‍🚒 Rescue Dispatch';
      message = 'Volunteer assigned to emergency alert. Rescuer en-route.';
      type = 'info';
    } else if (eventType === 'uav_standby') {
      title = '✈️ UAV Standby';
      message = 'Drone-01 payload loaded with medical assets. Awaiting launching coordinates.';
      type = 'info';
    } else if (eventType === 'rescue_complete') {
      title = '✅ Rescue Complete';
      message = 'Stranded pilgrim successfully evacuated and verified safe at base camp.';
      type = 'success';
    }

    return {
      type,
      title,
      message,
      timestamp: ts,
      isFallback: true
    };
  }
};

// Client POST wrapper
async function postAPI(endpoint: string, body: any): Promise<any> {
  const url = `${getBaseUrl()}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

// API functions
export async function triageEmergency(data: {
  message: string;
  category: string;
  battery: number;
  lat: number;
  lng: number;
  hopCount?: number;
  weather?: string;
  hazards?: string;
}) {
  try {
    return await postAPI('/api/asi/triage', data);
  } catch (err) {
    console.warn('triageEmergency API failed, using fallback mock:', err);
    return MOCK_FALLBACKS.triage(data.message, data.category, data.battery, data.lat, data.lng);
  }
}

export async function getCommanderSituation(data: {
  alerts: any[];
  volunteers: any[];
  weather: string;
  networkStatus: string;
  hazards: string;
  completedRescuesCount: number;
}) {
  try {
    return await postAPI('/api/asi/commander', data);
  } catch (err) {
    console.warn('getCommanderSituation API failed, using fallback mock:', err);
    return MOCK_FALLBACKS.commander(data.alerts.length, data.volunteers.length, data.weather);
  }
}

export async function matchVolunteer(data: {
  alert: any;
  volunteers: any[];
}) {
  try {
    return await postAPI('/api/asi/volunteer-match', data);
  } catch (err) {
    console.warn('matchVolunteer API failed, using fallback mock:', err);
    return MOCK_FALLBACKS.volunteerMatch(data.alert, data.volunteers);
  }
}

export async function getDisasterSummary(data: {
  activeCount: number;
  weather: string;
  networkStatus: string;
  nodesCount: number;
}) {
  try {
    return await postAPI('/api/asi/disaster-summary', data);
  } catch (err) {
    console.warn('getDisasterSummary API failed, using fallback mock:', err);
    return MOCK_FALLBACKS.disasterSummary(data.activeCount, data.weather);
  }
}

export async function generateOperationalLogs(data: {
  eventType: string;
  eventDetails?: string;
}) {
  try {
    return await postAPI('/api/asi/operational-feed', data);
  } catch (err) {
    console.warn('generateOperationalLogs API failed, using fallback mock:', err);
    return MOCK_FALLBACKS.operationalFeed(data.eventType);
  }
}
