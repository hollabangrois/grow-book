import { supabase } from '../supabase';
import type { User } from '@/types/auth';

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, last_login, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Omit<User, 'password_hash'>[];
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, last_login, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Omit<User, 'password_hash'> | null;
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login'>) {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select('id, email, name, role, is_active, last_login, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as Omit<User, 'password_hash'>;
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, name, role, is_active, last_login, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as Omit<User, 'password_hash'>;
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAllUsersWithPagination(limit: number = 10, offset: number = 0, search?: string) {
  let query = supabase
    .from('users')
    .select('id, email, name, role, is_active, last_login, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;
  return {
    data: data as Omit<User, 'password_hash'>[],
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

