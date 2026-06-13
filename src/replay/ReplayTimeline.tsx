import React from 'react';
import { 
  AlertTriangle, 
  WifiOff, 
  Radio, 
  UserCheck, 
  Truck, 
  Send, 
  CloudRain, 
  TrendingUp, 
  CheckCircle, 
  MapPin,
  HelpCircle
} from 'lucide-react';
import { ReplayEvent } from './ReplayEngine';

interface ReplayTimelineProps {
  events: ReplayEvent[];
  currentIndex: number;
  onScrub: (index: number) => void;
}

const getEventIcon = (type: ReplayEvent['type']) => {
  switch (type) {
    case 'sos':
      return <AlertTriangle size={13} style={{ color: 'var(--color-critical-red)' }} />;
    case 'network':
      return <WifiOff size={13} style={{ color: 'var(--color-text-muted)' }} />;
    case 'mesh':
      return <Radio size={13} style={{ color: 'var(--color-lora-purple)' }} />;
    case 'assignment':
      return <UserCheck size={13} style={{ color: 'var(--color-lora-purple)' }} />;
    case 'dispatch':
      return <Truck size={13} style={{ color: 'var(--color-rescue-blue)' }} />;
    case 'uav':
      return <Send size={13} style={{ color: 'var(--color-rescue-blue)' }} />;
    case 'weather':
      return <CloudRain size={13} style={{ color: 'var(--color-warning-orange)' }} />;
    case 'flood':
      return <TrendingUp size={13} style={{ color: 'var(--color-critical-red)' }} />;
    case 'landslide':
      return <AlertTriangle size={13} style={{ color: 'var(--color-warning-orange)' }} />;
    case 'rescue':
      return <CheckCircle size={13} style={{ color: 'var(--color-safety-green)' }} />;
    case 'safezone':
      return <MapPin size={13} style={{ color: 'var(--color-safety-green)' }} />;
    default:
      return <HelpCircle size={13} />;
  }
};

export const ReplayTimeline: React.FC<ReplayTimelineProps> = ({
  events,
  currentIndex,
  onScrub
}) => {
  return (
    <div className="replay-timeline-container">
      <div className="timeline-title-row">
        <span>Tactical Timeline Feed</span>
        <span className="event-count-badge">{events.length} logs</span>
      </div>

      <div className="timeline-list">
        {events.map((event, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <div
              key={event.id}
              onClick={() => onScrub(index)}
              className={`timeline-item-row ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
            >
              {/* Left connector lines */}
              <div className="timeline-connector-container">
                <div className="timeline-node">
                  {getEventIcon(event.type)}
                </div>
                {index < events.length - 1 && <div className="timeline-line-link" />}
              </div>

              {/* Event description fields */}
              <div className="timeline-content-card">
                <div className="card-header-row">
                  <span className="card-title-text">{event.title}</span>
                  <span className="card-time-label">[{event.timestamp}]</span>
                </div>
                <p className="card-desc-text">{event.desc}</p>
                {event.lat && event.lng && (
                  <div className="card-coordinates-row">
                    <span>📍 {event.lat.toFixed(4)}, {event.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
