import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/sessions/[code]/votes — Submit or update a vote
 * Body: { participantKey, fmNo, likelihood, severity, detection }
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { participantKey, fmNo, likelihood, severity, detection } = body;

    if (!participantKey || !fmNo || !likelihood || !severity || !detection) {
      return NextResponse.json(
        { error: 'participantKey, fmNo, likelihood, severity, and detection are required' },
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

    // Get participant id
    const participants = await query(
      'SELECT id FROM participants WHERE session_id = $1 AND participant_key = $2',
      [sessionId, participantKey]
    );
    if (participants.length === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    const participantId = participants[0].id;

    // Upsert vote
    const rows = await query(
      `INSERT INTO votes (session_id, participant_id, fm_no, likelihood, severity, detection)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (participant_id, fm_no) DO UPDATE
       SET likelihood = $4, severity = $5, detection = $6, voted_at = NOW()
       RETURNING id, fm_no, likelihood, severity, detection, voted_at`,
      [sessionId, participantId, fmNo, likelihood, severity, detection]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Submit vote error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
