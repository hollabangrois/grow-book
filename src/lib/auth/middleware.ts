import { NextRequest } from 'next/server';
import { getSessionByToken } from './auth';

export async function getCurrentUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await getSessionByToken(sessionToken);
  return session?.user || null;
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request);

  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

