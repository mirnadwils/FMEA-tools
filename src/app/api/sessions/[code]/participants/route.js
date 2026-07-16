import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/sessions/[code]/participants — Join session as participant
 * Body: { participantKey, role, name }
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { participantKey, role, name, experience } = body;

    if (!participantKey || !role) {
      return NextResponse.json(
        { error: 'participantKey and role are required' },
        { status: 400 }
      );
    }

    // Get session id
    const sessions = await query(
      'SELECT id FROM sessions WHERE code = $1',
      [code.toUpperCase()]
    );
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionId = sessions[0].id;

    // Upsert participant
    const rows = await query(
      `INSERT INTO participants (session_id, participant_key, role, experience, name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, participant_key) DO UPDATE SET role = $3, experience = $4, name = $5
       RETURNING id, participant_key, role, experience, name, joined_at`,
      [sessionId, participantKey, role, experience || 'beginner', name || null]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Join session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/sessions/[code]/participants — List all participants with their votes
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;

    const sessions = await query(
      'SELECT id FROM sessions WHERE code = $1',
      [code.toUpperCase()]
    );
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionId = sessions[0].id;

    // Get all participants
    const participantRows = await query(
      `SELECT id, participant_key, role, experience, name, joined_at
       FROM participants WHERE session_id = $1 ORDER BY joined_at`,
      [sessionId]
    );

    // Get all votes for this session
    const voteRows = await query(
      `SELECT v.participant_id, v.fm_no, v.likelihood, v.severity, v.detection, v.voted_at
       FROM votes v
       JOIN participants p ON v.participant_id = p.id
       WHERE v.session_id = $1`,
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

    // Assemble result
    const participants = participantRows.map((p) => ({
      id: p.participant_key,
      dbId: p.id,
      role: p.role,
      experience: p.experience || 'beginner',
      name: p.name || '',
      joinedAt: new Date(p.joined_at).getTime(),
      votes: votesByParticipant[p.id] || {},
    }));

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Get participants error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
