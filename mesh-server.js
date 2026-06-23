import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';

// --- Manual Environment Variables Loader ---
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('[Env Loader] Loading environment variables from .env.local...');
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        // Remove enclosing quotes
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  } else {
    console.warn('[Env Loader] WARNING: .env.local file not found. Secure API routes will fail.');
  }
}

// Load environment variables on start
loadEnv();

const PORT = 8080;

// --- Prompts Templates inside Server (Node-compatible) ---
const SYSTEM_PROMPTS = {
  triage: `You are the central AI triage coordinator for the ResQMesh emergency response network. You receive emergency SOS alerts. 
Analyze the input data and return ONLY a valid JSON object. 
DO NOT wrap the response in markdown code blocks, do not write any introductory or concluding text, just return the raw JSON.

Output JSON Schema:
{
  "severity": "Critical" | "High" | "Medium" | "Low",
  "priorityScore": number (0 to 100),
  "summary": "Short 1-sentence summary of the incident",
  "reasoning": ["list", "of", "reasons", "for", "severity", "level"],
  "recommendedAction": "Immediate recommended dispatch command",
  "requiredResources": ["list", "of", "needed", "resources"],
  "estimatedRisk": "Description of potential risks in the area",
  "confidence": number (0 to 100)
}`,

  commander: `You are the AI Incident Commander for the Uttarakhand Emergency Command Center. You analyze the overall state of the disaster (active alerts, volunteers, hazards, weather, and network status) to make high-level coordination decisions.
Analyze the input data and return ONLY a valid JSON object. 
DO NOT wrap the response in markdown code blocks, do not write any introductory or concluding text, just return the raw JSON.

Output JSON Schema:
{
  "situationSummary": "A concise 2-sentence summary of the active situation",
  "topRisks": ["list", "of", "top", "risks", "detected"],
  "recommendedNextActions": ["action 1", "action 2", "action 3"],
  "resourceGaps": ["gap 1", "gap 2"],
  "networkAssessment": "Assessment of current mesh vs cell tower network connectivity",
  "commanderDecision": "Final 1-sentence decision / instruction"
}`,

  volunteerMatch: `You are a tactical dispatch assistant matching active volunteers with critical emergency alerts based on proximity, skills, route risk, and resource constraints.
Analyze the input data and return ONLY a valid JSON object. 
DO NOT wrap the response in markdown code blocks, do not write any introductory or concluding text, just return the raw JSON.

Output JSON Schema:
{
  "bestVolunteerId": "ID of the best matching volunteer",
  "matchScore": number (0 to 100),
  "reason": "Detailed explanation of why this volunteer is the best fit, highlighting proximity, skills, and safety",
  "eta": "ETA description (e.g. '12s', '5 minutes')",
  "routeAdvice": "Specific route advice considering landslides or flood zones",
  "backupVolunteerId": "ID of the backup volunteer"
}`,

  disasterSummary: `You are a broadcast system generating a concise operational summary of the overall disaster situation for the command center dashboard.
Analyze the input data and return ONLY a valid JSON object. 
DO NOT wrap the response in markdown code blocks, do not write any introductory or concluding text, just return the raw JSON.

Output JSON Schema:
{
  "headline": "A short, urgent headline capturing the main event",
  "summary": "Concise paragraph summarizing active alerts, weather, and network outages",
  "urgentAction": "The single most critical action required immediately",
  "riskLevel": "Critical" | "High" | "Medium" | "Low"
}`,

  operationalFeed: `You are an automated operations log generator. You create realistic, log-style messages for the live incident feed based on incoming event telemetry.
Analyze the input data and return ONLY a valid JSON object. 
DO NOT wrap the response in markdown code blocks, do not write any introductory or concluding text, just return the raw JSON.

Output JSON Schema:
{
  "type": "warning" | "info" | "success" | "critical",
  "title": "Short event title",
  "message": "Brief descriptive log message",
  "timestamp": "Current time in HH:MM:SS format"
}`
};

const USER_PROMPTS = {
  triage: (data) => `Analyze this SOS alert:
Message: "${data.message || data.decryptedMessage}"
Category: "${data.emergencyType || data.category}"
Battery: ${data.batteryAtTrigger || data.battery || 100}%
Hops: ${data.hopCount || data.meshHops || 1}
Location: lat ${data.lat}, lng ${data.lng}
Weather: "${data.weather || 'unknown'}"
Hazards: "${data.hazards || 'none'}"`,

  commander: (data) => `Analyze the central command center status:
Active Alerts: ${JSON.stringify(data.alerts || [])}
Volunteers: ${JSON.stringify(data.volunteers || [])}
Weather: "${data.weather || 'unknown'}"
Network Telemetry: "${data.networkStatus || 'unknown'}"
Hazards: "${data.hazards || 'none'}"
Completed Rescues: ${data.completedRescuesCount || 0}`,

  volunteerMatch: (data) => `Match this SOS alert with the available volunteers:
SOS Alert: ${JSON.stringify(data.alert || {})}
Available Volunteers: ${JSON.stringify(data.volunteers || [])}`,

  disasterSummary: (data) => `Generate an operational summary of current telemetry:
Active Alerts count: ${data.activeCount || 0}
Weather: "${data.weather || 'unknown'}"
Cellular Tower Status: "${data.networkStatus || 'offline'}"
Mesh Network Status: "Active with ${data.nodesCount || 0} nodes"`,

  operationalFeed: (data) => `Generate a log entry for this event type: "${data.eventType}"
Event details: "${data.eventDetails || ''}"`
};

// --- Secure ASI:ONE Completions Proxy ---
async function callASI(systemPrompt, userPrompt) {
  const apiKey = process.env.ASI_ONE_API_KEY;
  if (!apiKey) {
    throw new Error('ASI_ONE_API_KEY is not configured on the server');
  }

  const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'asi1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ASI:ONE API Error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from ASI:ONE API');
  }
  
  return JSON.parse(content.trim());
}

// --- Hybrid HTTP server ---
const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`[API Gateway] 📩 HTTP Request: ${req.method} ${req.url}`);

  if (req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      try {
        const body = bodyData ? JSON.parse(bodyData) : {};
        let result = null;

        if (req.url === '/api/asi/triage') {
          result = await callASI(SYSTEM_PROMPTS.triage, USER_PROMPTS.triage(body));
        } else if (req.url === '/api/asi/commander') {
          result = await callASI(SYSTEM_PROMPTS.commander, USER_PROMPTS.commander(body));
        } else if (req.url === '/api/asi/volunteer-match') {
          result = await callASI(SYSTEM_PROMPTS.volunteerMatch, USER_PROMPTS.volunteerMatch(body));
        } else if (req.url === '/api/asi/disaster-summary') {
          result = await callASI(SYSTEM_PROMPTS.disasterSummary, USER_PROMPTS.disasterSummary(body));
        } else if (req.url === '/api/asi/operational-feed') {
          result = await callASI(SYSTEM_PROMPTS.operationalFeed, USER_PROMPTS.operationalFeed(body));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not Found' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error(`[API Gateway] ❌ Error handling ${req.url}:`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// --- WebSocket P2P Server ---
const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  clients.add(ws);
  console.log(`[Mesh Radio] 🟢 New peer connected from ${clientIp}. Total peers active: ${clients.size}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`[Mesh Radio] 🔁 Received message type: "${data.type}"`);

      // Broadcast the packet to all other connected peers (simulating spatial RF transmission)
      const broadcastPayload = JSON.stringify(data);
      let relayedCount = 0;
      clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(broadcastPayload);
          relayedCount++;
        }
      });
      if (relayedCount > 0) {
        console.log(`[Mesh Radio] 📣 Relayed packet to ${relayedCount} other active node(s).`);
      }
    } catch (err) {
      console.error('[Mesh Radio] ❌ Error processing incoming packet:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Mesh Radio] 🔴 Peer disconnected. Total peers active: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error(`[Mesh Radio] ⚠️ Socket error:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🛰️  ResQMesh Hybrid API Gateway & P2P Server is running!`);
  console.log(`🔌 API Base URL: http://localhost:${PORT}`);
  console.log(`📡 WebSocket Address: ws://localhost:${PORT}`);
  console.log(`📡 Broadcast mesh airwaves initialized.`);
  console.log(`========================================================`);
});
