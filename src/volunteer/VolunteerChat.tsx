import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, AlertTriangle, Radio, Play, Check } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'volunteer' | 'survivor' | 'system';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  duration?: string;
  status: 'routing' | 'delivered';
  hops?: string[];
}

interface VolunteerChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean, duration?: string) => void;
  onSendEmergencyBroadcast: (type: 'landslide' | 'flood' | 'roadblock' | 'missing', title: string, desc: string, lat: number, lng: number) => void;
  volunteerLocation: [number, number];
  isChatRouting: boolean;
  chatRoutingLogs: string[];
}

export const VolunteerChat: React.FC<VolunteerChatProps> = ({
  messages,
  onSendMessage,
  onSendEmergencyBroadcast,
  volunteerLocation,
  isChatRouting,
  chatRoutingLogs
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Emergency Form State
  const [reportType, setReportType] = useState<'landslide' | 'flood' | 'roadblock' | 'missing'>('landslide');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [customLat, setCustomLat] = useState(volunteerLocation[0].toFixed(4));
  const [customLng, setCustomLng] = useState(volunteerLocation[1].toFixed(4));

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync coords if location changes
  useEffect(() => {
    setCustomLat(volunteerLocation[0].toFixed(4));
    setCustomLng(volunteerLocation[1].toFixed(4));
  }, [volunteerLocation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatRouting, chatRoutingLogs]);

  const handleSendText = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleSimulateVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      onSendMessage("Voice Note Broadcasted", true, "0:04");
    }, 2000);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDesc.trim()) return;

    onSendEmergencyBroadcast(
      reportType,
      reportTitle,
      reportDesc,
      parseFloat(customLat) || volunteerLocation[0],
      parseFloat(customLng) || volunteerLocation[1]
    );

    // Reset Form
    setReportTitle('');
    setReportDesc('');
    alert('🚨 Emergency Broadcast Transmitted via Mesh Relays!');
  };

  return (
    <div className="volunteer-chat-panel animate-fade-in">
      <div className="chat-report-tab-header">
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`tab-btn-mini ${activeTab === 'chat' ? 'active' : ''}`}
        >
          Offline Mesh Chat
        </button>
        <button 
          onClick={() => setActiveTab('report')} 
          className={`tab-btn-mini ${activeTab === 'report' ? 'active text-red' : ''}`}
        >
          🚨 Report Hazard
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="chat-container">
          <div className="chat-feed-scroll">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`chat-bubble-wrapper ${msg.sender === 'volunteer' ? 'self' : msg.sender === 'system' ? 'sys' : 'other'}`}
              >
                {msg.sender !== 'system' && (
                  <span className="sender-tag">
                    {msg.sender === 'volunteer' ? 'You' : 'Survivor Node'}
                  </span>
                )}
                
                <div className="bubble-body">
                  {msg.isVoice ? (
                    <div className="voice-message-ui">
                      <Play size={12} fill="currentColor" />
                      <div className="voice-waveform">
                        <span className="wave-bar"></span>
                        <span className="wave-bar tall"></span>
                        <span className="wave-bar short"></span>
                        <span className="wave-bar tall"></span>
                        <span className="wave-bar"></span>
                      </div>
                      <span className="voice-dur">{msg.duration}</span>
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  
                  <div className="bubble-meta">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'volunteer' && (
                      <span className={`status-chk ${msg.status === 'delivered' ? 'green' : 'amber'}`}>
                        {msg.status === 'delivered' ? <Check size={8} /> : 'routing...'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Mesh routing simulation updates */}
            {isChatRouting && chatRoutingLogs.length > 0 && (
              <div className="chat-routing-status-log">
                <div className="routing-header">
                  <Radio size={10} className="animate-pulse" />
                  <span>Mesh Hop Packet Propagation</span>
                </div>
                <div className="routing-body">
                  {chatRoutingLogs.map((log, idx) => (
                    <div key={idx} className="routing-log-line">{log}</div>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              placeholder={isChatRouting ? "Hop routing packet active..." : "Type text message..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              disabled={isChatRouting}
              className="chat-field"
            />
            <button 
              onClick={handleSimulateVoice} 
              disabled={isChatRouting || isRecording}
              className={`chat-action-btn voice ${isRecording ? 'recording' : ''}`}
              title="Record and Broadcast Voice note via mesh"
            >
              <Mic size={14} className={isRecording ? 'animate-pulse' : ''} />
            </button>
            <button 
              onClick={handleSendText} 
              disabled={isChatRouting || !inputText.trim()}
              className="chat-action-btn send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitReport} className="emergency-report-form">
          <h4 className="form-title">Emergency Broadcast Form</h4>
          
          <div className="form-group-mini">
            <label>REPORT CLASSIFICATION</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value as any)}
              className="input-select"
            >
              <option value="landslide">⚠️ Landslide Slip Blockage</option>
              <option value="flood">🌊 Flood Expansion Zone</option>
              <option value="roadblock">⛔ Evacuation Road Blockage</option>
              <option value="missing">👥 Missing Persons Report</option>
            </select>
          </div>

          <div className="form-group-mini">
            <label>EVENT TITLE</label>
            <input 
              type="text" 
              placeholder="e.g., Landslide NH-107 Rambara East Bypass"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              required
              className="input-text-field"
            />
          </div>

          <div className="form-group-mini">
            <label>DETAILED DESCRIPTION</label>
            <textarea 
              placeholder="Describe scale, safety impacts, and blocking details..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              required
              className="input-textarea-field"
              rows={3}
            />
          </div>

          <div className="lat-lng-row">
            <div className="form-group-mini">
              <label>LATITUDE</label>
              <input 
                type="text" 
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                required
                className="input-text-field coordinate"
              />
            </div>
            <div className="form-group-mini">
              <label>LONGITUDE</label>
              <input 
                type="text" 
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                required
                className="input-text-field coordinate"
              />
            </div>
          </div>

          <button type="submit" className="submit-emergency-btn">
            <AlertTriangle size={13} />
            <span>TRANSMIT MESH EMERGENCY ALERT</span>
          </button>
        </form>
      )}
    </div>
  );
};
