export type User = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: 'user' | 'admin' | 'instructor';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type SessionWithUser = Session & {
  user: Omit<User, 'password_hash'>;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  name?: string;
  role?: 'user' | 'admin' | 'instructor';
};

