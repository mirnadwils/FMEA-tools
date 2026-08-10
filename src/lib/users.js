import { query } from './db';
import { buildMemberProgress } from './member-progress';

/**
 * Sync a Clerk user to the Neon users table.
 * Creates or updates the local user record.
 * @param {{ id: string, emailAddresses: Array, firstName: string, lastName: string, publicMetadata: Object }} clerkUser
 * @returns {Promise<Object>} The upserted user row
 */
export async function upsertUserFromClerk(clerkUser) {
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || email.split('@')[0];
  const appRole = clerkUser.publicMetadata?.appRole || 'participant';

  const rows = await query(
    `INSERT INTO users (clerk_user_id, email, display_name, app_role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_user_id) DO UPDATE
     SET email = $2, display_name = $3, app_role = $4, updated_at = NOW()
     RETURNING *`,
    [clerkUser.id, email, displayName, appRole]
  );

  return rows[0];
}

/**
 * Get a user profile by Clerk user ID.
 */
export async function getUserByClerkId(clerkUserId) {
  const rows = await query(
    'SELECT * FROM users WHERE clerk_user_id = $1',
    [clerkUserId]
  );
  return rows[0] || null;
}

/**
 * Update user profile preferences.
 */
export async function updateUserProfile(clerkUserId, { preferredLanguage, professionalRoleKey, experienceLevel }) {
  const sets = [];
  const params = [clerkUserId];
  let idx = 2;

  if (preferredLanguage) {
    sets.push(`preferred_language = $${idx++}`);
    params.push(preferredLanguage);
  }
  if (professionalRoleKey) {
    sets.push(`professional_role_key = $${idx++}`);
    params.push(professionalRoleKey);
  }
  if (experienceLevel) {
    sets.push(`experience_level = $${idx++}`);
    params.push(experienceLevel);
  }

  if (sets.length === 0) return null;

  sets.push('updated_at = NOW()');

  const rows = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE clerk_user_id = $1 RETURNING *`,
    params
  );
  return rows[0] || null;
}

/**
 * Get or create session membership for a user.
 */
export async function getSessionMembership(sessionCode, clerkUserId) {
  const rows = await query(
    `SELECT sm.*, s.code, s.name as session_name
     FROM session_members sm
     JOIN sessions s ON sm.session_id = s.id
     WHERE s.code = $1 AND sm.clerk_user_id = $2`,
    [sessionCode.toUpperCase(), clerkUserId]
  );
  return rows[0] || null;
}

/**
 * Join a session as a member.
 */
export async function joinSessionAsMember(sessionCode, clerkUserId, { professionalRoleKey, customRoleText, experienceLevel }) {
  // Get session
  const sessions = await query('SELECT id FROM sessions WHERE code = $1', [sessionCode.toUpperCase()]);
  if (sessions.length === 0) {
    throw Object.assign(new Error('Session not found'), { status: 404 });
  }
  const sessionId = sessions[0].id;

  // Attempt insert; on conflict preserve existing membership values
  const rows = await query(
    `INSERT INTO session_members (session_id, clerk_user_id, professional_role_key, custom_role_text, experience_level)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id, clerk_user_id) DO NOTHING
     RETURNING *`,
    [sessionId, clerkUserId, professionalRoleKey || null, customRoleText || null, experienceLevel || 'beginner']
  );

  // If insert was skipped (repeat join), return existing membership
  if (rows.length === 0) {
    const existing = await query(
      'SELECT * FROM session_members WHERE session_id = $1 AND clerk_user_id = $2',
      [sessionId, clerkUserId]
    );
    return existing[0];
  }

  return rows[0];
}

/**
 * Get all members of a session (for facilitator view).
 */
export async function getSessionMembers(sessionCode) {
  return query(
    `SELECT sm.*, u.display_name, u.email
     FROM session_members sm
     JOIN users u ON sm.clerk_user_id = u.clerk_user_id
     JOIN sessions s ON sm.session_id = s.id
     WHERE s.code = $1
     ORDER BY sm.joined_at`,
    [sessionCode.toUpperCase()]
  );
}

/**
 * Get all members of a session with their FM completion progress (for facilitator view).
 */
export async function getSessionMembersWithProgress(sessionCode) {
  const members = await getSessionMembers(sessionCode);
  const fmRows = await query(
    `SELECT fm.fm_no FROM failure_modes fm JOIN sessions s ON fm.session_id = s.id WHERE s.code = $1 ORDER BY fm.id`,
    [sessionCode.toUpperCase()],
  );
  const drafts = await query(
    `SELECT ad.member_id, ad.fm_no, ad.risk_likelihood, ad.negative_consequence
     FROM assessment_drafts ad
     JOIN session_members sm ON sm.id = ad.member_id
     JOIN sessions s ON s.id = sm.session_id
     WHERE s.code = $1`,
    [sessionCode.toUpperCase()],
  );
  return buildMemberProgress(members, fmRows.map((row) => row.fm_no), drafts);
}

/**
 * Update a session member's professional role and experience level.
 * Also updates the global user profile to keep them in sync.
 */
export async function updateSessionMemberProfile(sessionCode, clerkUserId, { professionalRoleKey, experienceLevel }) {
  // Update session_members record
  const rows = await query(
    `UPDATE session_members sm
     SET professional_role_key = $3, experience_level = $4
     FROM sessions s
     WHERE sm.session_id = s.id AND s.code = $1 AND sm.clerk_user_id = $2
     RETURNING sm.*`,
    [sessionCode.toUpperCase(), clerkUserId, professionalRoleKey, experienceLevel]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error('Membership not found'), { status: 404 });
  }

  // Also update global user profile to keep in sync
  await query(
    `UPDATE users SET professional_role_key = $2, experience_level = $3, updated_at = NOW()
     WHERE clerk_user_id = $1`,
    [clerkUserId, professionalRoleKey, experienceLevel]
  );

  return rows[0];
}
