import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Get the authenticated Clerk user from the current request context.
 * Reads appRole from the authoritative source: currentUser().publicMetadata.appRole.
 * Falls back to 'participant' if publicMetadata.appRole is absent.
 * @returns {Promise<{ userId: string, appRole: string, clerkUser: import('@clerk/nextjs/server').User }>}
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const appRole = clerkUser.publicMetadata?.appRole || 'participant';

  return {
    userId,
    appRole,
    clerkUser,
  };
}

/**
 * Verify that the authenticated user has one of the allowed application roles.
 * @param {string[]} allowed - Array of allowed roles, e.g. ['facilitator']
 * @param {{ appRole: string }} metadata - User metadata with appRole
 * @throws {{ status: 403, message: string }}
 */
export async function requireAppRole(allowed, metadata) {
  if (!metadata?.appRole || !allowed.includes(metadata.appRole)) {
    throw Object.assign(new Error('Forbidden: insufficient role'), { status: 403 });
  }
}

/**
 * Get the full Clerk user object (for profile sync).
 * @returns {Promise<import('@clerk/nextjs/server').User>}
 */
export async function getClerkUser() {
  const user = await currentUser();
  if (!user) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  return user;
}
