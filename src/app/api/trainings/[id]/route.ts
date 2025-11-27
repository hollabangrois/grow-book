import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { updateTraining, deleteTraining, getTrainingById } from '@/lib/db/trainings';
import {
  syncTrainingDays,
  getTrainingDaysByTrainingId,
} from '@/lib/db/training-days';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const training = await getTrainingById(id);
    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    return NextResponse.json(training);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch training' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    // Update training
    const training = await updateTraining(id, {
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

    // Sync training days (update existing, create new, delete removed)
    // This preserves daily_attendance records by updating existing training days
    const trainingDays = await syncTrainingDays(
      id,
      days.map((day: any) => ({
        training_id: id,
        day_number: day.day_number,
        training_date: day.training_date,
        start_time: day.start_time,
        end_time: day.end_time,
        location: day.location || location || null,
        instructor: day.instructor || instructor || null,
        description: day.description || null,
      }))
    );

    return NextResponse.json({ ...training, days: trainingDays });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update training' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await deleteTraining(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete training' }, { status: 500 });
  }
}

