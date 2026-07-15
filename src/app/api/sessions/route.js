import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/sessions — Create a new workshop session
 * Body: { name, facilitator, code }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, facilitator, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'name and code are required' },
        { status: 400 }
      );
    }

    const rows = await query(
      `INSERT INTO sessions (code, name, facilitator)
       VALUES ($1, $2, $3)
       RETURNING id, code, name, facilitator, status, created_at`,
      [code, name, facilitator || null]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Create session error:', error);
    // Handle duplicate code
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Session code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions?code=XXXX — Get session by code
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'code query parameter is required' },
        { status: 400 }
      );
    }

    const rows = await query(
      `SELECT id, code, name, facilitator, status, created_at
       FROM sessions WHERE code = $1`,
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
