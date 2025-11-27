import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await getSessionByToken(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: session.user,
      session: {
        expires_at: session.expires_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication check failed' },
      { status: 500 }
    );
  }
}

