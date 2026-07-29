import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getClerkUser } from '@/lib/auth';
import { upsertUserFromClerk, getUserByClerkId } from '@/lib/users';

/**
 * GET /api/me — Get current user profile
 */
export async function GET() {
  try {
    const { userId, appRole } = await getAuthenticatedUser();
    const clerkUser = await getClerkUser();

    // Sync to Neon
    const user = await upsertUserFromClerk(clerkUser);

    return NextResponse.json({
      ...user,
      appRole,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
