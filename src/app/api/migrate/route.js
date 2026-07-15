import { NextResponse } from 'next/server';
import { runMigrations } from '@/lib/migrate';

export async function POST() {
  try {
    const tables = await runMigrations();
    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
