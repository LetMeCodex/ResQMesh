import { useState, useEffect, useRef, useCallback } from 'react';

interface UseResizablePanelsProps {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  mapMinWidth?: number;
  localStorageKey?: string;
  phoneVisible?: boolean;
  phoneWidth?: number;
  onResize?: () => void;
}

export function useResizablePanels({
  initialWidth = 460,
  minWidth = 340,
  maxWidth = 720,
  mapMinWidth = 480,
  localStorageKey = 'resqmesh-command-panel-width',
  phoneVisible = true,
  phoneWidth = 400,
  onResize
}: UseResizablePanelsProps = {}) {
  // Load saved width from localStorage
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    }
    return initialWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const resizeRafRef = useRef<number | null>(null);

  const widthRef = useRef(width);
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  // Calculate dynamic maximum width for Command Centre to keep Map at least mapMinWidth
  const getDynamicMaxWidth = useCallback(() => {
    if (typeof window === 'undefined') return maxWidth;
    
    const totalW = window.innerWidth;
    
    // Measure actual phone width if ref is available, fallback to default prop
    let currentPhoneW = 0;
    if (phoneVisible) {
      if (phoneRef.current) {
        currentPhoneW = phoneRef.current.getBoundingClientRect().width;
      } else {
        currentPhoneW = phoneWidth;
      }
    }

    const dividerW = 12; // visual/hitbox divider width allocation
    const calculatedMax = totalW - currentPhoneW - mapMinWidth - dividerW;
    
    return Math.max(minWidth, Math.min(maxWidth, calculatedMax));
  }, [minWidth, maxWidth, mapMinWidth, phoneVisible, phoneWidth]);

  // Clamp width function
  const clampWidth = useCallback((val: number) => {
    const minW = minWidth;
    const maxW = getDynamicMaxWidth();
    return Math.min(Math.max(val, minW), maxW);
  }, [minWidth, getDynamicMaxWidth]);

  // Adjust width on window resize to ensure constraints are respected
  useEffect(() => {
    const handleWindowResize = () => {
      setWidth(prev => clampWidth(prev));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [clampWidth]);

  // Handle pointer down (drag start)
  const startDrag = useCallback((e: React.PointerEvent) => {
    // Disable text selection and drag default behaviors
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = widthRef.current;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = startWidth + deltaX;
      const constrainedWidth = clampWidth(newWidth);
      
      setWidth(constrainedWidth);
      localStorage.setItem(localStorageKey, String(constrainedWidth));

      // Trigger map invalidate size inside requestAnimationFrame
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        if (onResize) onResize();
      });
    };

    const handlePointerUp = () => {
      // Restore styles
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setIsDragging(false);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      // Final resize sync
      window.dispatchEvent(new Event('resize'));
      if (onResize) onResize();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [clampWidth, localStorageKey, onResize]);

  // Keyboard navigation support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let nextWidth: number | null = null;
    
    if (e.key === 'ArrowLeft') {
      nextWidth = clampWidth(width - 20);
    } else if (e.key === 'ArrowRight') {
      nextWidth = clampWidth(width + 20);
    } else if (e.key === 'Home') {
      nextWidth = minWidth;
    } else if (e.key === 'End') {
      nextWidth = getDynamicMaxWidth();
    }

    if (nextWidth !== null) {
      e.preventDefault();
      setWidth(nextWidth);
      localStorage.setItem(localStorageKey, String(nextWidth));
      
      // Trigger map resize callbacks
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (onResize) onResize();
      }, 0);
    }
  }, [width, minWidth, getDynamicMaxWidth, clampWidth, localStorageKey, onResize]);

  // Cleanup requestAnimationFrame
  useEffect(() => {
    return () => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);

  return {
    width,
    isDragging,
    sidebarRef,
    phoneRef,
    startDrag,
    handleKeyDown,
    minWidth,
    maxWidth: getDynamicMaxWidth()
  };
}
