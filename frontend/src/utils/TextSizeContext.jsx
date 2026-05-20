import { createContext, useContext, useState, useEffect } from 'react';

// Three size presets — the value is the multiplier applied to the root font-size
// via the --text-scale CSS custom property.
// Small = 0.85x, Medium = 1x (browser default), Large = 1.2x
const TEXT_SIZES = {
  small:  { label: 'A',  scale: 0.85 },
  medium: { label: 'A',  scale: 1    },
  large:  { label: 'A',  scale: 1.2  },
};

const STORAGE_KEY = 'parkme-text-size';

const TextSizeContext = createContext();

// Provider component — wraps the app and manages the text size state.
// On mount, reads the saved preference from localStorage (falls back to 'medium').
// Every time the size changes, it writes to localStorage AND updates the root
// element's font-size so every rem-based size in the app scales immediately.
function TextSizeProvider({ children }) {
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && TEXT_SIZES[saved] ? saved : 'medium';
    } catch {
      return 'medium';
    }
  });

  // Apply the scale to <html> root font-size whenever size changes.
  // This makes all `rem`-based values scale automatically.
  // Also persists to localStorage for next session.
  useEffect(() => {
    const scale = TEXT_SIZES[size].scale;
    document.documentElement.style.setProperty('--text-scale', scale);
    document.documentElement.style.fontSize = `${scale * 100}%`;
    try { localStorage.setItem(STORAGE_KEY, size); } catch { /* quota exceeded — ignore */ }
  }, [size]);

  return (
    <TextSizeContext.Provider value={{ size, setSize, sizes: TEXT_SIZES }}>
      {children}
    </TextSizeContext.Provider>
  );
}

// Hook for child components to read/change the text size
function useTextSize() {
  const ctx = useContext(TextSizeContext);
  if (!ctx) throw new Error('useTextSize must be used inside <TextSizeProvider>');
  return ctx;
}

export { TextSizeProvider, useTextSize, TEXT_SIZES };
