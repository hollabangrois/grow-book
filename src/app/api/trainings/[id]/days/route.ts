import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { getTrainingDaysByTrainingId } from '@/lib/db/training-days';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const days = await getTrainingDaysByTrainingId(id);
    return NextResponse.json(days);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch training days' }, { status: 500 });
  }
}

