import { supabase } from '../supabase';
import type { User, Session, LoginCredentials, RegisterData, SessionWithUser } from '@/types/auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Generate a secure random token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Get user by email
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data as User | null;
}

// Get user by ID
export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active, last_login, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Omit<User, 'password_hash'> | null;
}

// Verify password using bcrypt
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

// Hash password using bcrypt
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Create session
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  expiresInHours: number = 24
): Promise<Session> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Update last_login for user
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);

  return data as Session;
}

// Get session by token
export async function getSessionByToken(token: string): Promise<SessionWithUser | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      user:users(id, email, name, role, is_active, last_login, created_at, updated_at)
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;
  
  return {
    ...data,
    user: data.user,
  } as SessionWithUser;
}

// Delete session (logout)
export async function deleteSession(token: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('token', token);

  if (error) throw error;
}

// Delete all sessions for a user
export async function deleteAllUserSessions(userId: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

// Clean up expired sessions
export async function cleanupExpiredSessions() {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) throw error;
}

// Login function
export async function login(
  credentials: LoginCredentials,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: Omit<User, 'password_hash'>; session: Session }> {
  // Get user by email
  const user = await getUserByEmail(credentials.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await verifyPassword(credentials.password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Create session
  const session = await createSession(user.id, ipAddress, userAgent);

  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    session,
  };
}

// Register new user
export async function register(data: RegisterData): Promise<Omit<User, 'password_hash'>> {
  const password_hash = hashPassword(data.password);
  
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: data.email,
      password_hash,
      name: data.name || null,
      role: data.role || 'user',
      is_active: true,
    })
    .select('id, email, name, role, is_active, last_login, created_at, updated_at')
    .single();

  if (error) throw error;
  return user as Omit<User, 'password_hash'>;
}

