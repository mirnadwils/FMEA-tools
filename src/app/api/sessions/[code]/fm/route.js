import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import { translateFMFields } from '@/lib/translate';

/**
 * POST /api/sessions/[code]/fm — Import failure modes (facilitator only, bulk upsert)
 * Body: { fmList: [{ no, category, title, mechanism, ... }] }
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();
    await requireAppRole(['facilitator'], { appRole });

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
      const fmId = rows[0].id;
      inserted.push(rows[0]);

      // Also create default fm_status (locked) if not exists
      await query(
        `INSERT INTO fm_status (session_id, fm_no, status)
         VALUES ($1, $2, 'locked')
         ON CONFLICT (session_id, fm_no) DO NOTHING`,
        [sessionId, fm.no]
      );

      // Trigger Translation
      const fieldsToTranslate = {
        category: fm.category,
        title: fm.title,
        mechanism: fm.mechanism,
        initiation: fm.initiation,
        continuation: fm.continuation,
        progression: fm.progression,
        detection_monitoring: fm.detectionMonitoring,
        intervention: fm.intervention,
        effect: fm.effect,
        notes: fm.notes,
        owner_action: fm.ownerAction,
      };
      await translateFMFields(fmId, fieldsToTranslate, 'id');
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
      `SELECT fm.*,
              (SELECT json_object_agg(field_name, json_build_object('id', text_id, 'en', text_en))
               FROM failure_mode_translations fmt WHERE fmt.failure_mode_id = fm.id) as translations
       FROM failure_modes fm WHERE fm.session_id = $1 ORDER BY fm.id`,
      [sessionId]
    );

    // Map column names back to camelCase for frontend, merging with translations
    const fmList = rows.map((r) => {
      const getTr = (field, fallback) => {
        if (!r.translations || !r.translations[field]) {
          return { id: fallback || '', en: fallback || '' };
        }
        return r.translations[field];
      };

      return {
        no: r.fm_no,
        category: getTr('category', r.category),
        title: getTr('title', r.title),
        mechanism: getTr('mechanism', r.mechanism),
        initiation: getTr('initiation', r.initiation),
        continuation: getTr('continuation', r.continuation),
        progression: getTr('progression', r.progression),
        detectionMonitoring: getTr('detection_monitoring', r.detection_monitoring),
        intervention: getTr('intervention', r.intervention),
        effect: getTr('effect', r.effect),
        notes: getTr('notes', r.notes),
        ownerAction: getTr('owner_action', r.owner_action),
      };
    });

    return NextResponse.json(fmList);
  } catch (error) {
    console.error('Get FM error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
