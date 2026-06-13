import React from 'react';
import { 
  Activity, 
  Heart, 
  Radio, 
  Shield, 
  Wifi, 
  Zap, 
  X,
  RotateCcw
} from 'lucide-react';
import { ReplayAnalyticsData } from './ReplayEngine';

interface ReplayAnalyticsProps {
  analytics: ReplayAnalyticsData;
  onClose: () => void;
  onRestart: () => void;
}

export const ReplayAnalytics: React.FC<ReplayAnalyticsProps> = ({
  analytics,
  onClose,
  onRestart
}) => {
  return (
    <div className="replay-analytics-overlay">
      <div className="replay-analytics-card">
        {/* Header */}
        <div className="analytics-header">
          <div className="header-title-container">
            <Activity className="animate-pulse" style={{ color: 'var(--color-emergency-red)' }} />
            <h3>Post-Replay Disaster Analytics</h3>
          </div>
          <button className="close-btn" onClick={onClose} title="Close Analytics">
            <X size={16} />
          </button>
        </div>

        <p className="analytics-intro">
          Tactical performance diagnostics compiled from the recorded timeline.
        </p>

        {/* Metrics Grid */}
        <div className="analytics-grid">
          {/* Card 1: Total SOS */}
          <div className="metric-box border-red">
            <div className="metric-top">
              <span className="metric-label">Total SOS Broadcasts</span>
              <Shield size={16} style={{ color: 'var(--color-emergency-red)' }} />
            </div>
            <div className="metric-val">{analytics.totalSos}</div>
            <span className="metric-hint">Emergency alerts received</span>
          </div>

          {/* Card 2: Average Response Time */}
          <div className="metric-box border-orange">
            <div className="metric-top">
              <span className="metric-label">Avg Response Time</span>
              <Zap size={16} style={{ color: 'var(--color-warning-orange)' }} />
            </div>
            <div className="metric-val">{analytics.averageResponseMinutes}m</div>
            <span className="metric-hint">From SOS to volunteer dispatch</span>
          </div>

          {/* Card 3: Max Mesh Hops */}
          <div className="metric-box border-purple">
            <div className="metric-top">
              <span className="metric-label">Max Network Hops</span>
              <Radio size={16} style={{ color: 'var(--color-lora-purple)' }} />
            </div>
            <div className="metric-val">{analytics.maxHops}</div>
            <span className="metric-hint">Largest relay route hop count</span>
          </div>

          {/* Card 4: Rescues Completed */}
          <div className="metric-box border-green">
            <div className="metric-top">
              <span className="metric-label">Rescues Completed</span>
              <Heart size={16} style={{ color: 'var(--color-safety-green)' }} />
            </div>
            <div className="metric-val">{analytics.rescuesCompleted}</div>
            <span className="metric-hint">Survivors safely evacuated</span>
          </div>

          {/* Card 5: Resources Delivered */}
          <div className="metric-box border-blue">
            <div className="metric-top">
              <span className="metric-label">Resources Delivered</span>
              <Zap size={16} style={{ color: 'var(--color-rescue-blue)' }} />
            </div>
            <div className="metric-val">{analytics.resourcesDelivered}</div>
            <span className="metric-hint">UAV packages and medical drops</span>
          </div>

          {/* Card 6: Network Uptime */}
          <div className="metric-box border-slate">
            <div className="metric-top">
              <span className="metric-label">Network Uptime</span>
              <Wifi size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div className="metric-val">{analytics.networkUptimePercent}%</div>
            <span className="metric-hint">Cellular infrastructure uptime</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="analytics-footer">
          <button className="restart-btn" onClick={onRestart}>
            <RotateCcw size={13} />
            <span>Replay Again</span>
          </button>
          <button className="exit-btn" onClick={onClose}>
            <span>Exit to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
