import TextSizeSelector from '../../pages/TextSizeSelector';
import { styles } from './nearbyStyles';

// Side panel that slides in from the left when the gear button is clicked.
// Renders nothing when isOpen is false so it has zero cost when closed.
function SettingsPanel({ isOpen, onClose, language, onToggleLanguage, t, canInstall, onInstall }) {
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

        {/* Install App section — only shown when the browser supports PWA install */}
        {canInstall && (
          <div style={styles.settingsSection}>
            <p style={styles.settingsSectionLabel}>
              {language === 'he' ? 'אפליקציה' : 'App'}
            </p>
            <button style={styles.settingsInstallBtn} onClick={onInstall}>
              {t.settings.installApp}
            </button>
            <p style={styles.settingsInstallHint}>{t.settings.installAppHint}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default SettingsPanel;
