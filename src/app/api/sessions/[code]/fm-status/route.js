import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * PUT /api/sessions/[code]/fm-status — Update FM status (single or bulk)
 * Body: { fmNo, status } for single, or { bulk: [{ fmNo, status }] } for bulk
 */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();

    // Get session id
    const sessions = await query(
      'SELECT id FROM sessions WHERE code = $1',
      [code.toUpperCase()]
    );
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionId = sessions[0].id;

    // Handle bulk update
    if (body.bulk && Array.isArray(body.bulk)) {
      for (const item of body.bulk) {
        await query(
          `INSERT INTO fm_status (session_id, fm_no, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (session_id, fm_no) DO UPDATE SET status = $3`,
          [sessionId, item.fmNo, item.status]
        );
      }
      return NextResponse.json({ success: true, count: body.bulk.length });
    }

    // Handle single update
    const { fmNo, status } = body;
    if (!fmNo || !status) {
      return NextResponse.json(
        { error: 'fmNo and status are required' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO fm_status (session_id, fm_no, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, fm_no) DO UPDATE SET status = $3`,
      [sessionId, fmNo, status]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update FM status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/sessions/[code]/fm-status — Get all FM statuses
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
      'SELECT fm_no, status FROM fm_status WHERE session_id = $1',
      [sessionId]
    );

    // Convert to object { fmNo: status }
    const statusMap = {};
    rows.forEach((r) => {
      statusMap[r.fm_no] = r.status;
    });

    return NextResponse.json(statusMap);
  } catch (error) {
    console.error('Get FM status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
