import { useState, useRef } from 'react';

// The two snap positions (% of viewport height from the top).
// PEEK = most of the map visible; HALF = panel covers most of the screen.
const SNAP_PEEK = 62;
const SNAP_HALF = 15;

// Encapsulates all draggable-panel logic so the page component stays clean.
// Returns the current panel position and the three pointer-event handlers that
// should be attached to the drag-handle element.
export function useDraggablePanel() {
  const [panelTop, setPanelTop] = useState(SNAP_PEEK);
  const [isDragging, setIsDragging] = useState(false);

  // dragRef holds mutable drag state that must NOT trigger re-renders on change.
  const dragRef = useRef({ active: false, startY: 0, startTop: SNAP_PEEK });

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startY: e.clientY, startTop: panelTop };
    setIsDragging(true);
  }

  function handlePointerMove(e) {
    if (!dragRef.current.active) return;
    const deltaVh = ((e.clientY - dragRef.current.startY) / window.innerHeight) * 100;
    const newTop = Math.max(8, Math.min(86, dragRef.current.startTop + deltaVh));
    setPanelTop(newTop);
  }

  function handlePointerUp() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    // Snap to the nearest position on release
    const mid = (SNAP_PEEK + SNAP_HALF) / 2;
    setPanelTop(prev => (prev < mid ? SNAP_HALF : SNAP_PEEK));
  }

  return { panelTop, isDragging, handlePointerDown, handlePointerMove, handlePointerUp };
}
