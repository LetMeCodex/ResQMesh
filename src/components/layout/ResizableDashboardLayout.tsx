import React from 'react';

interface ResizableDashboardLayoutProps {
  children: React.ReactNode;
  isMobileStacked: boolean;
  className?: string;
}

export const ResizableDashboardLayout: React.FC<ResizableDashboardLayoutProps> = ({
  children,
  isMobileStacked,
  className = ''
}) => {
  return (
    <div
      className={`app-container ${isMobileStacked ? 'stacked-layout' : ''} ${className}`}
      style={{
        display: isMobileStacked ? 'flex' : 'grid',
        flexDirection: isMobileStacked ? 'column' : 'row',
        // Grid columns structure:
        // Col 1: Phone simulator (auto-sized/collapsible)
        // Col 2: Command center sidebar (auto-sized, width controlled by react state)
        // Col 3: Resizable vertical divider line (auto-sized, 12px)
        // Col 4: Interactive map panel (1fr - fills remaining viewport space)
        gridTemplateColumns: isMobileStacked ? undefined : 'auto auto auto 1fr',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};
export default ResizableDashboardLayout;
