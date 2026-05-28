import { useState, useRef } from 'react';

// The two snap positions (% of viewport height from the top).
// PEEK = most of the map visible; HALF = panel covers most of the screen.
const SNAP_PEEK = 62;
const SNAP_HALF = 15;

// Minimum vertical movement (px) before a touch/pointer is treated as a drag
// rather than a tap. This lets button clicks inside the header work normally.
const DRAG_THRESHOLD_PX = 6;

// Encapsulates all draggable-panel logic so the page component stays clean.
// Returns the current panel position and the three pointer-event handlers that
// should be attached to the sticky header element.
export function useDraggablePanel() {
  const [panelTop, setPanelTop] = useState(SNAP_PEEK);
  const [isDragging, setIsDragging] = useState(false);

  // dragRef holds mutable drag state that must NOT trigger re-renders on change.
  const dragRef = useRef({
    pending: false,   // pointerdown received, waiting to cross threshold
    active: false,    // threshold crossed — drag is live
    startY: 0,
    startTop: SNAP_PEEK,
    pointerId: null,
    element: null,
  });

  function handlePointerDown(e) {
    // Let taps on buttons, inputs, links, etc. pass through untouched.
    if (e.target.closest('button, input, select, a')) return;

    dragRef.current = {
      pending: true,
      active: false,
      startY: e.clientY,
      startTop: panelTop,
      pointerId: e.pointerId,
      element: e.currentTarget,
    };
  }

  function handlePointerMove(e) {
    const drag = dragRef.current;
    if (!drag.pending) return;

    const deltaY = e.clientY - drag.startY;

    if (!drag.active) {
      // Wait until the finger has moved far enough to be unmistakably a drag.
      if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) return;
      drag.active = true;
      // Capture the pointer so moves outside the element still update the panel.
      drag.element.setPointerCapture(drag.pointerId);
      setIsDragging(true);
    }

    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newTop = Math.max(8, Math.min(86, drag.startTop + deltaVh));
    setPanelTop(newTop);
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    if (!drag.pending) return;

    const wasActive = drag.active;
    dragRef.current = { ...drag, pending: false, active: false };

    if (!wasActive) return; // was a tap — no snap needed

    setIsDragging(false);
    // Snap to the nearest position on release
    const mid = (SNAP_PEEK + SNAP_HALF) / 2;
    setPanelTop(prev => (prev < mid ? SNAP_HALF : SNAP_PEEK));
  }

  return { panelTop, isDragging, handlePointerDown, handlePointerMove, handlePointerUp };
}
