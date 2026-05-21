import TextSizeSelector from '../../pages/TextSizeSelector';
import { styles } from './nearbyStyles';

// Side panel that slides in from the left when the gear button is clicked.
// Renders nothing when isOpen is false so it has zero cost when closed.
function SettingsPanel({ isOpen, onClose, language, onToggleLanguage, t }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — clicking it closes the panel */}
      <div style={styles.settingsBackdrop} onClick={onClose} />

      <div style={styles.settingsPanel}>
        <div style={styles.settingsPanelHeader}>
          <span style={styles.settingsPanelTitle}>
            {language === 'he' ? 'הגדרות' : 'Settings'}
          </span>
          <button
            style={styles.settingsCloseBtn}
            onClick={onClose}
            aria-label={language === 'he' ? 'סגור' : 'Close'}
          >
            ✕
          </button>
        </div>

        {/* Language section */}
        <div style={styles.settingsSection}>
          <p style={styles.settingsSectionLabel}>
            {language === 'he' ? 'שפה' : 'Language'}
          </p>
          <div style={styles.settingsBtnGroup}>
            <button
              style={language === 'he' ? styles.settingsBtnActive : styles.settingsBtn}
              onClick={() => { if (language !== 'he') onToggleLanguage(); }}
            >
              עברית
            </button>
            <button
              style={language === 'en' ? styles.settingsBtnActive : styles.settingsBtn}
              onClick={() => { if (language !== 'en') onToggleLanguage(); }}
            >
              English
            </button>
          </div>
        </div>

        {/* Text size section */}
        <div style={styles.settingsSection}>
          <p style={styles.settingsSectionLabel}>
            {language === 'he' ? 'גודל טקסט' : 'Text Size'}
          </p>
          <TextSizeSelector labels={t.textSize} />
        </div>
      </div>
    </>
  );
}

export default SettingsPanel;
