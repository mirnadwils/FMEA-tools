import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/sessions/[code]/fm — Import failure modes (bulk upsert)
 * Body: { fmList: [{ no, category, title, mechanism, ... }] }
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { fmList } = body;

    if (!fmList || !Array.isArray(fmList)) {
      return NextResponse.json(
        { error: 'fmList array is required' },
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

    // Delete existing failure modes for this session (replace strategy)
    await query('DELETE FROM failure_modes WHERE session_id = $1', [sessionId]);

    // Insert all failure modes
    const inserted = [];
    for (const fm of fmList) {
      const rows = await query(
        `INSERT INTO failure_modes
         (session_id, fm_no, category, title, mechanism, initiation, continuation,
          progression, detection_monitoring, intervention, effect, notes, owner_action)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, fm_no`,
        [
          sessionId, fm.no, fm.category || null, fm.title || null,
          fm.mechanism || null, fm.initiation || null, fm.continuation || null,
          fm.progression || null, fm.detectionMonitoring || null,
          fm.intervention || null, fm.effect || null, fm.notes || null,
          fm.ownerAction || null,
        ]
      );
      inserted.push(rows[0]);

      // Also create default fm_status (locked) if not exists
      await query(
        `INSERT INTO fm_status (session_id, fm_no, status)
         VALUES ($1, $2, 'locked')
         ON CONFLICT (session_id, fm_no) DO NOTHING`,
        [sessionId, fm.no]
      );
    }

    return NextResponse.json({ success: true, count: inserted.length });
  } catch (error) {
    console.error('Import FM error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/sessions/[code]/fm — Get all failure modes for a session
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

    const rows = await query(
      `SELECT fm_no, category, title, mechanism, initiation, continuation,
              progression, detection_monitoring, intervention, effect, notes, owner_action
       FROM failure_modes WHERE session_id = $1 ORDER BY id`,
      [sessionId]
    );

    // Map column names back to camelCase for frontend
    const fmList = rows.map((r) => ({
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

    return NextResponse.json(fmList);
  } catch (error) {
    console.error('Get FM error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
