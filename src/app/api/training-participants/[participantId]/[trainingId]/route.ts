import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { updateAttendanceStatus, unregisterParticipant } from '@/lib/db/training-participants';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string; trainingId: string }> }
) {
  try {
    const { participantId, trainingId } = await params;
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { attendance_status, attendance_time, notes } = body;

    if (!attendance_status) {
      return NextResponse.json({ error: 'Attendance status is required' }, { status: 400 });
    }

    const updated = await updateAttendanceStatus(participantId, trainingId, attendance_status, attendance_time);

    // Update notes if provided
    if (notes !== undefined) {
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('training_participants')
        .update({ notes })
        .eq('participant_id', participantId)
        .eq('training_id', trainingId);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update attendance' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string; trainingId: string }> }
) {
  try {
    const { participantId, trainingId } = await params;
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await unregisterParticipant(participantId, trainingId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to unregister participant' }, { status: 500 });
  }
}

