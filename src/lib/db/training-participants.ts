import { supabase } from '../supabase';
import type { TrainingParticipant } from '@/types/database';

export async function registerParticipantToTraining(
  participantId: string,
  trainingId: string
) {
  const { data, error } = await supabase
    .from('training_participants')
    .insert({
      participant_id: participantId,
      training_id: trainingId,
      attendance_status: 'registered',
    })
    .select()
    .single();

  if (error) throw error;
  return data as TrainingParticipant;
}

export async function updateAttendanceStatus(
  participantId: string,
  trainingId: string,
  status: 'registered' | 'attended' | 'absent' | 'cancelled',
  attendanceTime?: string | null
) {
  const updateData: Partial<TrainingParticipant> = {
    attendance_status: status,
  };

  if (status === 'attended') {
    updateData.attendance_time = attendanceTime || new Date().toISOString();
  } else {
    updateData.attendance_time = null;
  }

  const { data, error } = await supabase
    .from('training_participants')
    .update(updateData)
    .eq('participant_id', participantId)
    .eq('training_id', trainingId)
    .select()
    .single();

  if (error) throw error;
  return data as TrainingParticipant;
}

export async function getTrainingParticipants(trainingId: string) {
  const { data, error } = await supabase
    .from('training_participants')
    .select(`
      *,
      participant:participants(*)
    `)
    .eq('training_id', trainingId)
    .order('registration_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUnregisteredParticipants(trainingId: string) {
  // Get all participants
  const { data: allParticipants, error: participantsError } = await supabase
    .from('participants')
    .select('*')
    .order('name');

  if (participantsError) throw participantsError;

  // Get registered participant IDs for this training
  const { data: registeredParticipants, error: registeredError } = await supabase
    .from('training_participants')
    .select('participant_id')
    .eq('training_id', trainingId);

  if (registeredError) throw registeredError;

  const registeredIds = new Set(registeredParticipants.map((tp) => tp.participant_id));

  // Filter out registered participants
  const unregistered = allParticipants.filter((p) => !registeredIds.has(p.id));

  return unregistered;
}

export async function getParticipantTrainings(participantId: string) {
  const { data, error } = await supabase
    .from('training_participants')
    .select(`
      *,
      training:trainings(*)
    `)
    .eq('participant_id', participantId)
    .order('registration_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function unregisterParticipant(
  participantId: string,
  trainingId: string
) {
  const { error } = await supabase
    .from('training_participants')
    .delete()
    .eq('participant_id', participantId)
    .eq('training_id', trainingId);

  if (error) throw error;
}
