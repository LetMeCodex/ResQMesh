import React from 'react';
import { Play, Pause, Square, Zap, Clock, ShieldAlert } from 'lucide-react';
import { ReplayEvent } from './ReplayEngine';

interface ReplayControlsProps {
  events: ReplayEvent[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  isReplayMode: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSetSpeed: (speed: number) => void;
  onScrub: (index: number) => void;
  onToggleReplayMode: () => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  events,
  currentIndex,
  isPlaying,
  speed,
  isReplayMode,
  onPlay,
  onPause,
  onStop,
  onSetSpeed,
  onScrub,
  onToggleReplayMode,
}) => {
  const currentEvent = events[currentIndex];

  return (
    <div className="replay-controls-hud">
      {/* HUD Header / Mode Indicator */}
      <div className="hud-header">
        <div className="mode-badge-container">
          <button 
            className={`mode-toggle-btn ${isReplayMode ? 'active-replay' : 'active-live'}`}
            onClick={onToggleReplayMode}
          >
            <Clock size={13} />
            <span>{isReplayMode ? 'REPLAY MODE' : 'LIVE DASHBOARD'}</span>
          </button>
        </div>

        {isReplayMode && currentEvent && (
          <div className="hud-current-event-info">
            <span className="event-time">[{currentEvent.timestamp}]</span>
            <span className="event-title-highlight">{currentEvent.title}</span>
          </div>
        )}
      </div>

      {isReplayMode && (
        <div className="hud-body animate-fade-in">
          {/* Timeline Scrubber */}
          <div className="scrubber-container">
            <span className="time-index">01</span>
            <input
              type="range"
              min={0}
              max={events.length - 1}
              value={currentIndex}
              onChange={(e) => onScrub(Number(e.target.value))}
              className="timeline-scrubber"
            />
            <span className="time-index">
              {String(events.length).padStart(2, '0')}
            </span>
          </div>

          {/* Action Row */}
          <div className="controls-action-row">
            {/* Playback Controls */}
            <div className="playback-buttons">
              {isPlaying ? (
                <button className="hud-btn pause" onClick={onPause} title="Pause Replay">
                  <Pause size={14} fill="currentColor" />
                </button>
              ) : (
                <button 
                  className="hud-btn play" 
                  onClick={onPlay} 
                  title="Play Replay"
                  disabled={events.length === 0}
                >
                  <Play size={14} fill="currentColor" />
                </button>
              )}
              
              <button 
                className="hud-btn stop" 
                onClick={onStop} 
                title="Stop & Reset"
                disabled={events.length === 0}
              >
                <Square size={12} fill="currentColor" />
              </button>
            </div>

            {/* Event Counter Text */}
            <div className="hud-event-counter">
              <span>Event {currentIndex + 1} of {events.length}</span>
            </div>

            {/* Replay Speed Selection */}
            <div className="speed-selectors">
              {[1, 2, 5].map((multiplier) => (
                <button
                  key={multiplier}
                  className={`speed-btn ${speed === multiplier ? 'active' : ''}`}
                  onClick={() => onSetSpeed(multiplier)}
                >
                  {multiplier}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
