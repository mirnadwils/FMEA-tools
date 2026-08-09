import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import { storeBilingualFields } from '@/lib/translate';

/**
 * Bilingual field pairs expected from the Excel import.
 * Each entry maps a DB field name to the camelCase key used in the JSON body.
 */
const BILINGUAL_FIELDS = [
  { dbField: 'category',            bodyKey: 'category' },
  { dbField: 'title',               bodyKey: 'title' },
  { dbField: 'mechanism',           bodyKey: 'mechanism' },
  { dbField: 'initiation',          bodyKey: 'initiation' },
  { dbField: 'continuation',        bodyKey: 'continuation' },
  { dbField: 'progression',         bodyKey: 'progression' },
  { dbField: 'detection_monitoring', bodyKey: 'detectionMonitoring' },
  { dbField: 'intervention',        bodyKey: 'intervention' },
  { dbField: 'effect',              bodyKey: 'effect' },
  { dbField: 'notes',               bodyKey: 'notes' },
  { dbField: 'owner_action',        bodyKey: 'ownerAction' },
];



/**
 * POST /api/sessions/[code]/fm — Import bilingual failure modes (facilitator only)
 * Body: { fmList: [{ no, category: { id, en }, title: { id, en }, ... }] }
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
      // Use English text for the main failure_modes table columns
      const getEnText = (key) => {
        const val = fm[key];
        if (!val) return null;
        if (typeof val === 'string') return val || null;
        return val.en || null;
      };

      const rows = await query(
        `INSERT INTO failure_modes
         (session_id, fm_no, category, title, mechanism, initiation, continuation,
          progression, detection_monitoring, intervention, effect, notes, owner_action)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, fm_no`,
        [
          sessionId, fm.no,
          getEnText('category'), getEnText('title'),
          getEnText('mechanism'), getEnText('initiation'), getEnText('continuation'),
          getEnText('progression'), getEnText('detectionMonitoring'),
          getEnText('intervention'), getEnText('effect'), getEnText('notes'),
          getEnText('ownerAction'),
        ]
      );
      const fmId = rows[0].id;
      inserted.push(rows[0]);

      // Create default fm_status (locked) if not exists
      await query(
        `INSERT INTO fm_status (session_id, fm_no, status)
         VALUES ($1, $2, 'locked')
         ON CONFLICT (session_id, fm_no) DO NOTHING`,
        [sessionId, fm.no]
      );

      // Store translations — use English text for both fields (single-language import)
      const bilingualData = {};
      for (const { dbField, bodyKey } of BILINGUAL_FIELDS) {
        const val = fm[bodyKey];
        if (val && typeof val === 'object') {
          const enText = val.en || '';
          bilingualData[dbField] = { id: enText, en: enText };
        } else if (val && typeof val === 'string') {
          bilingualData[dbField] = { id: val, en: val };
        }
      }
      await storeBilingualFields(fmId, bilingualData);
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
