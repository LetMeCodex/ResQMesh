import React, { useState } from 'react';
import { User, Battery, Signal, Package, Shield, Award, MessageSquare, AlertTriangle, Compass, CheckCircle } from 'lucide-react';
import { VolunteerProfile, VolunteerState, Mission, calculateDistance, getEstTravelTime, getResponderTitle } from './MissionSystem';
import { VolunteerRewards } from './VolunteerRewards';
import { VolunteerChat, ChatMessage } from './VolunteerChat';

interface VolunteerDashboardProps {
  alerts: any[];
  isVolunteerMode: boolean;
  onToggleVolunteerMode: () => void;
  volunteerProfile: VolunteerProfile | null;
  onRegisterVolunteer: (profile: VolunteerProfile) => void;
  activeMission: Mission | null;
  onAcceptMission: (missionId: string) => void;
  onCompleteMission: (pointsGained: number, type: 'rescue' | 'delivery' | 'medical') => void;
  onAbandonMission: () => void;
  points: number;
  completedMissionsCount: number;
  rescuePoints: number;
  medicalPoints: number;
  deliveryPoints: number;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean, duration?: string) => void;
  onSendEmergencyBroadcast: (type: 'landslide' | 'flood' | 'roadblock' | 'missing', title: string, desc: string, lat: number, lng: number) => void;
  isChatRouting: boolean;
  chatRoutingLogs: string[];
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  alerts,
  isVolunteerMode,
  onToggleVolunteerMode,
  volunteerProfile,
  onRegisterVolunteer,
  activeMission,
  onAcceptMission,
  onCompleteMission,
  onAbandonMission,
  points,
  completedMissionsCount,
  rescuePoints,
  medicalPoints,
  deliveryPoints,
  chatMessages,
  onSendMessage,
  onSendEmergencyBroadcast,
  isChatRouting,
  chatRoutingLogs
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'chat' | 'rewards'>('missions');
  
  // Registration state
  const [regName, setRegName] = useState('');
  const [regMedical, setRegMedical] = useState(false);
  const [regVehicle, setRegVehicle] = useState('none');
  const [regSkills, setRegSkills] = useState<string[]>([]);
  const [regSupplies, setRegSupplies] = useState<string[]>([]);
  
  // Active Mission Progression states
  const [missionStep, setMissionStep] = useState<'accepted' | 'located' | 'action' | 'completed'>('accepted');
  const [assistedActions, setAssistedActions] = useState<string[]>([]);
  const [selectedSupplyToDeliver, setSelectedSupplyToDeliver] = useState('');

  // Fixed volunteer starting coords (Gaurikund camp)
  const volCoords: [number, number] = [30.6515, 79.0270];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;
    onRegisterVolunteer({
      name: regName,
      skills: regSkills,
      medicalTraining: regMedical,
      vehicle: regVehicle,
      supplies: regSupplies
    });
  };

  const handleToggleSkill = (skill: string) => {
    setRegSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleToggleSupply = (supply: string) => {
    setRegSupplies(prev => prev.includes(supply) ? prev.filter(s => s !== supply) : [...prev, supply]);
  };

  // Convert raw alerts from Command dashboard into Acceptable Missions
  const availableMissions: Mission[] = alerts
    .filter(a => a.status === 'pending')
    .map(a => {
      const dist = calculateDistance(volCoords[0], volCoords[1], a.lat, a.lng);
      return {
        id: a.alertId,
        survivorName: a.name,
        lat: a.lat,
        lng: a.lng,
        severity: a.severity,
        requiredResources: a.requiredResources || [],
        distanceKm: dist,
        estTravelTimeMinutes: getEstTravelTime(dist, volunteerProfile?.vehicle || 'none'),
        status: 'pending',
        type: a.requiredResources?.includes('medicine') || a.requiredResources?.includes('food_water') ? 'delivery' : 'rescue',
        pointsReward: a.requiredResources?.includes('medicine') ? 70 : 50
      };
    });

  const handleAccept = (missionId: string) => {
    onAcceptMission(missionId);
    setMissionStep('accepted');
    setAssistedActions([]);
  };

  const handleActionCheckbox = (action: string) => {
    setAssistedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const handleCompleteFlow = () => {
    // Determine reward type
    let rewardType: 'rescue' | 'delivery' | 'medical' = 'rescue';
    if (assistedActions.includes('medical')) rewardType = 'medical';
    else if (assistedActions.includes('delivery')) rewardType = 'delivery';
    
    let score = 50; // default
    if (rewardType === 'medical') score = 20;
    else if (rewardType === 'delivery') score = 10;

    onCompleteMission(score, rewardType);
    setMissionStep('accepted');
  };

  // 1. Render Registration View
  if (!volunteerProfile) {
    return (
      <div className="volunteer-registration-card animate-fade-in">
        <div className="card-header">
          <User className="icon" size={24} />
          <h3>Civilian First Responder Sign-Up</h3>
        </div>
        
        <p className="intro-text">
          Sign up to connect to local offline mesh relays. Join search operations and drop supply payloads around Kedarnath trails.
        </p>

        <form onSubmit={handleRegisterSubmit} className="reg-form">
          <div className="form-group-mini">
            <label>FULL NAME</label>
            <input 
              type="text" 
              placeholder="Enter name..."
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required
            />
          </div>

          <div className="form-group-mini">
            <label>VEHICLE AVAILABILITY</label>
            <select value={regVehicle} onChange={(e) => setRegVehicle(e.target.value)}>
              <option value="none">None (Walking/Trekking)</option>
              <option value="motorcycle">Motorcycle (Dual-Sport)</option>
              <option value="quad">Quad ATV</option>
            </select>
          </div>

          <div className="form-group-mini">
            <label className="checkbox-label-wrapper">
              <input 
                type="checkbox" 
                checked={regMedical}
                onChange={(e) => setRegMedical(e.target.checked)}
              />
              <span>Certified First Aid / Medical Training</span>
            </label>
          </div>

          <div className="form-group-mini border-box">
            <label className="section-label">SPECIAL RESPONSE SKILLS</label>
            <div className="skills-checklist-grid">
              {['Wilderness Guide', 'Altitude Trauama', 'Heavy Lifting', 'Rope Rescue', 'Search & Rescue'].map(skill => (
                <label key={skill} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={regSkills.includes(skill)}
                    onChange={() => handleToggleSkill(skill)}
                  />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group-mini border-box">
            <label className="section-label">AVAILABLE SUPPLIES ON-HAND</label>
            <div className="skills-checklist-grid">
              {['Food Rations', 'Bottled Water', 'First-Aid Kits', 'Blankets', 'Portable Oxygen'].map(supply => (
                <label key={supply} className="checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={regSupplies.includes(supply)}
                    onChange={() => handleToggleSupply(supply)}
                  />
                  <span>{supply}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="submit-reg-btn">
            REGISTER RESCUER
          </button>
        </form>
      </div>
    );
  }

  // 2. Render Portal Dashboard
  return (
    <div className="volunteer-portal-card animate-fade-in">
      
      {/* Device Status Bar */}
      <div className="volunteer-status-bar">
        <div className="status-item">
          <Battery size={13} style={{ color: '#22c55e' }} />
          <span>92%</span>
        </div>
        <div className="status-item">
          <Signal size={13} style={{ color: '#22c55e' }} />
          <span>-67 dBm</span>
        </div>
        <div className="status-item">
          <Package size={13} />
          <span>Cap: 30kg</span>
        </div>
        <div className="status-item font-mono text-green">
          <Compass size={13} className="animate-spin-slow" />
          <span>GPS FIX</span>
        </div>
      </div>

      {/* Profile Header */}
      <div className="volunteer-profile-header">
        <div className="vol-meta">
          <h4 className="vol-name">{volunteerProfile.name}</h4>
          <span className="vol-title-badge">{getResponderTitle(points)}</span>
        </div>
        
        <button 
          onClick={onToggleVolunteerMode} 
          className="exit-portal-btn"
          title="Exit to central command dashboard"
        >
          Central Command
        </button>
      </div>

      {/* Tabs */}
      <div className="portal-tabs-row">
        <button 
          onClick={() => setActiveTab('missions')} 
          className={`portal-tab-btn ${activeTab === 'missions' ? 'active' : ''}`}
        >
          <Compass size={12} />
          <span>Missions</span>
        </button>
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`portal-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
        >
          <MessageSquare size={12} />
          <span>Mesh Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab('rewards')} 
          className={`portal-tab-btn ${activeTab === 'rewards' ? 'active' : ''}`}
        >
          <Award size={12} />
          <span>Rewards</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="portal-tab-content">
        {activeTab === 'missions' && (
          <div className="missions-panel animate-fade-in">
            {activeMission ? (
              /* Active Mission Panel */
              <div className="active-mission-card">
                <div className="mission-hdr">
                  <div className="tag-row">
                    <span className="live-pill active">ACTIVE MISSION</span>
                    <span className={`sev-badge ${activeMission.severity.toLowerCase()}`}>{activeMission.severity}</span>
                  </div>
                  <h4 className="survivor-name">Survivor: {activeMission.survivorName}</h4>
                </div>

                <div className="mission-details">
                  <div className="detail-row">
                    <span>GPS Target:</span>
                    <strong className="font-mono">{activeMission.lat.toFixed(4)}, {activeMission.lng.toFixed(4)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Distance Remaining:</span>
                    <strong>{activeMission.distanceKm} Km</strong>
                  </div>
                  <div className="detail-row">
                    <span>Estimated Travel:</span>
                    <strong>{activeMission.estTravelTimeMinutes} mins</strong>
                  </div>
                </div>

                {/* Mission Status Stepper */}
                <div className="mission-stepper-flow">
                  {missionStep === 'accepted' && (
                    <div className="step-actions">
                      <p className="step-hint">Follow the blue dotted safe route on the map, dodging active landslide areas.</p>
                      <button 
                        onClick={() => setMissionStep('located')} 
                        className="progress-mission-btn locate"
                      >
                        📍 ARRIVED AT SURVIVOR SITE
                      </button>
                    </div>
                  )}

                  {missionStep === 'located' && (
                    <div className="step-actions animate-fade-in">
                      <h5 className="sub-title">📦 Actions at Victim Location</h5>
                      <p className="step-hint">Select response interventions carried out:</p>
                      
                      <div className="actions-checklist">
                        <label className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={assistedActions.includes('medical')}
                            onChange={() => handleActionCheckbox('medical')}
                          />
                          <span>Medical First-Aid Assist (+20 XP)</span>
                        </label>
                        <label className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={assistedActions.includes('delivery')}
                            onChange={() => handleActionCheckbox('delivery')}
                          />
                          <span>Deliver Supplies / Rations (+10 XP)</span>
                        </label>
                        <label className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={assistedActions.includes('rescue')}
                            onChange={() => handleActionCheckbox('rescue')}
                          />
                          <span>Evacuation/Escort Started (+50 XP)</span>
                        </label>
                      </div>

                      <button 
                        onClick={() => setMissionStep('action')} 
                        disabled={assistedActions.length === 0}
                        className="progress-mission-btn"
                      >
                        GENERATE RESOLUTION RECORD
                      </button>
                    </div>
                  )}

                  {missionStep === 'action' && (
                    <div className="step-actions success-pulse animate-fade-in">
                      <CheckCircle size={36} style={{ color: 'var(--color-safety-green)', margin: '10px auto' }} />
                      <h4 className="congrats-text">🎉 RESCUE SUCCESSFUL</h4>
                      <p className="step-hint">Tactical resolution logs synchronized via P2P mesh relay networks.</p>
                      
                      <button 
                        onClick={handleCompleteFlow} 
                        className="progress-mission-btn finish"
                      >
                        SUBMIT MISSION REPORT
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={onAbandonMission} className="abandon-mission-btn">
                  Cancel Rescue Operation
                </button>
              </div>
            ) : (
              /* Available Missions List */
              <div className="available-missions-list">
                <h4 className="list-title">Nearby Active SOS Beacons</h4>
                {availableMissions.length === 0 ? (
                  <div className="empty-state">
                    No pending rescue alerts discovered within mesh range.
                  </div>
                ) : (
                  availableMissions.map(mission => (
                    <div key={mission.id} className="mission-item-card">
                      <div className="item-left">
                        <span className={`item-sev-bar ${mission.severity.toLowerCase()}`}></span>
                        <div className="item-info">
                          <h5>{mission.survivorName}</h5>
                          <span className="item-specs">📍 {mission.distanceKm} km | 🕒 {mission.estTravelTimeMinutes}m travel</span>
                          <span className="item-reqs">Needs: {mission.requiredResources.join(', ')}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAccept(mission.id)} 
                        className="accept-mission-btn"
                      >
                        ACCEPT
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <VolunteerChat
            messages={chatMessages}
            onSendMessage={onSendMessage}
            onSendEmergencyBroadcast={onSendEmergencyBroadcast}
            volunteerLocation={volCoords}
            isChatRouting={isChatRouting}
            chatRoutingLogs={chatRoutingLogs}
          />
        )}

        {activeTab === 'rewards' && (
          <VolunteerRewards
            points={points}
            completedCount={completedMissionsCount}
            rescuePoints={rescuePoints}
            medicalPoints={medicalPoints}
            deliveryPoints={deliveryPoints}
          />
        )}
      </div>
    </div>
  );
};
export default VolunteerDashboard;
