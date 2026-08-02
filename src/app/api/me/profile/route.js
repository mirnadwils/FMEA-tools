import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { upsertUserFromClerk, updateUserProfile } from '@/lib/users';

/**
 * PUT /api/me/profile — Update user profile preferences
 * Body: { preferredLanguage, professionalRoleKey, customRoleText, experienceLevel }
 */
export async function PUT(request) {
  try {
    const { userId, clerkUser } = await getAuthenticatedUser();
    const body = await request.json();

    // Ensure user record exists in Neon before updating profile fields
    await upsertUserFromClerk(clerkUser);

    const user = await updateUserProfile(userId, {
      preferredLanguage: body.preferredLanguage,
      professionalRoleKey: body.professionalRoleKey,
      experienceLevel: body.experienceLevel,
    });

    if (!user) {
      return NextResponse.json({ error: 'No changes applied' }, { status: 400 });
    }

    return NextResponse.json(user);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
