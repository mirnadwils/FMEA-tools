import { NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { EXPERIENCE_WEIGHT } from '@/lib/i18n';
import { getRiskCell } from '@/lib/merdeka';

/**
 * GET /api/sessions/[code]/live-results — Facilitator-only live aggregate results.
 * Joins session_members → assessment_drafts for risk fields only.
 * Returns anonymous aggregate per FM with experience-weighted averages.
 * Participants receive HTTP 403.
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();
    await requireAppRole(['facilitator'], { appRole });

    // Get session
    const sessions = await query(
      'SELECT id FROM sessions WHERE code = $1',
      [code.toUpperCase()]
    );
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionId = sessions[0].id;

    // Get all members with their experience level and saved risk drafts
    const rows = await query(
      `SELECT sm.id AS member_id,
              sm.experience_level,
              ad.fm_no,
              ad.risk_likelihood,
              ad.negative_consequence
       FROM session_members sm
       LEFT JOIN assessment_drafts ad ON ad.member_id = sm.id
       WHERE sm.session_id = $1`,
      [sessionId]
    );

    // Count unique members
    const memberIds = new Set(rows.map((r) => r.member_id));
    const totalMembers = memberIds.size;

    // Aggregate per FM: compute weighted averages
    const fmData = {};
    for (const row of rows) {
      if (!row.fm_no || row.risk_likelihood == null || row.negative_consequence == null) continue;

      if (!fmData[row.fm_no]) {
        fmData[row.fm_no] = [];
      }
      fmData[row.fm_no].push({
        riskLikelihood: row.risk_likelihood,
        negativeConsequence: row.negative_consequence,
        experience: row.experience_level || 'beginner',
      });
    }

    const aggregated = [];
    for (const [fmNo, assessments] of Object.entries(fmData)) {
      let sumWRL = 0, sumWNC = 0, sumW = 0;

      // Unweighted distribution counts
      const likelihoodDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const consequenceDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      // 5×5 combination matrix: combinationDistribution[likelihood][consequence]
      const combinationDistribution = {};
      for (let l = 1; l <= 5; l++) {
        combinationDistribution[l] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      }

      for (const a of assessments) {
        const w = EXPERIENCE_WEIGHT[a.experience] || 1;
        sumWRL += a.riskLikelihood * w;
        sumWNC += a.negativeConsequence * w;
        sumW += w;

        // Tally unweighted distributions
        likelihoodDistribution[a.riskLikelihood] = (likelihoodDistribution[a.riskLikelihood] || 0) + 1;
        consequenceDistribution[a.negativeConsequence] = (consequenceDistribution[a.negativeConsequence] || 0) + 1;
        combinationDistribution[a.riskLikelihood][a.negativeConsequence] += 1;
      }

      const avgRL = sumW ? sumWRL / sumW : null;
      const avgNC = sumW ? sumWNC / sumW : null;
      const rRL = avgRL != null ? Math.min(5, Math.max(1, Math.round(avgRL))) : null;
      const rNC = avgNC != null ? Math.min(5, Math.max(1, Math.round(avgNC))) : null;
      const riskCell = rRL && rNC ? getRiskCell(rRL, rNC) : null;

      aggregated.push({
        fmNo,
        count: assessments.length,
        avgRiskLikelihood: avgRL ? Math.round(avgRL * 100) / 100 : null,
        avgNegativeConsequence: avgNC ? Math.round(avgNC * 100) / 100 : null,
        roundedLikelihood: rRL,
        roundedConsequence: rNC,
        riskScore: riskCell?.score || null,
        riskLevel: riskCell?.level || null,
        likelihoodDistribution,
        consequenceDistribution,
        combinationDistribution,
      });
    }

    // Sort by risk score descending
    aggregated.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

    return NextResponse.json({
      totalMembers,
      aggregated,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
