# Supabase Database Schema for Training Management

This directory contains the database schema and migrations for the training management system.

## Database Structure

### Tables

1. **participants** - Stores participant information
   - `id` (UUID, Primary Key)
   - `name` (VARCHAR) - Participant name
   - `email` (VARCHAR, Unique) - Participant email
   - `phone` (VARCHAR) - Participant phone number
   - `address` (TEXT) - Participant address
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **trainings** - Stores training information
   - `id` (UUID, Primary Key)
   - `title` (VARCHAR) - Training title
   - `description` (TEXT) - Training description
   - `training_date` (DATE) - Date of training
   - `start_time` (TIME) - Start time
   - `end_time` (TIME) - End time
   - `location` (VARCHAR) - Training location
   - `instructor` (VARCHAR) - Instructor name
   - `max_participants` (INTEGER) - Maximum number of participants
   - `status` (VARCHAR) - Training status (scheduled, ongoing, completed, cancelled)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

3. **training_participants** - Junction table for many-to-many relationship
   - `id` (UUID, Primary Key)
   - `participant_id` (UUID, Foreign Key) - References participants.id
   - `training_id` (UUID, Foreign Key) - References trainings.id
   - `registration_date` (TIMESTAMP) - When participant registered
   - `attendance_status` (VARCHAR) - registered, attended, absent, cancelled
   - `attendance_time` (TIMESTAMP) - When participant attended
   - `notes` (TEXT) - Additional notes
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

## How to Use

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_create_training_schema.sql`
4. Run the SQL script

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Example Queries

### Get all participants for a training
```sql
SELECT 
    p.name,
    p.email,
    tp.attendance_status,
    tp.registration_date
FROM training_participants tp
JOIN participants p ON tp.participant_id = p.id
WHERE tp.training_id = 'training-uuid-here';
```

### Get all trainings for a participant
```sql
SELECT 
    t.title,
    t.training_date,
    t.start_time,
    t.end_time,
    t.location,
    tp.attendance_status
FROM training_participants tp
JOIN trainings t ON tp.training_id = t.id
WHERE tp.participant_id = 'participant-uuid-here'
ORDER BY t.training_date DESC;
```

### Get training with participant count
```sql
SELECT 
    t.*,
    COUNT(tp.id) as participant_count
FROM trainings t
LEFT JOIN training_participants tp ON t.id = tp.training_id
GROUP BY t.id;
```

## Security

Row Level Security (RLS) is enabled on all tables. Currently, policies allow all operations. You should update these policies based on your authentication requirements.

To restrict access, modify the policies in the migration file or create new ones in the Supabase dashboard under Authentication > Policies.

