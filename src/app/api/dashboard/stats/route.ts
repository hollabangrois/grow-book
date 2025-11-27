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

    // Get total trainings
    const { count: totalTrainings, error: trainingsError } = await supabase
      .from('trainings')
      .select('*', { count: 'exact', head: true });

    if (trainingsError) throw trainingsError;

    // Get total participants
    const { count: totalParticipants, error: participantsError } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    if (participantsError) throw participantsError;

    // Get upcoming trainings (scheduled or ongoing)
    const today = new Date().toISOString().split('T')[0];
    const { count: upcomingTrainings, error: upcomingError } = await supabase
      .from('trainings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['scheduled', 'ongoing']);

    if (upcomingError) throw upcomingError;

    // Get ongoing trainings
    const { count: ongoingTrainings, error: ongoingError } = await supabase
      .from('trainings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ongoing');

    if (ongoingError) throw ongoingError;

    // Get completed trainings
    const { count: completedTrainings, error: completedError } = await supabase
      .from('trainings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (completedError) throw completedError;

    // Calculate attendance rate
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('daily_attendance')
      .select('attendance_status');

    if (attendanceError) throw attendanceError;

    let attendanceRate = 0;
    if (attendanceData && attendanceData.length > 0) {
      const attended = attendanceData.filter(a => a.attendance_status === 'attended').length;
      attendanceRate = (attended / attendanceData.length) * 100;
    }

    // Get recent trainings (last 5)
    const { data: recentTrainings, error: recentError } = await supabase
      .from('trainings')
      .select('id, title, status, training_date, location')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    // Get upcoming trainings list (scheduled or ongoing, with training days)
    const { data: upcomingTrainingsData, error: upcomingListError } = await supabase
      .from('trainings')
      .select('id, title, status, training_date, location, start_time')
      .in('status', ['scheduled', 'ongoing'])
      .limit(10);

    if (upcomingListError) throw upcomingListError;

    // If training doesn't have training_date, get from training_days
    const upcomingWithDays = await Promise.all(
      (upcomingTrainingsData || []).map(async (training) => {
        if (!training.training_date) {
          const { data: days } = await supabase
            .from('training_days')
            .select('training_date, start_time')
            .eq('training_id', training.id)
            .order('training_date', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (days) {
            return {
              ...training,
              training_date: days.training_date,
              start_time: days.start_time,
            };
          }
        }
        return training;
      })
    );

    // Filter and sort by date, then take first 5
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const sortedUpcoming = (upcomingWithDays as Array<{ training_date: string | null; [key: string]: any }>)
      .filter(t => {
        if (t.training_date) {
          const trainingDate = new Date(t.training_date);
          trainingDate.setHours(0, 0, 0, 0);
          return trainingDate >= todayDate;
        }
        return true; // Include trainings without date
      })
      .sort((a, b) => {
        const dateA = a.training_date ? new Date(a.training_date).getTime() : Infinity;
        const dateB = b.training_date ? new Date(b.training_date).getTime() : Infinity;
        return dateA - dateB;
      })
      .slice(0, 5);

    return NextResponse.json({
      totalTrainings: totalTrainings || 0,
      totalParticipants: totalParticipants || 0,
      upcomingTrainings: upcomingTrainings || 0,
      attendanceRate: attendanceRate || 0,
      ongoingTrainings: ongoingTrainings || 0,
      completedTrainings: completedTrainings || 0,
      recentTrainings: recentTrainings || [],
      upcomingTrainingsList: sortedUpcoming || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

