-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trainings table
CREATE TABLE IF NOT EXISTS trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    training_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    instructor VARCHAR(255),
    max_participants INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_participants junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS training_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attendance_status VARCHAR(50) DEFAULT 'registered', -- registered, attended, absent, cancelled
    attendance_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, training_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_trainings_date ON trainings(training_date);
CREATE INDEX IF NOT EXISTS idx_trainings_status ON trainings(status);
CREATE INDEX IF NOT EXISTS idx_training_participants_participant ON training_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_training ON training_participants(training_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_participants_updated_at BEFORE UPDATE ON training_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_participants ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust these based on your authentication needs)
-- For now, allowing all operations - you should restrict these based on your auth setup

-- Participants policies
CREATE POLICY "Allow all operations on participants" ON participants
    FOR ALL USING (true) WITH CHECK (true);

-- Trainings policies
CREATE POLICY "Allow all operations on trainings" ON trainings
    FOR ALL USING (true) WITH CHECK (true);

-- Training participants policies
CREATE POLICY "Allow all operations on training_participants" ON training_participants
    FOR ALL USING (true) WITH CHECK (true);

