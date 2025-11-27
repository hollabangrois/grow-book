import { supabase } from '../supabase';
import type { DailyAttendance } from '@/types/database';

export async function getDailyAttendanceByTrainingParticipant(trainingParticipantId: string) {
  const { data, error } = await supabase
    .from('daily_attendance')
    .select('*')
    .eq('training_participant_id', trainingParticipantId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as DailyAttendance[];
}

export async function getDailyAttendanceByTrainingDay(trainingDayId: string) {
  const { data, error } = await supabase
    .from('daily_attendance')
    .select(`
      *,
      training_participant:training_participants(
        *,
        participant:participants(*)
      )
    `)
    .eq('training_day_id', trainingDayId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createOrUpdateDailyAttendance(
  trainingParticipantId: string,
  trainingDayId: string,
  attendanceStatus: 'registered' | 'attended' | 'absent' | 'cancelled',
  attendanceTime?: string | null,
  notes?: string | null
) {
  // Check if exists
  const { data: existing } = await supabase
    .from('daily_attendance')
    .select('id')
    .eq('training_participant_id', trainingParticipantId)
    .eq('training_day_id', trainingDayId)
    .single();

  const attendanceData: any = {
    training_participant_id: trainingParticipantId,
    training_day_id: trainingDayId,
    attendance_status: attendanceStatus,
    notes: notes || null,
  };

  if (attendanceStatus === 'attended') {
    attendanceData.attendance_time = attendanceTime || new Date().toISOString();
  } else {
    attendanceData.attendance_time = null;
  }

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('daily_attendance')
      .update(attendanceData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as DailyAttendance;
  } else {
    // Create
    const { data, error } = await supabase
      .from('daily_attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;
    return data as DailyAttendance;
  }
}

export async function deleteDailyAttendance(id: string) {
  const { error } = await supabase.from('daily_attendance').delete().eq('id', id);

  if (error) throw error;
}

