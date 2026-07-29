import { NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import { getSessionMembership } from '@/lib/users';
import { submitAssessment, getSubmission, reopenSubmission } from '@/lib/assessment';
import { writeAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';

/**
 * POST /api/sessions/[code]/submission — Submit assessment (atomic lock)
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const { userId } = await getAuthenticatedUser();

    // Verify membership
    const membership = await getSessionMembership(code, userId);
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this session' }, { status: 403 });
    }

    // Get session ID
    const sessions = await query('SELECT id FROM sessions WHERE code = $1', [code.toUpperCase()]);
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const submission = await submitAssessment(membership.id, sessions[0].id, userId);

    // Audit log
    await writeAuditLog({
      actorUserId: userId,
      sessionId: sessions[0].id,
      action: 'assessment_submitted',
      entityType: 'assessment_submission',
      entityId: submission.id,
      metadata: { templateVersion: submission.template_version },
    });

    return NextResponse.json(submission);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

/**
 * GET /api/sessions/[code]/submission — Check own submission status
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const { userId } = await getAuthenticatedUser();

    const membership = await getSessionMembership(code, userId);
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this session' }, { status: 403 });
    }

    const submission = await getSubmission(membership.id);
    return NextResponse.json({ submission, isSubmitted: !!submission });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

/**
 * PUT /api/sessions/[code]/submission — Facilitator reopen a participant's submission
 * Body: { memberId, reason }
 */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();

    // Only facilitators can reopen
    await requireAppRole(['facilitator'], { appRole });

    const body = await request.json();
    if (!body.memberId || !body.reason) {
      return NextResponse.json({ error: 'memberId and reason are required' }, { status: 400 });
    }

    // Get the submission
    const submission = await getSubmission(body.memberId);
    if (!submission) {
      return NextResponse.json({ error: 'No submission found for this member' }, { status: 404 });
    }

    const result = await reopenSubmission(submission.id, userId, body.reason);

    // Get session ID for audit
    const sessions = await query('SELECT id FROM sessions WHERE code = $1', [code.toUpperCase()]);
    if (sessions.length > 0) {
      await writeAuditLog({
        actorUserId: userId,
        sessionId: sessions[0].id,
        action: 'assessment_reopened',
        entityType: 'assessment_submission',
        entityId: submission.id,
        metadata: { memberId: body.memberId, reason: body.reason },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
