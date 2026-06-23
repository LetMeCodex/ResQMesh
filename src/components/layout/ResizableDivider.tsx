import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResizableDividerProps {
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  ariaValuemin?: number;
  ariaValuemax?: number;
  ariaValuenow?: number;
}

export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  isDragging,
  onPointerDown,
  onKeyDown,
  ariaValuemin,
  ariaValuemax,
  ariaValuenow
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize command center and map panels"
      aria-valuemin={ariaValuemin}
      aria-valuemax={ariaValuemax}
      aria-valuenow={ariaValuenow}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative z-40 select-none cursor-col-resize focus:outline-none"
      style={{
        width: '12px',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      {/* Visual Divider Vertical Line */}
      <motion.div
        className="absolute h-full w-[2px] transition-colors"
        animate={{
          backgroundColor: isDragging
            ? '#5B8DEF' // var(--color-rescue-blue)
            : isHovered
            ? 'rgba(91, 141, 239, 0.8)'
            : 'rgba(0, 0, 0, 0.08)', // matching var(--color-border)
          boxShadow: isDragging || isHovered
            ? '0 0 8px rgba(91, 141, 239, 0.6)'
            : 'none',
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Focus Ring Indicator */}
      <div className="absolute inset-0 pointer-events-none rounded opacity-0 focus-within:opacity-100 focus-within:ring-2 focus-within:ring-blue-500/50" />

      {/* Draggable Handle */}
      <motion.div
        layout
        className="z-50 flex items-center justify-center rounded-full border bg-white shadow-lg cursor-col-resize select-none"
        style={{
          width: '36px',
          height: '36px',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDragging
            ? '0 0 14px rgba(91, 141, 239, 0.4), 0 4px 10px rgba(0,0,0,0.1)'
            : isHovered
            ? '0 0 8px rgba(91, 141, 239, 0.2), 0 2px 6px rgba(0,0,0,0.08)'
            : '0 2px 4px rgba(0,0,0,0.06)',
        }}
        animate={{
          scale: isDragging ? 1.15 : isHovered ? 1.08 : 1,
          borderColor: isDragging || isHovered ? '#5B8DEF' : 'rgba(0, 0, 0, 0.08)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Tactical double arrow chevron design (← || →) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: isDragging || isHovered ? '#5B8DEF' : 'rgba(0, 0, 0, 0.4)', transition: 'color 0.15s' }}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ width: '1.5px', height: '10px', backgroundColor: 'currentColor', opacity: 0.5, borderRadius: '1px' }} />
          <div style={{ width: '1.5px', height: '10px', backgroundColor: 'currentColor', opacity: 0.5, borderRadius: '1px' }} />
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </motion.div>

      {/* Drag tooltip */}
      <AnimatePresence>
        {isHovered && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute z-50 pointer-events-none px-2.5 py-1 text-[10px] font-medium tracking-wide text-white bg-slate-900/90 backdrop-blur rounded shadow-md whitespace-nowrap"
            style={{
              top: 'calc(50% + 28px)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.2px',
            }}
          >
            Drag to resize
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
