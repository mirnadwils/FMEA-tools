import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getSessionMembership } from '@/lib/users';
import { saveDraft, getDrafts } from '@/lib/assessment';

/**
 * PUT /api/sessions/[code]/assessment — Save assessment draft
 * Body: { fmNo, riskLikelihood, negativeConsequence, oppLikelihood, positiveConsequence }
 */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const { userId } = await getAuthenticatedUser();

    // Verify membership
    const membership = await getSessionMembership(code, userId);
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this session' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.fmNo) {
      return NextResponse.json({ error: 'fmNo is required' }, { status: 400 });
    }

    const draft = await saveDraft(membership.id, body.fmNo, {
      riskLikelihood: body.riskLikelihood,
      negativeConsequence: body.negativeConsequence,
      oppLikelihood: body.oppLikelihood,
      positiveConsequence: body.positiveConsequence,
    });

    return NextResponse.json(draft);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

/**
 * GET /api/sessions/[code]/assessment — Get own assessment drafts
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const { userId } = await getAuthenticatedUser();

    const membership = await getSessionMembership(code, userId);
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this session' }, { status: 403 });
    }

    const drafts = await getDrafts(membership.id);

    // Convert to a map for easy client usage
    const draftMap = {};
    for (const d of drafts) {
      draftMap[d.fm_no] = {
        riskLikelihood: d.risk_likelihood,
        negativeConsequence: d.negative_consequence,
        oppLikelihood: d.opp_likelihood,
        positiveConsequence: d.positive_consequence,
        updatedAt: d.updated_at,
      };
    }

    return NextResponse.json({ drafts: draftMap, memberId: membership.id });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
