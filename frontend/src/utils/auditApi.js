const AUDIT_BASE = `${import.meta.env.VITE_API_URL}/api/auditlogs`;

// Fire-and-forget — audit failures must never break the user flow.
export async function postAuditLog(userId, actionType, entityType, entityId, description) {
  try {
    await fetch(AUDIT_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actionType, entityType, entityId, description }),
    });
  } catch {
    // intentionally swallowed
  }
}

export async function fetchAuditLogs() {
  const res = await fetch(AUDIT_BASE);
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.status}`);
  return res.json();
}
