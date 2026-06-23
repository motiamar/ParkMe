import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5176/api/devlogs';

function DevLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadLogs() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Could not load developer logs.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadLogs();

    return () => controller.abort();
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Developer Logs</h1>
        <p style={styles.subtitle}>Technical API request log</p>

        {loading ? <p style={styles.message}>Loading logs...</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}

        {!loading && !error ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Endpoint</th>
                  <th style={styles.th}>Status Code</th>
                  <th style={styles.th}>Duration MS</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td style={styles.emptyCell} colSpan={4}>No logs yet.</td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const isError = log.statusCode >= 400;

                    return (
                      <tr key={`${log.timestamp}-${log.endpoint}-${index}`} style={isError ? styles.errorRow : undefined}>
                        <td style={styles.td}>{formatTime(log.timestamp)}</td>
                        <td style={styles.td}>{log.endpoint}</td>
                        <td style={styles.td}>{log.statusCode}</td>
                        <td style={styles.td}>{log.durationMs}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString();
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '24px',
    background: '#f5f5f5',
    color: '#111827',
  },
  card: {
    maxWidth: '1100px',
    margin: '0 auto',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '28px',
  },
  subtitle: {
    margin: '0 0 20px',
    color: '#6b7280',
  },
  message: {
    margin: 0,
  },
  error: {
    margin: 0,
    color: '#b91c1c',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #d1d5db',
    background: '#f9fafb',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'top',
  },
  emptyCell: {
    padding: '16px',
    textAlign: 'center',
    color: '#6b7280',
  },
  errorRow: {
    background: '#fee2e2',
  },
};

export default DevLogsPage;