import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { upsertUserFromClerk } from '@/lib/users';

/**
 * GET /api/me — Get current user profile
 * Returns the Neon user record with appRole from Clerk publicMetadata.
 */
export async function GET() {
  try {
    const { userId, appRole, clerkUser } = await getAuthenticatedUser();

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
