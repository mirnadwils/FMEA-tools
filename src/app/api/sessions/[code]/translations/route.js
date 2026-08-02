import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';

/**
 * PUT /api/sessions/[code]/translations
 * Facilitator only. Bulk update translations for a specific FM.
 * Body: { fmNo, fields: { title: '...', category: '...' } }
 */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();
    await requireAppRole(['facilitator'], { appRole });

    const body = await request.json();
    const { fmNo, fields } = body;

    if (!fmNo || !fields) {
      return NextResponse.json({ error: 'Missing fmNo or fields' }, { status: 400 });
    }

    const sessions = await query(
      'SELECT id FROM sessions WHERE code = $1',
      [code.toUpperCase()]
    );
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionId = sessions[0].id;

    // Get the internal failure_mode_id
    const fms = await query(
      'SELECT id FROM failure_modes WHERE session_id = $1 AND fm_no = $2',
      [sessionId, fmNo]
    );
    if (fms.length === 0) {
      return NextResponse.json({ error: 'FM not found' }, { status: 404 });
    }
    const fmId = fms[0].id;

    // Iterate and update
    for (const [fieldName, enText] of Object.entries(fields)) {
      // We map JS camelCase names back to snake_case field_names if necessary
      const dbField = fieldName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

      await query(
        `UPDATE failure_mode_translations
         SET text_en = $1, translation_status = 'reviewed', translated_at = NOW()
         WHERE failure_mode_id = $2 AND field_name = $3`,
        [enText, fmId, dbField]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update translations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
