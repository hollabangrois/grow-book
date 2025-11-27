-- Create daily_attendance table for attendance per training day
CREATE TABLE IF NOT EXISTS daily_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_participant_id UUID NOT NULL REFERENCES training_participants(id) ON DELETE CASCADE,
    training_day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
    attendance_status VARCHAR(50) DEFAULT 'registered', -- registered, attended, absent, cancelled
    attendance_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(training_participant_id, training_day_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_attendance_tp ON daily_attendance(training_participant_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_day ON daily_attendance(training_day_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_daily_attendance_updated_at BEFORE UPDATE ON daily_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;

-- Create policy for daily_attendance
CREATE POLICY "Allow all operations on daily_attendance" ON daily_attendance
    FOR ALL USING (true) WITH CHECK (true);

