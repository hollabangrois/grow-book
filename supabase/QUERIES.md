# Useful SQL Queries for Training Management

## Get All Participants with Their Training Count
```sql
SELECT 
    p.*,
    COUNT(tp.id) as total_trainings
FROM participants p
LEFT JOIN training_participants tp ON p.id = tp.participant_id
GROUP BY p.id
ORDER BY p.name;
```

## Get All Trainings with Participant Count
```sql
SELECT 
    t.*,
    COUNT(tp.id) as registered_count,
    COUNT(CASE WHEN tp.attendance_status = 'attended' THEN 1 END) as attended_count
FROM trainings t
LEFT JOIN training_participants tp ON t.id = tp.training_id
GROUP BY t.id
ORDER BY t.training_date DESC;
```

## Get Participants for a Specific Training
```sql
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    tp.registration_date,
    tp.attendance_status,
    tp.attendance_time,
    tp.notes
FROM training_participants tp
JOIN participants p ON tp.participant_id = p.id
WHERE tp.training_id = 'training-uuid-here'
ORDER BY p.name;
```

## Get Trainings for a Specific Participant
```sql
SELECT 
    t.id,
    t.title,
    t.training_date,
    t.start_time,
    t.end_time,
    t.location,
    t.instructor,
    t.status,
    tp.registration_date,
    tp.attendance_status,
    tp.attendance_time
FROM training_participants tp
JOIN trainings t ON tp.training_id = t.id
WHERE tp.participant_id = 'participant-uuid-here'
ORDER BY t.training_date DESC;
```

## Get Upcoming Trainings
```sql
SELECT 
    t.*,
    COUNT(tp.id) as registered_count
FROM trainings t
LEFT JOIN training_participants tp ON t.id = tp.training_id
WHERE t.training_date >= CURRENT_DATE
    AND t.status IN ('scheduled', 'ongoing')
GROUP BY t.id
ORDER BY t.training_date ASC, t.start_time ASC;
```

## Get Training Attendance Report
```sql
SELECT 
    t.title,
    t.training_date,
    COUNT(tp.id) as total_registered,
    COUNT(CASE WHEN tp.attendance_status = 'attended' THEN 1 END) as attended,
    COUNT(CASE WHEN tp.attendance_status = 'absent' THEN 1 END) as absent,
    COUNT(CASE WHEN tp.attendance_status = 'cancelled' THEN 1 END) as cancelled,
    ROUND(
        COUNT(CASE WHEN tp.attendance_status = 'attended' THEN 1 END)::numeric / 
        NULLIF(COUNT(tp.id), 0) * 100, 
        2
    ) as attendance_rate
FROM trainings t
LEFT JOIN training_participants tp ON t.id = tp.training_id
WHERE t.id = 'training-uuid-here'
GROUP BY t.id, t.title, t.training_date;
```

## Register Participant to Training
```sql
INSERT INTO training_participants (participant_id, training_id, attendance_status)
VALUES ('participant-uuid', 'training-uuid', 'registered')
ON CONFLICT (participant_id, training_id) 
DO UPDATE SET 
    attendance_status = 'registered',
    updated_at = NOW();
```

## Mark Attendance
```sql
UPDATE training_participants
SET 
    attendance_status = 'attended',
    attendance_time = NOW(),
    updated_at = NOW()
WHERE participant_id = 'participant-uuid'
    AND training_id = 'training-uuid';
```

## Get Trainings by Date Range
```sql
SELECT 
    t.*,
    COUNT(tp.id) as registered_count
FROM trainings t
LEFT JOIN training_participants tp ON t.id = tp.training_id
WHERE t.training_date BETWEEN '2024-02-01' AND '2024-02-28'
GROUP BY t.id
ORDER BY t.training_date ASC;
```

## Get Participants Who Haven't Attended Any Training
```sql
SELECT p.*
FROM participants p
LEFT JOIN training_participants tp ON p.id = tp.participant_id
WHERE tp.id IS NULL;
```

## Get Full Training Details with All Participants
```sql
SELECT 
    t.*,
    json_agg(
        json_build_object(
            'participant_id', p.id,
            'participant_name', p.name,
            'participant_email', p.email,
            'registration_date', tp.registration_date,
            'attendance_status', tp.attendance_status,
            'attendance_time', tp.attendance_time,
            'notes', tp.notes
        )
    ) as participants
FROM trainings t
LEFT JOIN training_participants tp ON t.id = tp.training_id
LEFT JOIN participants p ON tp.participant_id = p.id
WHERE t.id = 'training-uuid-here'
GROUP BY t.id;
```

