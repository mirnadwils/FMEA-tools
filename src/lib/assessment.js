import { query } from './db';
import { MERDEKA_VERSION } from './merdeka';

/**
 * Save or update an assessment draft for a single failure mode.
 * Risk-only: only riskLikelihood and negativeConsequence.
 * Rejects if the member has already submitted.
 */
export async function saveDraft(memberId, fmNo, { riskLikelihood, negativeConsequence }) {
  // Check if already submitted
  const submissions = await query(
    'SELECT id FROM assessment_submissions WHERE member_id = $1',
    [memberId]
  );
  if (submissions.length > 0) {
    throw Object.assign(new Error('Assessment already submitted. Cannot modify drafts.'), { status: 409 });
  }

  const rows = await query(
    `INSERT INTO assessment_drafts (member_id, fm_no, risk_likelihood, negative_consequence)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (member_id, fm_no) DO UPDATE
     SET risk_likelihood = $3, negative_consequence = $4,
         updated_at = NOW()
     RETURNING *`,
    [memberId, fmNo, riskLikelihood || null, negativeConsequence || null]
  );

  return rows[0];
}

/**
 * Get all drafts for a member.
 */
export async function getDrafts(memberId) {
  return query(
    'SELECT * FROM assessment_drafts WHERE member_id = $1 ORDER BY fm_no',
    [memberId]
  );
}

/**
 * Check if all open failure modes have complete Risk assessments.
 * Risk-only: requires riskLikelihood and negativeConsequence for every open FM.
 * @param {string[]} openFmNos - Array of FM numbers that are currently open
 * @param {Object} drafts - Map of fmNo -> draft data
 * @returns {boolean}
 */
export function isReadyToSubmit(openFmNos, drafts) {
  if (!openFmNos || openFmNos.length === 0) return false;

  for (const fmNo of openFmNos) {
    const draft = drafts[fmNo];
    if (!draft) return false;
    if (!draft.riskLikelihood || !draft.negativeConsequence) return false;
  }
  return true;
}

/**
 * Submit assessment — atomically create immutable snapshot and lock.
 * Risk-only: snapshot contains only riskLikelihood and negativeConsequence.
 * @param {number} memberId - session_members.id
 * @param {number} sessionId - sessions.id
 * @param {string} clerkUserId - for audit
 * @returns {Promise<Object>} The submission record
 */
export async function submitAssessment(memberId, sessionId, clerkUserId) {
  // Check not already submitted
  const existing = await query(
    'SELECT id FROM assessment_submissions WHERE member_id = $1',
    [memberId]
  );
  if (existing.length > 0) {
    throw Object.assign(new Error('Assessment already submitted'), { status: 409 });
  }

  // Get all drafts for snapshot
  const drafts = await query(
    'SELECT * FROM assessment_drafts WHERE member_id = $1',
    [memberId]
  );

  // Get open FM numbers for validation
  const openFms = await query(
    `SELECT fs.fm_no FROM fm_status fs WHERE fs.session_id = $1 AND fs.status = 'open'`,
    [sessionId]
  );
  const openFmNos = openFms.map((f) => f.fm_no);

  // Validate completeness (risk-only)
  const draftMap = {};
  for (const d of drafts) {
    draftMap[d.fm_no] = {
      riskLikelihood: d.risk_likelihood,
      negativeConsequence: d.negative_consequence,
    };
  }

  if (!isReadyToSubmit(openFmNos, draftMap)) {
    throw Object.assign(new Error('Not all open failure modes have complete Risk assessments'), { status: 400 });
  }

  // Create immutable snapshot (risk-only)
  const snapshot = {
    templateVersion: MERDEKA_VERSION,
    assessments: draftMap,
    openFmNos,
    submittedAt: new Date().toISOString(),
  };

  const rows = await query(
    `INSERT INTO assessment_submissions (member_id, template_version, snapshot)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [memberId, MERDEKA_VERSION, JSON.stringify(snapshot)]
  );

  return rows[0];
}

/**
 * Check if a member has submitted.
 */
export async function getSubmission(memberId) {
  const rows = await query(
    'SELECT * FROM assessment_submissions WHERE member_id = $1',
    [memberId]
  );
  return rows[0] || null;
}

/**
 * Facilitator reopens a submitted assessment.
 * @param {number} submissionId
 * @param {string} facilitatorUserId - Clerk user ID of the facilitator
 * @param {string} reason - Mandatory reason
 */
export async function reopenSubmission(submissionId, facilitatorUserId, reason) {
  if (!reason || !reason.trim()) {
    throw Object.assign(new Error('Reason is required to reopen'), { status: 400 });
  }

  // Record the reopen
  await query(
    `INSERT INTO assessment_reopens (submission_id, facilitator_user_id, reason)
     VALUES ($1, $2, $3)`,
    [submissionId, facilitatorUserId, reason.trim()]
  );

  // Delete the submission to allow new drafts
  await query(
    'DELETE FROM assessment_submissions WHERE id = $1',
    [submissionId]
  );

  return { reopened: true };
}
