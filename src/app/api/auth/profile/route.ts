import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, hashPassword, verifyPassword } from '@/lib/auth/auth';
import { updateParticipant } from '@/lib/db/participants';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    return NextResponse.json({
      user: session.user,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionByToken(sessionToken);

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    // Check if email is already taken by another user
    if (email && email !== session.user.email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', session.user.id)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
      }
    }

    // Handle password change
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Password lama dan password baru harus diisi' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      }

      // Get current user password hash
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify current password
      const isPasswordValid = await verifyPassword(currentPassword, userData.password_hash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Password lama tidak benar' }, { status: 400 });
      }
    }

    // Update user
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (currentPassword && newPassword) {
      updates.password_hash = hashPassword(newPassword);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select('id, email, name, role, is_active, last_login, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui profil' }, { status: 500 });
  }
}

