import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get training participants for this participant
    const { data: trainingParticipants, error: tpError } = await supabase
      .from('training_participants')
      .select(`
        *,
        training:trainings(*)
      `)
      .eq('participant_id', id)
      .order('registration_date', { ascending: false });

    if (tpError) throw tpError;

    // Get training days and daily attendance for each training
    const trainingsWithDetails = await Promise.all(
      (trainingParticipants || []).map(async (tp: any) => {
        // Get training days
        const { data: trainingDays, error: daysError } = await supabase
          .from('training_days')
          .select('*')
          .eq('training_id', tp.training_id)
          .order('day_number', { ascending: true });

        if (daysError) throw daysError;

        // Get daily attendance for each day
        const daysWithAttendance = await Promise.all(
          (trainingDays || []).map(async (day: any) => {
            const { data: attendance, error: attendanceError } = await supabase
              .from('daily_attendance')
              .select('*')
              .eq('training_participant_id', tp.id)
              .eq('training_day_id', day.id)
              .single();

            if (attendanceError && attendanceError.code !== 'PGRST116') {
              throw attendanceError;
            }

            return {
              ...day,
              attendance: attendance || null,
            };
          })
        );

        return {
          ...tp,
          training: tp.training,
          days: daysWithAttendance,
        };
      })
    );

    return NextResponse.json(trainingsWithDetails);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch participant trainings' }, { status: 500 });
  }
}

