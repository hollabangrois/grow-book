import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { getTrainingParticipants } from '@/lib/db/training-participants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) {
  try {
    const { trainingId } = await params;
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const participants = await getTrainingParticipants(trainingId);
    return NextResponse.json(participants);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch training participants' }, { status: 500 });
  }
}

