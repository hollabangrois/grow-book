import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { getAllTrainings, createTraining } from '@/lib/db/trainings';
import { createMultipleTrainingDays } from '@/lib/db/training-days';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const trainings = await getAllTrainings();
    return NextResponse.json(trainings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch trainings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, location, instructor, max_participants, status, days } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!days || days.length === 0) {
      return NextResponse.json({ error: 'At least one training day is required' }, { status: 400 });
    }

    // Validate days
    for (const day of days) {
      if (!day.training_date || !day.start_time || !day.end_time) {
        return NextResponse.json(
          { error: 'All training days must have date, start time, and end time' },
          { status: 400 }
        );
      }
    }

    // Create training (without date/time since we use training_days)
    const training = await createTraining({
      title,
      description: description || null,
      training_date: null,
      start_time: null,
      end_time: null,
      location: location || null,
      instructor: instructor || null,
      max_participants: max_participants || null,
      status: status || 'scheduled',
    });

    // Create training days
    const trainingDays = await createMultipleTrainingDays(
      days.map((day: any) => ({
        training_id: training.id,
        day_number: day.day_number,
        training_date: day.training_date,
        start_time: day.start_time,
        end_time: day.end_time,
        location: day.location || location || null,
        instructor: day.instructor || instructor || null,
        description: day.description || null,
      }))
    );

    return NextResponse.json({ ...training, days: trainingDays }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create training' }, { status: 500 });
  }
}

