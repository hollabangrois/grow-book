# Authentication Setup Guide

Panduan lengkap untuk setup sistem autentikasi dengan tabel users dan sessions.

## Struktur Database

### 1. **users** (Tabel User)
Menyimpan informasi user untuk login:
- `id` - UUID (Primary Key)
- `email` - Email user (Unique)
- `password_hash` - Password yang sudah di-hash dengan bcrypt
- `name` - Nama user
- `role` - Role user (user, admin, instructor)
- `is_active` - Status aktif user
- `last_login` - Waktu login terakhir
- `created_at` - Tanggal dibuat
- `updated_at` - Tanggal diupdate

### 2. **sessions** (Tabel Session)
Menyimpan session untuk user yang login:
- `id` - UUID (Primary Key)
- `user_id` - ID user (Foreign Key)
- `token` - Token session (Unique)
- `expires_at` - Waktu kadaluarsa session
- `ip_address` - IP address saat login
- `user_agent` - User agent browser
- `created_at` - Tanggal dibuat

## Setup Database

### Langkah 1: Jalankan Migration
1. Buka Supabase Dashboard > SQL Editor
2. Copy dan jalankan file `supabase/migrations/002_create_auth_tables.sql`
3. Migration akan membuat tabel users dan sessions, serta insert user admin default

### Langkah 2: Verifikasi User Admin
User admin default sudah dibuat dengan:
- **Email**: hollabangrois@gmail.com
- **Password**: Doromukti48!
- **Role**: admin

## API Endpoints

### POST `/api/auth/login`
Login user dan membuat session.

**Request Body:**
```json
{
  "email": "hollabangrois@gmail.com",
  "password": "Doromukti48!"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "hollabangrois@gmail.com",
    "name": "Admin User",
    "role": "admin",
    "is_active": true
  },
  "session": {
    "token": "...",
    "expires_at": "..."
  }
}
```

### POST `/api/auth/logout`
Logout user dan menghapus session.

**Response:**
```json
{
  "success": true
}
```

### GET `/api/auth/me`
Mendapatkan informasi user yang sedang login.

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "hollabangrois@gmail.com",
    "name": "Admin User",
    "role": "admin"
  },
  "session": {
    "expires_at": "..."
  }
}
```

## Menggunakan di Frontend

### Login Component Example

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Check Authentication in Server Component

```typescript
// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const session = await getSessionByToken(sessionToken);

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Logout Function

```typescript
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
```

## Helper Functions

### Get Current User
```typescript
import { getCurrentUser } from '@/lib/auth/middleware';

// In Server Component or API Route
const user = await getCurrentUser(request);
if (!user) {
  // Not authenticated
}
```

### Require Authentication
```typescript
import { requireAuth } from '@/lib/auth/middleware';

// Throws error if not authenticated
const user = await requireAuth(request);
```

### Require Admin
```typescript
import { requireAdmin } from '@/lib/auth/middleware';

// Throws error if not admin
const admin = await requireAdmin(request);
```

## Security Features

1. **Password Hashing**: Password di-hash menggunakan bcrypt dengan salt rounds 10
2. **Session Tokens**: Token session di-generate menggunakan crypto.randomBytes
3. **HTTP-Only Cookies**: Session token disimpan di HTTP-only cookie untuk keamanan
4. **Session Expiration**: Session expired setelah 24 jam (dapat diubah)
5. **IP Tracking**: IP address dan user agent dicatat untuk audit
6. **Row Level Security**: RLS enabled pada semua tabel

## Menambah User Baru

### Via API (Register)
```typescript
import { register } from '@/lib/auth/auth';

const newUser = await register({
  email: 'user@example.com',
  password: 'securepassword',
  name: 'New User',
  role: 'user',
});
```

### Via SQL
```sql
-- Generate hash password dulu
-- node scripts/hash-password.js "your-password"

INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'user@example.com',
  '$2a$10$...', -- Hashed password dari script
  'User Name',
  'user',
  true
);
```

## Troubleshooting

### Error: "Invalid email or password"
- Pastikan email dan password benar
- Pastikan user `is_active = true`
- Cek apakah password_hash di database sudah benar

### Error: "Invalid or expired session"
- Session mungkin sudah expired
- Cek `expires_at` di tabel sessions
- User perlu login ulang

### Session tidak tersimpan
- Pastikan cookie settings sudah benar
- Cek browser console untuk cookie errors
- Pastikan domain dan path cookie sesuai

## Next Steps

1. ✅ Tabel users dan sessions sudah dibuat
2. ✅ User admin default sudah dibuat
3. ✅ API endpoints untuk login/logout sudah dibuat
4. ⏭️ Buat halaman login UI
5. ⏭️ Buat halaman dashboard
6. ⏭️ Implementasi protected routes
7. ⏭️ Tambahkan fitur "Remember Me"
8. ⏭️ Tambahkan password reset functionality

