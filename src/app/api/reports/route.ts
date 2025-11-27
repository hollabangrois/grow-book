import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trainingId = searchParams.get('trainingId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const participantName = searchParams.get('participantName');

    let trainings: any[] = [];

    if (participantName) {
      // Report by participant name - find all trainings for this participant
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id, name, email, phone')
        .ilike('name', `%${participantName}%`);

      if (participantsError) throw participantsError;

      if (!participants || participants.length === 0) {
        return NextResponse.json([]);
      }

      // Get all training participants for these participants
      const participantIds = participants.map(p => p.id);
      const { data: trainingParticipants, error: tpError } = await supabase
        .from('training_participants')
        .select(`
          *,
          training:trainings(*)
        `)
        .in('participant_id', participantIds);

      if (tpError) throw tpError;

      // Get all unique training IDs
      const allTrainingIds = new Set<string>();
      (trainingParticipants || []).forEach((tp: any) => {
        if (tp.training && tp.training.id) {
          allTrainingIds.add(tp.training.id);
        }
      });

      if (allTrainingIds.size > 0) {
        const { data: trainingsData, error: trainingsError } = await supabase
          .from('trainings')
          .select('*')
          .in('id', Array.from(allTrainingIds));

        if (trainingsError) throw trainingsError;
        trainings = trainingsData || [];
      }
    } else if (trainingId) {
      // Single training report
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('id', trainingId)
        .single();

      if (error) throw error;
      if (data) trainings = [data];
    } else if (startDate && endDate) {
      // Date range report - get trainings with days in range
      const { data: trainingDays, error: daysError } = await supabase
        .from('training_days')
        .select('training_id')
        .gte('training_date', startDate)
        .lte('training_date', endDate);

      if (daysError) throw daysError;

      const trainingIds = [...new Set(trainingDays.map((td) => td.training_id))];

      if (trainingIds.length > 0) {
        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .in('id', trainingIds);

        if (error) throw error;
        trainings = data || [];
      }
    } else {
      return NextResponse.json({ error: 'Either trainingId, startDate/endDate, or participantName is required' }, { status: 400 });
    }

    const reports = (await Promise.all(
      trainings.map(async (training) => {
        // Get training days
        const { data: days, error: daysError } = await supabase
          .from('training_days')
          .select('*')
          .eq('training_id', training.id)
          .order('day_number', { ascending: true });

        if (daysError) throw daysError;

        // Get participants
        let trainingParticipantsQuery: any = supabase
          .from('training_participants')
          .select(`
            *,
            participant:participants(*)
          `)
          .eq('training_id', training.id);

        // If searching by participant name, filter by participant IDs
        if (participantName) {
          const { data: matchingParticipants } = await supabase
            .from('participants')
            .select('id')
            .ilike('name', `%${participantName}%`);
          
          if (matchingParticipants && matchingParticipants.length > 0) {
            const matchingIds = matchingParticipants.map(p => p.id);
            trainingParticipantsQuery = trainingParticipantsQuery.in('participant_id', matchingIds);
          } else {
            // No matching participants, skip this training
            return null;
          }
        }

        const { data: trainingParticipants, error: tpError } = await trainingParticipantsQuery;

        if (tpError) throw tpError;
        
        // Skip if no participants found (for participant name search)
        if (participantName && (!trainingParticipants || trainingParticipants.length === 0)) {
          return null;
        }

        // Get daily attendance for each participant
        const participants = await Promise.all(
          (trainingParticipants || []).map(async (tp: any) => {
            const attendanceByDay: Record<string, { status: string; attendance_time: string | null }> = {};

            if (days && days.length > 0) {
              for (const day of days) {
                const { data: attendance } = await supabase
                  .from('daily_attendance')
                  .select('*')
                  .eq('training_participant_id', tp.id)
                  .eq('training_day_id', day.id)
                  .single();

                if (attendance) {
                  attendanceByDay[day.id] = {
                    status: attendance.attendance_status,
                    attendance_time: attendance.attendance_time,
                  };
                } else {
                  attendanceByDay[day.id] = {
                    status: tp.attendance_status || 'registered',
                    attendance_time: null,
                  };
                }
              }
            }

            return {
              id: tp.participant.id,
              name: tp.participant.name,
              email: tp.participant.email,
              phone: tp.participant.phone,
              registration_date: tp.registration_date,
              attendance_by_day: attendanceByDay,
            };
          })
        );

        // Calculate summary
        const attendanceStats = {
          registered: 0,
          attended: 0,
          absent: 0,
          cancelled: 0,
        };

        participants.forEach((participant) => {
          Object.values(participant.attendance_by_day).forEach((attendance: { status: string; attendance_time: string | null }) => {
            const status = attendance.status;
            if (status === 'attended') attendanceStats.attended++;
            else if (status === 'absent') attendanceStats.absent++;
            else if (status === 'cancelled') attendanceStats.cancelled++;
            else attendanceStats.registered++;
          });
        });

        return {
          training: {
            id: training.id,
            title: training.title,
            status: training.status,
            location: training.location,
            instructor: training.instructor,
          },
          days: (days || []).map((day) => ({
            id: day.id,
            day_number: day.day_number,
            training_date: day.training_date,
            start_time: day.start_time,
            end_time: day.end_time,
          })),
          participants,
          summary: {
            total_participants: participants.length,
            total_days: days?.length || 0,
            attendance_stats: attendanceStats,
          },
        };
      })
    )).filter(report => report !== null);

    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}

