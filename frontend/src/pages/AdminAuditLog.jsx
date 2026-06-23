import { useEffect, useState } from 'react';
import { fetchAuditLogs } from '../utils/auditApi';

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function shortId(id) {
  if (!id) return '—';
  return id.length > 12 ? id.slice(0, 12) + '…' : id;
}

function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAuditLogs()
      .then(setLogs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Audit Log</h1>

        {loading && <p style={styles.status}>Loading...</p>}
        {error   && <p style={{ ...styles.status, color: '#dc2626' }}>Error: {error}</p>}
        {!loading && !error && logs.length === 0 && (
          <p style={styles.status}>No audit log entries yet.</p>
        )}

        {!loading && !error && logs.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Timestamp', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'Description'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>{formatTimestamp(log.timestamp)}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.8rem' }} title={log.userId}>{shortId(log.userId)}</td>
                    <td style={{ ...styles.td, fontWeight: '600', color: actionColor(log.actionType) }}>{log.actionType}</td>
                    <td style={styles.td}>{log.entityType}</td>
                    <td style={styles.td}>{log.entityId ?? '—'}</td>
                    <td style={{ ...styles.td, color: '#6b7280' }}>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function actionColor(action) {
  switch (action) {
    case 'ADD_FAVORITE':       return '#16a34a';
    case 'REMOVE_FAVORITE':    return '#dc2626';
    case 'SEARCH_LOCATION':    return '#2563eb';
    case 'NAVIGATE_TO_PARKING': return '#d97706';
    default:                   return '#374151';
  }
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '24px 16px',
  },
  container: {
    maxWidth: 1000,
    margin: '0 auto',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },
  status: {
    color: '#6b7280',
    fontSize: '1rem',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    fontWeight: '600',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '11px 14px',
    color: '#111827',
    verticalAlign: 'top',
  },
};

export default AdminAuditLog;
