import { NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import { getSessionMembership } from '@/lib/users';
import { writeAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';

/**
 * POST /api/sessions/[code]/documents — Set Google Drive Link (facilitator only)
 * Stores the Google Drive URL in the database.
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();

    // Only facilitators can upload
    await requireAppRole(['facilitator'], { appRole });

    const body = await request.json();
    const link = body.link;
    const title = body.title || 'Reference Material';

    if (!link || typeof link !== 'string' || !link.startsWith('http')) {
      return NextResponse.json({ error: 'A valid URL is required' }, { status: 400 });
    }

    // Get session
    const sessions = await query('SELECT id FROM sessions WHERE code = $1', [code.toUpperCase()]);
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionId = sessions[0].id;

    // Get current version
    const existing = await query(
      'SELECT MAX(version) as max_ver FROM session_documents WHERE session_id = $1',
      [sessionId]
    );
    const newVersion = (existing[0]?.max_ver || 0) + 1;

    // Deactivate previous versions
    await query(
      'UPDATE session_documents SET is_active = false WHERE session_id = $1',
      [sessionId]
    );

    // Record in database with GDrive URL as storage_key
    const rows = await query(
      `INSERT INTO session_documents (session_id, title, storage_key, file_size, uploader_user_id, version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sessionId, title, link, 0, userId, newVersion]
    );

    await writeAuditLog({
      actorUserId: userId,
      sessionId,
      action: 'document_uploaded',
      entityType: 'session_document',
      entityId: rows[0].id,
      metadata: { title, version: newVersion, link },
    });

    return NextResponse.json(rows[0]);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

/**
 * GET /api/sessions/[code]/documents — Get document info or redirect
 * Authorized users are redirected to the stored Google Drive URL.
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();

    // Verify membership or facilitator role
    const membership = await getSessionMembership(code, userId);
    if (!membership && appRole !== 'facilitator') {
      return NextResponse.json({ error: 'Not a member of this session' }, { status: 403 });
    }

    // Get session
    const sessions = await query('SELECT id FROM sessions WHERE code = $1', [code.toUpperCase()]);
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get active document
    const docs = await query(
      'SELECT * FROM session_documents WHERE session_id = $1 AND is_active = true ORDER BY version DESC LIMIT 1',
      [sessions[0].id]
    );

    if (docs.length === 0) {
      return NextResponse.json({ error: 'No document uploaded' }, { status: 404 });
    }

    const doc = docs[0];

    // Check if requesting metadata or redirect
    const { searchParams } = new URL(request.url);
    if (searchParams.get('info') === 'true') {
      return NextResponse.json({
        title: doc.title,
        version: doc.version,
        uploadedAt: doc.uploaded_at,
        link: doc.storage_key, // Also return the link in the info JSON
      });
    }

    // Redirect to the GDrive URL
    return NextResponse.redirect(doc.storage_key);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
