import { useTextSize } from '../utils/TextSizeContext';

// Compact text-size selector — three "A" buttons of increasing size.
// The active button is highlighted with a blue ring. Fits neatly in a toolbar row.
function TextSizeSelector() {
  const { size, setSize, sizes } = useTextSize();

  const sizeKeys = Object.keys(sizes);

  return (
    <div style={selectorStyles.row}>
      <span style={selectorStyles.label}>Aa</span>
      <div style={selectorStyles.group}>
        {sizeKeys.map((key) => {
          const isActive = size === key;
          // Font size that visually distinguishes the three buttons
          const displaySize = key === 'small' ? '0.72rem' : key === 'medium' ? '0.92rem' : '1.14rem';

          return (
            <button
              key={key}
              onClick={() => setSize(key)}
              aria-label={`Text size: ${key}`}
              style={{
                ...selectorStyles.btn,
                ...(isActive ? selectorStyles.btnActive : {}),
                fontSize: displaySize,
              }}
            >
              A
            </button>
          );
        })}
      </div>
    </div>
  );
}

const selectorStyles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#9ca3af',
    userSelect: 'none',
  },
  group: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f3f4f6',
    borderRadius: '10px',
    padding: '3px',
  },
  btn: {
    width: '32px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    lineHeight: 1,
  },
  btnActive: {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 0 0 1.5px rgba(37,99,235,0.25)',
  },
};

export default TextSizeSelector;
