import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/sessions/[code]/full — Get complete session data for polling refresh
 * Returns: { session, fmList, fmStatus, participants (with votes) }
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;

    // Get session
    const sessions = await query(
      `SELECT id, code, name, facilitator, status, created_at
       FROM sessions WHERE code = $1`,
      [code.toUpperCase()]
    );
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const session = sessions[0];
    const sessionId = session.id;

    // Get failure modes
    const fmRows = await query(
      `SELECT fm_no, category, title, mechanism, initiation, continuation,
              progression, detection_monitoring, intervention, effect, notes, owner_action
       FROM failure_modes WHERE session_id = $1 ORDER BY id`,
      [sessionId]
    );
    const fmList = fmRows.map((r) => ({
      no: r.fm_no,
      category: r.category || '',
      title: r.title || '',
      mechanism: r.mechanism || '',
      initiation: r.initiation || '',
      continuation: r.continuation || '',
      progression: r.progression || '',
      detectionMonitoring: r.detection_monitoring || '',
      intervention: r.intervention || '',
      effect: r.effect || '',
      notes: r.notes || '',
      ownerAction: r.owner_action || '',
    }));

    // Get FM statuses
    const statusRows = await query(
      'SELECT fm_no, status FROM fm_status WHERE session_id = $1',
      [sessionId]
    );
    const fmStatus = {};
    statusRows.forEach((r) => {
      fmStatus[r.fm_no] = r.status;
    });

    // Get participants
    const participantRows = await query(
      `SELECT id, participant_key, role, name, joined_at
       FROM participants WHERE session_id = $1 ORDER BY joined_at`,
      [sessionId]
    );

    // Get votes
    const voteRows = await query(
      `SELECT v.participant_id, v.fm_no, v.likelihood, v.severity, v.detection, v.voted_at
       FROM votes v WHERE v.session_id = $1`,
      [sessionId]
    );

    // Group votes by participant
    const votesByParticipant = {};
    voteRows.forEach((v) => {
      if (!votesByParticipant[v.participant_id]) {
        votesByParticipant[v.participant_id] = {};
      }
      votesByParticipant[v.participant_id][v.fm_no] = {
        likelihood: v.likelihood,
        severity: v.severity,
        detection: v.detection,
        ts: new Date(v.voted_at).getTime(),
      };
    });

    const participants = participantRows.map((p) => ({
      id: p.participant_key,
      dbId: p.id,
      role: p.role,
      name: p.name || '',
      joinedAt: new Date(p.joined_at).getTime(),
      votes: votesByParticipant[p.id] || {},
    }));

    return NextResponse.json({
      session: {
        code: session.code,
        name: session.name,
        facilitator: session.facilitator,
        status: session.status,
        createdAt: new Date(session.created_at).getTime(),
        fmList,
        fmStatus,
      },
      participants,
    });
  } catch (error) {
    console.error('Get full session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
