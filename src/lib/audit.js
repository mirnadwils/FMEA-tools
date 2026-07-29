import { query } from './db';

/**
 * Write an audit log entry.
 * All significant actions (submit, reopen, upload, role changes) are recorded.
 * @param {{ actorUserId: string, sessionId: number|null, action: string, entityType: string, entityId: string|number|null, metadata: Object }} event
 */
export async function writeAuditLog({ actorUserId, sessionId, action, entityType, entityId, metadata }) {
  await query(
    `INSERT INTO audit_logs (actor_user_id, session_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      actorUserId,
      sessionId || null,
      action,
      entityType || null,
      entityId ? String(entityId) : null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

/**
 * Get audit log entries for a session.
 */
export async function getAuditLogs(sessionId, limit = 100) {
  return query(
    `SELECT al.*, u.display_name as actor_name
     FROM audit_logs al
     LEFT JOIN users u ON al.actor_user_id = u.clerk_user_id
     WHERE al.session_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2`,
    [sessionId, limit]
  );
}
