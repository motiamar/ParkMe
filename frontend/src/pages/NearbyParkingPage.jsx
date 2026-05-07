function NearbyParkingPage({ onNavigate }) {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Nearby parking results will appear here.</p>
      <button style={styles.back} onClick={() => onNavigate('landing')}>
        Back
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
  text: {
    fontSize: '1.2rem',
    color: '#333',
  },
  back: {
    padding: '10px 24px',
    fontSize: '1rem',
    cursor: 'pointer',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
  },
};

export default NearbyParkingPage;
