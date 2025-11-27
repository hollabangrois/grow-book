export type Participant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type Training = {
  id: string;
  title: string;
  description: string | null;
  training_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  instructor: string | null;
  max_participants: number | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type TrainingDay = {
  id: string;
  training_id: string;
  day_number: number;
  training_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  instructor: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainingParticipant = {
  id: string;
  participant_id: string;
  training_id: string;
  registration_date: string;
  attendance_status: 'registered' | 'attended' | 'absent' | 'cancelled';
  attendance_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainingWithParticipants = Training & {
  participants: (TrainingParticipant & {
    participant: Participant;
  })[];
};

export type TrainingWithDays = Training & {
  days: TrainingDay[];
};

export type DailyAttendance = {
  id: string;
  training_participant_id: string;
  training_day_id: string;
  attendance_status: 'registered' | 'attended' | 'absent' | 'cancelled';
  attendance_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ParticipantWithTrainings = Participant & {
  trainings: (TrainingParticipant & {
    training: Training;
  })[];
};

