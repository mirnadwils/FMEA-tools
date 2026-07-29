import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { joinSessionAsMember, getSessionMembers, getSessionMembership } from '@/lib/users';
import { writeAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';

/**
 * POST /api/sessions/[code]/membership — Join session as authenticated member
 * Body: { professionalRoleKey, customRoleText, experienceLevel }
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();
    const body = await request.json();

    if (!body.experienceLevel) {
      return NextResponse.json({ error: 'experienceLevel is required' }, { status: 400 });
    }

    const member = await joinSessionAsMember(code, userId, {
      professionalRoleKey: body.professionalRoleKey || null,
      customRoleText: body.customRoleText || null,
      experienceLevel: body.experienceLevel,
    });

    // Get session ID for audit
    const sessions = await query('SELECT id FROM sessions WHERE code = $1', [code.toUpperCase()]);
    if (sessions.length > 0) {
      await writeAuditLog({
        actorUserId: userId,
        sessionId: sessions[0].id,
        action: 'member_joined',
        entityType: 'session_member',
        entityId: member.id,
        metadata: { role: body.professionalRoleKey, experience: body.experienceLevel },
      });
    }

    return NextResponse.json(member);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

/**
 * GET /api/sessions/[code]/membership — Get session members
 * Facilitator: sees all details. Participant: sees aggregate only.
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();

    // Check own membership
    const myMembership = await getSessionMembership(code, userId);

    const members = await getSessionMembers(code);

    if (appRole === 'facilitator') {
      // Facilitator sees full details
      return NextResponse.json({
        members,
        myMembership,
        totalMembers: members.length,
      });
    }

    // Participant sees only aggregate — no individual identities
    return NextResponse.json({
      myMembership,
      totalMembers: members.length,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
