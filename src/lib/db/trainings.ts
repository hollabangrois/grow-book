import { supabase } from '../supabase';
import type { Training, TrainingWithParticipants } from '@/types/database';

export async function getAllTrainings() {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('training_date', { ascending: false });

  if (error) throw error;
  return data as Training[];
}

export async function getTrainingById(id: string) {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Training;
}

export async function getTrainingWithParticipants(id: string) {
  const { data, error } = await supabase
    .from('trainings')
    .select(`
      *,
      participants:training_participants(
        *,
        participant:participants(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as TrainingWithParticipants;
}

export async function getUpcomingTrainings() {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .gte('training_date', new Date().toISOString().split('T')[0])
    .in('status', ['scheduled', 'ongoing'])
    .order('training_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as Training[];
}

export async function createTraining(training: Omit<Training, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('trainings')
    .insert({
      ...training,
      training_date: training.training_date || null,
      start_time: training.start_time || null,
      end_time: training.end_time || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Training;
}

export async function updateTraining(id: string, updates: Partial<Training>) {
  const { data, error } = await supabase
    .from('trainings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Training;
}

export async function deleteTraining(id: string) {
  const { error } = await supabase
    .from('trainings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

