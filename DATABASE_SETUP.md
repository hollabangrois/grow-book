# Database Setup Guide - Training Management System

Panduan lengkap untuk setup database Supabase untuk sistem manajemen pelatihan.

## Struktur Database

Database terdiri dari 3 tabel utama:

### 1. **participants** (Peserta)
Menyimpan informasi peserta pelatihan:
- `id` - UUID (Primary Key)
- `name` - Nama peserta
- `email` - Email peserta (Unique)
- `phone` - Nomor telepon
- `address` - Alamat
- `created_at` - Tanggal dibuat
- `updated_at` - Tanggal diupdate

### 2. **trainings** (Pelatihan)
Menyimpan informasi pelatihan:
- `id` - UUID (Primary Key)
- `title` - Judul pelatihan
- `description` - Deskripsi pelatihan
- `training_date` - Tanggal pelatihan
- `start_time` - Jam mulai
- `end_time` - Jam selesai
- `location` - Lokasi pelatihan
- `instructor` - Nama instruktur
- `max_participants` - Maksimal peserta
- `status` - Status (scheduled, ongoing, completed, cancelled)
- `created_at` - Tanggal dibuat
- `updated_at` - Tanggal diupdate

### 3. **training_participants** (Relasi Peserta-Pelatihan)
Tabel junction untuk relasi many-to-many:
- `id` - UUID (Primary Key)
- `participant_id` - ID peserta (Foreign Key)
- `training_id` - ID pelatihan (Foreign Key)
- `registration_date` - Tanggal pendaftaran
- `attendance_status` - Status kehadiran (registered, attended, absent, cancelled)
- `attendance_time` - Waktu kehadiran
- `notes` - Catatan tambahan
- `created_at` - Tanggal dibuat
- `updated_at` - Tanggal diupdate

## Setup Database di Supabase

### Langkah 1: Buat Project Supabase
1. Buka [supabase.com](https://supabase.com)
2. Buat akun atau login
3. Klik "New Project"
4. Isi nama project dan password database
5. Tunggu hingga project siap

### Langkah 2: Jalankan Migration
1. Buka Supabase Dashboard
2. Pilih project Anda
3. Buka **SQL Editor** di sidebar
4. Copy seluruh isi file `supabase/migrations/001_create_training_schema.sql`
5. Paste ke SQL Editor
6. Klik **Run** untuk menjalankan migration

### Langkah 3: (Opsional) Insert Sample Data
1. Di SQL Editor, copy isi file `supabase/seed_data.sql`
2. Paste dan jalankan untuk menambahkan data contoh

### Langkah 4: Setup Environment Variables
1. Di Supabase Dashboard, buka **Settings** > **API**
2. Copy **Project URL** dan **anon public key**
3. Buat file `.env.local` di root project (copy dari `env.example`)
4. Isi dengan nilai yang sudah dicopy:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Menggunakan Database di Next.js

### Import Helper Functions

```typescript
// Get all participants
import { getAllParticipants } from '@/lib/db/participants';

// Get all trainings
import { getAllTrainings } from '@/lib/db/trainings';

// Register participant to training
import { registerParticipantToTraining } from '@/lib/db/training-participants';
```

### Contoh Penggunaan di Server Component

```typescript
// app/trainings/page.tsx
import { getAllTrainings } from '@/lib/db/trainings';

export default async function TrainingsPage() {
  const trainings = await getAllTrainings();
  
  return (
    <div>
      {trainings.map(training => (
        <div key={training.id}>
          <h2>{training.title}</h2>
          <p>{training.training_date}</p>
        </div>
      ))}
    </div>
  );
}
```

### Contoh Penggunaan di Client Component

```typescript
'use client';

import { useState } from 'react';
import { registerParticipantToTraining } from '@/lib/db/training-participants';

export default function RegisterButton({ participantId, trainingId }) {
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await registerParticipantToTraining(participantId, trainingId);
      alert('Berhasil mendaftar!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleRegister} disabled={loading}>
      {loading ? 'Loading...' : 'Daftar Pelatihan'}
    </button>
  );
}
```

## Query Examples

Lihat file `supabase/QUERIES.md` untuk contoh-contoh query SQL yang berguna.

## Security (Row Level Security)

RLS sudah diaktifkan pada semua tabel. Saat ini, semua operasi diizinkan. Untuk production, Anda harus:

1. Setup authentication di Supabase
2. Update policies di SQL Editor atau melalui Dashboard
3. Contoh policy yang lebih aman:

```sql
-- Hanya user yang login bisa melihat data
CREATE POLICY "Users can view own data" ON participants
  FOR SELECT USING (auth.uid() = user_id);

-- Hanya admin yang bisa insert/update/delete
CREATE POLICY "Admins can manage participants" ON participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

## Troubleshooting

### Error: "relation does not exist"
- Pastikan migration sudah dijalankan
- Cek apakah tabel sudah dibuat di Database > Tables

### Error: "new row violates row-level security policy"
- Cek RLS policies di Authentication > Policies
- Pastikan policy sesuai dengan kebutuhan

### Error: "Invalid API key"
- Pastikan environment variables sudah diisi dengan benar
- Restart development server setelah mengubah .env.local

## Next Steps

1. ✅ Database schema sudah dibuat
2. ✅ Helper functions sudah tersedia
3. ⏭️ Buat UI untuk manage participants
4. ⏭️ Buat UI untuk manage trainings
5. ⏭️ Buat UI untuk registrasi peserta ke pelatihan
6. ⏭️ Setup authentication
7. ⏭️ Update RLS policies sesuai kebutuhan

