import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserByClerkId, joinSessionAsMember, getSessionMembers, getSessionMembership, updateSessionMemberProfile } from '@/lib/users';
import { writeAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';

/**
 * POST /api/sessions/[code]/membership — Join session as authenticated member.
 * Profile fields are read from the persisted Neon user record, not the request body.
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();

    // Read persisted profile from Neon
    const profile = await getUserByClerkId(userId);
    if (!profile || !profile.professional_role_key || !profile.experience_level) {
      return NextResponse.json(
        { error: 'Your profile is incomplete. Please set your Field Work and experience level in your profile before joining a session.' },
        { status: 400 }
      );
    }

    const member = await joinSessionAsMember(code, userId, {
      professionalRoleKey: profile.professional_role_key,
      customRoleText: profile.custom_role_text || null,
      experienceLevel: profile.experience_level,
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
        metadata: { role: profile.professional_role_key, experience: profile.experience_level },
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

/**
 * PUT /api/sessions/[code]/membership — Update own session membership profile.
 * Body: { professionalRoleKey, experienceLevel }
 */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const { userId } = await getAuthenticatedUser();
    const body = await request.json();

    const { professionalRoleKey, experienceLevel } = body;
    if (!professionalRoleKey || !experienceLevel) {
      return NextResponse.json(
        { error: 'professionalRoleKey and experienceLevel are required' },
        { status: 400 }
      );
    }

    const updated = await updateSessionMemberProfile(code, userId, {
      professionalRoleKey,
      experienceLevel,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
