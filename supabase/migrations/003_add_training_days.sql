-- Create training_days table for multiple days training
CREATE TABLE IF NOT EXISTS training_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    training_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    instructor VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(training_id, day_number)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_training_days_training_id ON training_days(training_id);
CREATE INDEX IF NOT EXISTS idx_training_days_date ON training_days(training_date);

-- Create trigger to update updated_at
CREATE TRIGGER update_training_days_updated_at BEFORE UPDATE ON training_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;

-- Create policy for training_days
CREATE POLICY "Allow all operations on training_days" ON training_days
    FOR ALL USING (true) WITH CHECK (true);

-- Update trainings table to make training_date, start_time, end_time nullable
-- (since we'll use training_days for multiple days)
ALTER TABLE trainings 
    ALTER COLUMN training_date DROP NOT NULL,
    ALTER COLUMN start_time DROP NOT NULL,
    ALTER COLUMN end_time DROP NOT NULL;

