import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import { getSessionMembership } from '@/lib/users';
import { writeAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * POST /api/sessions/[code]/documents — Upload PDF (facilitator only)
 * Stores the file in Vercel Blob and saves the URL in the database.
 */
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const { userId, appRole } = await getAuthenticatedUser();

    // Only facilitators can upload
    await requireAppRole(['facilitator'], { appRole });

    // Get session
    const sessions = await query('SELECT id FROM sessions WHERE code = $1', [code.toUpperCase()]);
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionId = sessions[0].id;

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || 'Bypass Justification';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds maximum size of 20MB' }, { status: 400 });
    }

    // Get current version
    const existing = await query(
      'SELECT MAX(version) as max_ver FROM session_documents WHERE session_id = $1',
      [sessionId]
    );
    const newVersion = (existing[0]?.max_ver || 0) + 1;

    // Upload to Vercel Blob BEFORE any database writes
    const blobPath = `session-documents/${code.toUpperCase()}/v${newVersion}-${Date.now()}.pdf`;
    let blob;
    try {
      blob = await put(blobPath, file, {
        access: 'public',
        contentType: 'application/pdf',
      });
    } catch (blobErr) {
      console.error('Vercel Blob upload failed:', blobErr);
      return NextResponse.json(
        { error: 'File upload failed. Please check Blob storage configuration.' },
        { status: 502 }
      );
    }

    // Deactivate previous versions
    await query(
      'UPDATE session_documents SET is_active = false WHERE session_id = $1',
      [sessionId]
    );

    // Record in database with Blob URL as storage_key
    const rows = await query(
      `INSERT INTO session_documents (session_id, title, storage_key, file_size, uploader_user_id, version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sessionId, title, blob.url, file.size, userId, newVersion]
    );

    await writeAuditLog({
      actorUserId: userId,
      sessionId,
      action: 'document_uploaded',
      entityType: 'session_document',
      entityId: rows[0].id,
      metadata: { title, version: newVersion, fileSize: file.size, blobUrl: blob.url },
    });

    return NextResponse.json(rows[0]);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

/**
 * GET /api/sessions/[code]/documents — Download active session PDF
 * Authorized users are redirected to the stored Vercel Blob URL.
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

    // Check if requesting metadata or file
    const { searchParams } = new URL(request.url);
    if (searchParams.get('info') === 'true') {
      return NextResponse.json({
        title: doc.title,
        version: doc.version,
        fileSize: doc.file_size,
        uploadedAt: doc.uploaded_at,
      });
    }

    // Redirect to the Blob URL
    return NextResponse.redirect(doc.storage_key);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
