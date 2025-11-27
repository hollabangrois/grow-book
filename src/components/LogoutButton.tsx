'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setLoading(false);
    }
  };

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        handleLogout();
      }}
      className="btn btn-default btn-flat float-end"
      style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}
    >
      {loading ? 'Keluar...' : 'Keluar'}
    </a>
  );
}

