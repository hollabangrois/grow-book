import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken } from '@/lib/auth/auth';
import { getAllParticipants, createParticipant } from '@/lib/db/participants';

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

    // Check if search query parameter exists
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (search) {
      // Search participants by name with pagination
      const { searchParticipantsWithPagination } = await import('@/lib/db/participants');
      const result = await searchParticipantsWithPagination(search, limit, offset);
      return NextResponse.json(result);
    }

    // Get all participants with pagination
    const { getAllParticipantsWithPagination } = await import('@/lib/db/participants');
    const result = await getAllParticipantsWithPagination(limit, offset);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch participants' }, { status: 500 });
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
    const { name, email, phone, address } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const participant = await createParticipant({
      name,
      email,
      phone: phone || null,
      address: address || null,
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create participant' }, { status: 500 });
  }
}

