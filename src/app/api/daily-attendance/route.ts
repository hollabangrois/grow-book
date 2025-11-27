import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { createOrUpdateDailyAttendance } from '@/lib/db/daily-attendance';

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
    const { training_participant_id, training_day_id, attendance_status, attendance_time, notes } = body;

    if (!training_participant_id || !training_day_id || !attendance_status) {
      return NextResponse.json(
        { error: 'Training participant ID, training day ID, and attendance status are required' },
        { status: 400 }
      );
    }

    // Validate attendance_status
    const validStatuses = ['registered', 'attended', 'absent', 'cancelled'];
    if (!validStatuses.includes(attendance_status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 });
    }

    const attendance = await createOrUpdateDailyAttendance(
      training_participant_id,
      training_day_id,
      attendance_status as 'registered' | 'attended' | 'absent' | 'cancelled',
      attendance_time,
      notes
    );

    return NextResponse.json(attendance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save attendance' }, { status: 500 });
  }
}

