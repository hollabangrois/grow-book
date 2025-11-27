-- Sample seed data for testing
-- This file contains example data to help you test the database

-- Insert sample participants
INSERT INTO participants (id, name, email, phone, address) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john.doe@example.com', '+1234567890', '123 Main St, City, Country'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane.smith@example.com', '+1234567891', '456 Oak Ave, City, Country'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob.johnson@example.com', '+1234567892', '789 Pine Rd, City, Country')
ON CONFLICT (email) DO NOTHING;

-- Insert sample trainings
INSERT INTO trainings (id, title, description, training_date, start_time, end_time, location, instructor, max_participants, status) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Web Development Basics', 'Introduction to HTML, CSS, and JavaScript', '2024-02-15', '09:00:00', '17:00:00', 'Training Room A', 'Dr. Sarah Williams', 30, 'scheduled'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Database Management', 'Learn SQL and database design principles', '2024-02-20', '10:00:00', '16:00:00', 'Training Room B', 'Prof. Michael Brown', 25, 'scheduled'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Project Management', 'Agile and Scrum methodologies', '2024-02-25', '08:30:00', '15:30:00', 'Training Room C', 'Ms. Emily Davis', 20, 'scheduled')
ON CONFLICT DO NOTHING;

-- Insert sample training participants (many-to-many relationships)
INSERT INTO training_participants (participant_id, training_id, attendance_status) VALUES
    -- John Doe participates in all trainings
    ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'registered'),
    ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'registered'),
    ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'registered'),
    -- Jane Smith participates in first two trainings
    ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'registered'),
    ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'registered'),
    -- Bob Johnson participates in last two trainings
    ('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'registered'),
    ('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'registered')
ON CONFLICT (participant_id, training_id) DO NOTHING;

