// All inline styles for the NearbyParkingPage feature area.
// Extracted here so each component file stays focused on structure and behaviour.
export const styles = {

  screen: {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    backgroundColor: '#e0e7ff',
  },

  mapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  mapActionDock: {
    position: 'absolute',
    right: '12px',
    zIndex: 1060,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    pointerEvents: 'none',
  },

  mapActionBtn: {
    pointerEvents: 'auto',
    width: '38px',
    height: '38px',
    border: '1px solid rgba(37,99,235,0.18)',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    boxShadow: '0 2px 10px rgba(15,23,42,0.12)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  mapActionIcon: {
    fontSize: '1rem',
    lineHeight: 1,
  },

  mapNotice: {
    pointerEvents: 'none',
    maxWidth: '210px',
    padding: '8px 10px',
    borderRadius: '10px',
    backgroundColor: 'rgba(17,24,39,0.92)',
    color: '#ffffff',
    fontSize: '0.82rem',
    lineHeight: 1.35,
    boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
  },

  noMapFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },

  noLocationText: {
    fontSize: '0.9rem',
    color: '#60a5fa',
  },

  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderRadius: '24px 24px 0 0',
    boxShadow: '0 -6px 24px rgba(0,0,0,0.13)',
    boxSizing: 'border-box',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  panelStickyHeader: {
    flexShrink: 0,
    padding: '10px 16px 0',
  },

  panelScrollable: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 32px',
  },

  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    margin: '0 auto 14px',
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
  },

  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },

  panelTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },

  sortRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px',
  },

  sortBtn: {
    flex: 1,
    padding: '8px 0',
    border: '1px solid #e5e7eb',
    borderRadius: '999px',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    fontSize: '0.88rem',
    fontWeight: '500',
    cursor: 'pointer',
  },

  sortBtnActive: {
    flex: 1,
    padding: '8px 0',
    border: '1.5px solid #2563eb',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(37,99,235,0.10)',
  },

  statusText: {
    fontSize: '0.95rem',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '24px',
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    marginTop: '16px',
  },

  errorText: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 6px 0',
  },

  errorDetail: {
    fontSize: '0.82rem',
    color: '#ef4444',
    margin: '3px 0 0 0',
  },

  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #f3f4f6',
    borderRadius: '14px',
    padding: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },

  lotName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    flex: 1,
  },

  lotPrice: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#2563eb',
    margin: 0,
    whiteSpace: 'nowrap',
  },

  lotAddress: {
    fontSize: '0.85rem',
    color: '#6b7280',
    margin: 0,
  },

  cardBottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '4px',
  },

  distanceText: {
    fontSize: '0.82rem',
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },

  etaText: {
    fontSize: '0.82rem',
    color: '#6b7280',
    marginTop: '2px',
  },

  badge: {
    fontSize: '0.78rem',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '999px',
  },

  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.3rem',
    color: '#f59e0b',
    padding: '0 2px',
    lineHeight: 1,
    flexShrink: 0,
  },

  searchBarWrapper: {
    position: 'absolute',
    top: '12px',
    left: '62px',
    right: '12px',
    zIndex: 1050,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,0.12)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
    overflow: 'hidden',
    height: '40px',
  },

  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.9rem',
    color: '#111827',
    padding: '0 8px',
    minWidth: 0,
  },

  searchSubmitBtn: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  searchClearBtn: {
    flexShrink: 0,
    width: '36px',
    height: '36px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: '#9ca3af',
    padding: 0,
  },

  searchError: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#dc2626',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: '8px',
    padding: '4px 10px',
    alignSelf: 'flex-start',
    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
  },

  gearBtn: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    zIndex: 1100,
    width: '40px',
    height: '40px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  settingsBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
    zIndex: 1200,
  },

  settingsPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '260px',
    maxWidth: '80vw',
    backgroundColor: '#ffffff',
    zIndex: 1300,
    boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
    padding: '20px 16px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },

  settingsPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  settingsPanelTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#111827',
  },

  settingsCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#6b7280',
    padding: '4px',
    lineHeight: 1,
    borderRadius: '6px',
  },

  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  settingsSectionLabel: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },

  settingsBtnGroup: {
    display: 'flex',
    gap: '8px',
  },

  settingsBtn: {
    flex: 1,
    padding: '9px 0',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },

  settingsBtnActive: {
    flex: 1,
    padding: '9px 0',
    border: '1.5px solid #2563eb',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(37,99,235,0.12)',
  },
};
