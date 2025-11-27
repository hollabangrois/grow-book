import { supabase } from '../supabase';
import type { TrainingDay } from '@/types/database';

export async function getTrainingDaysByTrainingId(trainingId: string) {
  const { data, error } = await supabase
    .from('training_days')
    .select('*')
    .eq('training_id', trainingId)
    .order('day_number', { ascending: true });

  if (error) throw error;
  return data as TrainingDay[];
}

export async function createTrainingDay(day: Omit<TrainingDay, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('training_days')
    .insert(day)
    .select()
    .single();

  if (error) throw error;
  return data as TrainingDay;
}

export async function createMultipleTrainingDays(days: Omit<TrainingDay, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('training_days')
    .insert(days)
    .select();

  if (error) throw error;
  return data as TrainingDay[];
}

export async function updateTrainingDay(id: string, updates: Partial<TrainingDay>) {
  const { data, error } = await supabase
    .from('training_days')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TrainingDay;
}

export async function deleteTrainingDay(id: string) {
  const { error } = await supabase
    .from('training_days')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteTrainingDaysByTrainingId(trainingId: string) {
  const { error } = await supabase
    .from('training_days')
    .delete()
    .eq('training_id', trainingId);

  if (error) throw error;
}

/**
 * Sync training days: update existing, create new, delete removed
 * This preserves daily_attendance records by updating existing training days instead of deleting them
 * Matching strategy:
 * 1. First try to match by training_date (most stable identifier)
 * 2. If no match, try to match by day_number and position
 * 3. If still no match, create new day
 */
export async function syncTrainingDays(
  trainingId: string,
  newDays: Omit<TrainingDay, 'id' | 'created_at' | 'updated_at'>[]
) {
  // Get existing training days
  const existingDays = await getTrainingDaysByTrainingId(trainingId);
  
  const updatedDays: TrainingDay[] = [];
  const usedExistingIds = new Set<string>();
  
  // Create maps for matching
  // Map by training_date (most reliable)
  const existingDaysByDate = new Map<string, TrainingDay>();
  existingDays.forEach(day => {
    const dateKey = day.training_date;
    if (!existingDaysByDate.has(dateKey)) {
      existingDaysByDate.set(dateKey, day);
    }
  });
  
  // Map by day_number as fallback
  const existingDaysByDayNumber = new Map<number, TrainingDay[]>();
  existingDays.forEach(day => {
    if (!existingDaysByDayNumber.has(day.day_number)) {
      existingDaysByDayNumber.set(day.day_number, []);
    }
    existingDaysByDayNumber.get(day.day_number)!.push(day);
  });
  
  // Process each new day
  for (const newDay of newDays) {
    let matchedDay: TrainingDay | undefined;
    
    // Strategy 1: Match by training_date (most reliable)
    matchedDay = existingDaysByDate.get(newDay.training_date);
    
    // Strategy 2: If no date match, try to match by day_number and position
    if (!matchedDay || usedExistingIds.has(matchedDay.id)) {
      const candidates = existingDaysByDayNumber.get(newDay.day_number) || [];
      matchedDay = candidates.find(day => !usedExistingIds.has(day.id));
    }
    
    if (matchedDay && !usedExistingIds.has(matchedDay.id)) {
      // Update existing day (preserves daily_attendance because training_day_id stays the same)
      const updated = await updateTrainingDay(matchedDay.id, {
        training_id: trainingId,
        day_number: newDay.day_number,
        training_date: newDay.training_date,
        start_time: newDay.start_time,
        end_time: newDay.end_time,
        location: newDay.location || null,
        instructor: newDay.instructor || null,
        description: newDay.description || null,
      });
      updatedDays.push(updated);
      usedExistingIds.add(matchedDay.id);
    } else {
      // Create new day
      const created = await createTrainingDay({
        training_id: trainingId,
        day_number: newDay.day_number,
        training_date: newDay.training_date,
        start_time: newDay.start_time,
        end_time: newDay.end_time,
        location: newDay.location || null,
        instructor: newDay.instructor || null,
        description: newDay.description || null,
      });
      updatedDays.push(created);
    }
  }
  
  // Delete days that are no longer in the new list
  // This will cascade delete daily_attendance via ON DELETE CASCADE
  for (const existingDay of existingDays) {
    if (!usedExistingIds.has(existingDay.id)) {
      await deleteTrainingDay(existingDay.id);
    }
  }
  
  // Return updated days sorted by day_number
  return updatedDays.sort((a, b) => a.day_number - b.day_number);
}

