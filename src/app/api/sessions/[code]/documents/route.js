import { NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAppRole } from '@/lib/auth';
import { getSessionMembership } from '@/lib/users';
import { writeAuditLog } from '@/lib/audit';
import { query } from '@/lib/db';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const STORAGE_DIR = join(process.cwd(), '.storage', 'documents');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * POST /api/sessions/[code]/documents — Upload PDF (facilitator only)
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

    // Deactivate previous versions
    await query(
      'UPDATE session_documents SET is_active = false WHERE session_id = $1',
      [sessionId]
    );

    // Store file locally
    const storageKey = `session_${code}_v${newVersion}_${Date.now()}.pdf`;
    await mkdir(STORAGE_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(STORAGE_DIR, storageKey), buffer);

    // Record in database
    const rows = await query(
      `INSERT INTO session_documents (session_id, title, storage_key, file_size, uploader_user_id, version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sessionId, title, storageKey, file.size, userId, newVersion]
    );

    await writeAuditLog({
      actorUserId: userId,
      sessionId,
      action: 'document_uploaded',
      entityType: 'session_document',
      entityId: rows[0].id,
      metadata: { title, version: newVersion, fileSize: file.size },
    });

    return NextResponse.json(rows[0]);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

/**
 * GET /api/sessions/[code]/documents — Download active session PDF
 * Only authenticated members can download.
 */
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const { userId } = await getAuthenticatedUser();

    // Verify membership
    const membership = await getSessionMembership(code, userId);
    if (!membership) {
      // Check if facilitator (may not be a member but has role)
      const { appRole } = await getAuthenticatedUser();
      if (appRole !== 'facilitator') {
        return NextResponse.json({ error: 'Not a member of this session' }, { status: 403 });
      }
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

    // Serve the file
    const filePath = join(STORAGE_DIR, doc.storage_key);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${doc.title.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
