'use client';

import { useState } from 'react';
import type { User } from '@/types/auth';

interface ProfileFormProps {
  user: Omit<User, 'password_hash'>;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate password if any password field is filled
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setMessage({ type: 'error', text: 'Password lama harus diisi' });
        setLoading(false);
        return;
      }
      if (!newPassword) {
        setMessage({ type: 'error', text: 'Password baru harus diisi' });
        setLoading(false);
        return;
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak sama' });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email,
          ...(currentPassword && newPassword && {
            currentPassword,
            newPassword
          })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil');
      }

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      
      // Clear password fields if password was changed
      if (currentPassword && newPassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui profil' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-horizontal" onSubmit={handleSubmit}>
      {message && (
        <div
          className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}
          role="alert"
        >
          {message.text}
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Tutup"
            onClick={() => setMessage(null)}
          ></button>
        </div>
      )}

      <div className="form-group row mb-3">
        <label htmlFor="inputName" className="col-sm-2 col-form-label">
          Nama
        </label>
        <div className="col-sm-10">
          <input
            type="text"
            className="form-control"
            id="inputName"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="form-group row mb-3">
        <label htmlFor="inputEmail" className="col-sm-2 col-form-label">
          Email
        </label>
        <div className="col-sm-10">
          <input
            type="email"
            className="form-control"
            id="inputEmail"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="form-group row mb-3">
        <label htmlFor="inputRole" className="col-sm-2 col-form-label">
          Peran
        </label>
        <div className="col-sm-10">
          <input
            type="text"
            className="form-control"
            id="inputRole"
            value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            disabled
          />
          <small className="form-text text-muted">Peran tidak dapat diubah</small>
        </div>
      </div>

      <hr className="my-4" />
      <h5 className="mb-3">Ubah Password</h5>
      
      <div className="form-group row mb-3">
        <label htmlFor="inputCurrentPassword" className="col-sm-2 col-form-label">
          Password Lama
        </label>
        <div className="col-sm-10">
          <input
            type="password"
            className="form-control"
            id="inputCurrentPassword"
            placeholder="Masukkan password lama"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="form-group row mb-3">
        <label htmlFor="inputNewPassword" className="col-sm-2 col-form-label">
          Password Baru
        </label>
        <div className="col-sm-10">
          <input
            type="password"
            className="form-control"
            id="inputNewPassword"
            placeholder="Masukkan password baru (minimal 6 karakter)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="form-group row mb-3">
        <label htmlFor="inputConfirmPassword" className="col-sm-2 col-form-label">
          Konfirmasi Password
        </label>
        <div className="col-sm-10">
          <input
            type="password"
            className="form-control"
            id="inputConfirmPassword"
            placeholder="Konfirmasi password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      
      <div className="form-group row">
        <div className="offset-sm-2 col-sm-10">
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? 'Memperbarui...' : 'Perbarui'}
          </button>
        </div>
      </div>
    </form>
  );
}

