import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { registerParticipantToTraining } from '@/lib/db/training-participants';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { participant_id, training_id } = body;

    if (!participant_id || !training_id) {
      return NextResponse.json({ error: 'Participant ID and Training ID are required' }, { status: 400 });
    }

    const registration = await registerParticipantToTraining(participant_id, training_id);

    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to register participant' }, { status: 500 });
  }
}

