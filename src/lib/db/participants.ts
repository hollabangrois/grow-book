import { supabase } from '../supabase';
import type { Participant, ParticipantWithTrainings } from '@/types/database';

export async function getAllParticipants() {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Participant[];
}

export async function getParticipantById(id: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Participant;
}

export async function searchParticipants(searchTerm: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, email, phone')
    .ilike('name', `%${searchTerm}%`)
    .order('name')
    .limit(limit);

  if (error) throw error;
  return data as Array<Pick<Participant, 'id' | 'name' | 'email' | 'phone'>>;
}

export async function getAllParticipantsWithPagination(limit: number = 10, offset: number = 0) {
  const { data, error, count } = await supabase
    .from('participants')
    .select('*', { count: 'exact' })
    .order('name')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return {
    data: data as Participant[],
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function searchParticipantsWithPagination(searchTerm: string, limit: number = 10, offset: number = 0) {
  const { data, error, count } = await supabase
    .from('participants')
    .select('*', { count: 'exact' })
    .ilike('name', `%${searchTerm}%`)
    .order('name')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return {
    data: data as Participant[],
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getParticipantTrainingCount(participantId: string) {
  const { count, error } = await supabase
    .from('training_participants')
    .select('*', { count: 'exact', head: true })
    .eq('participant_id', participantId);

  if (error) throw error;
  return count || 0;
}

export async function getParticipantWithTrainings(id: string) {
  const { data, error } = await supabase
    .from('participants')
    .select(`
      *,
      trainings:training_participants(
        *,
        training:trainings(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ParticipantWithTrainings;
}

export async function createParticipant(participant: Omit<Participant, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('participants')
    .insert(participant)
    .select()
    .single();

  if (error) throw error;
  return data as Participant;
}

export async function updateParticipant(id: string, updates: Partial<Participant>) {
  const { data, error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Participant;
}

export async function deleteParticipant(id: string) {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

