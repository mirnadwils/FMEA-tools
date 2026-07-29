import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { updateUserProfile } from '@/lib/users';

/**
 * PUT /api/me/profile — Update user profile preferences
 * Body: { preferredLanguage, professionalRoleKey, experience }
 */
export async function PUT(request) {
  try {
    const { userId } = await getAuthenticatedUser();
    const body = await request.json();

    const user = await updateUserProfile(userId, {
      preferredLanguage: body.preferredLanguage,
      professionalRoleKey: body.professionalRoleKey,
      experience: body.experience,
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
