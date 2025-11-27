import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string; dayId: string }> }
) {
  try {
    const { participantId, dayId } = await params;
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get training_participant_id from participant_id and training_id
    // First, get the training_day to get training_id
    const { data: trainingDay } = await supabase
      .from('training_days')
      .select('training_id')
      .eq('id', dayId)
      .single();

    if (!trainingDay) {
      return NextResponse.json({ error: 'Training day not found' }, { status: 404 });
    }

    // Get training_participant_id
    const { data: trainingParticipant } = await supabase
      .from('training_participants')
      .select('id')
      .eq('participant_id', participantId)
      .eq('training_id', trainingDay.training_id)
      .single();

    if (!trainingParticipant) {
      return NextResponse.json({
        attendance_status: 'registered',
        attendance_time: null,
        notes: null,
      });
    }

    // Get daily attendance
    const { data, error } = await supabase
      .from('daily_attendance')
      .select('*')
      .eq('training_participant_id', trainingParticipant.id)
      .eq('training_day_id', dayId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      throw error;
    }

    if (!data) {
      return NextResponse.json({
        attendance_status: 'registered',
        attendance_time: null,
        notes: null,
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch attendance' }, { status: 500 });
  }
}

