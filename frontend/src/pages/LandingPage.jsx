function LandingPage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ParkMe</h1>
      <p style={styles.description}>Smart parking finder app</p>
      <button style={styles.button} onClick={() => onNavigate('nearby')}>
        Find Nearby Parking
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '24px',
  },
  title: {
    fontSize: '3rem',
    margin: 0,
  },
  description: {
    fontSize: '1.2rem',
    color: '#555',
    margin: 0,
  },
  button: {
    padding: '14px 32px',
    fontSize: '1rem',
    cursor: 'pointer',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#fff',
  },
};

export default LandingPage;
