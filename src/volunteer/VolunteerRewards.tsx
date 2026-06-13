import React from 'react';
import { Award, ShieldAlert, AwardOff, AwardIcon, Compass, ShieldCheck, HeartPulse, Zap } from 'lucide-react';
import { getResponderTitle } from './MissionSystem';

interface VolunteerRewardsProps {
  points: number;
  completedCount: number;
  rescuePoints: number;
  medicalPoints: number;
  deliveryPoints: number;
}

export const VolunteerRewards: React.FC<VolunteerRewardsProps> = ({
  points,
  completedCount,
  rescuePoints,
  medicalPoints,
  deliveryPoints
}) => {
  const currentTitle = getResponderTitle(points);

  // Determine next milestone
  let nextTitle = 'Silver Responder';
  let nextLimit = 100;
  if (points >= 500) {
    nextTitle = 'Max Level';
    nextLimit = 500;
  } else if (points >= 250) {
    nextTitle = 'Disaster Hero';
    nextLimit = 500;
  } else if (points >= 100) {
    nextTitle = 'Gold Responder';
    nextLimit = 250;
  }

  const progressPercent = Math.min(100, Math.round((points / nextLimit) * 100));

  const getTitleBadgeClass = (title: string) => {
    switch (title) {
      case 'Disaster Hero':
        return 'badge-hero';
      case 'Gold Responder':
        return 'badge-gold';
      case 'Silver Responder':
        return 'badge-silver';
      default:
        return 'badge-bronze';
    }
  };

  return (
    <div className="volunteer-rewards-panel animate-fade-in">
      {/* Level Header Card */}
      <div className="rewards-summary-card">
        <div className="medal-glow-container">
          <Award className={`rewards-medal ${getTitleBadgeClass(currentTitle)}`} size={48} />
        </div>
        <div className="rewards-title-info">
          <span className="rewards-title-label">RESPONDER STANDING</span>
          <h2 className="current-title-text">{currentTitle}</h2>
          <span className="points-tally">{points} Tactical Points</span>
        </div>
      </div>

      {/* Progress Bar to next Milestone */}
      {nextTitle !== 'Max Level' && (
        <div className="rewards-progress-section">
          <div className="progress-labels">
            <span>Next Milestone: <strong>{nextTitle}</strong></span>
            <span>{points} / {nextLimit} XP</span>
          </div>
          <div className="custom-progress-track">
            <div 
              className="custom-progress-bar" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Points breakdown details */}
      <div className="points-categories-grid">
        <div className="category-card rescue">
          <div className="card-top">
            <ShieldCheck size={18} />
            <span>Rescue Ops</span>
          </div>
          <span className="card-val">+{rescuePoints} XP</span>
          <span className="card-lbl">50 XP per safe evac</span>
        </div>

        <div className="category-card medical">
          <div className="card-top">
            <HeartPulse size={18} />
            <span>First Aid Assist</span>
          </div>
          <span className="card-val">+{medicalPoints} XP</span>
          <span className="card-lbl">20 XP per trauma care</span>
        </div>

        <div className="category-card delivery">
          <div className="card-top">
            <Zap size={18} />
            <span>Supply Drops</span>
          </div>
          <span className="card-val">+{deliveryPoints} XP</span>
          <span className="card-lbl">10 XP per resource drop</span>
        </div>
      </div>

      {/* Responder Badges Showcase */}
      <div className="badges-showcase">
        <h4 className="showcase-title">UNLOCKED BADGES</h4>
        <div className="badges-list">
          <div className={`badge-show-item ${points >= 0 ? 'unlocked' : 'locked'}`}>
            <Award className="badge-icon badge-bronze" size={24} />
            <div className="badge-details">
              <span className="badge-name">Bronze Responder</span>
              <span className="badge-desc">Registered and ready for mesh-based disaster support.</span>
            </div>
          </div>

          <div className={`badge-show-item ${points >= 100 ? 'unlocked' : 'locked'}`}>
            <Award className="badge-icon badge-silver" size={24} />
            <div className="badge-details">
              <span className="badge-name">Silver Responder</span>
              <span className="badge-desc">Unlocked at 100 XP. Demonstrated competence in multi-hop rescue.</span>
            </div>
          </div>

          <div className={`badge-show-item ${points >= 250 ? 'unlocked' : 'locked'}`}>
            <Award className="badge-icon badge-gold" size={24} />
            <div className="badge-details">
              <span className="badge-name">Gold Responder</span>
              <span className="badge-desc">Unlocked at 250 XP. Field-verified leader in high-altitude triage.</span>
            </div>
          </div>

          <div className={`badge-show-item ${points >= 500 ? 'unlocked' : 'locked'}`}>
            <Award className="badge-icon badge-hero" size={24} />
            <div className="badge-details">
              <span className="badge-name">Disaster Hero</span>
              <span className="badge-desc">Unlocked at 500 XP. Outstanding service in emergency route clearing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
