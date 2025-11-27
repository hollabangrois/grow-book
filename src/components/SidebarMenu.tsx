'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarMenuProps {
  userRole: string;
}

export default function SidebarMenu({ userRole }: SidebarMenuProps) {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';
  const isTrainings = pathname.includes('/trainings') && !pathname.includes('/training-participants');
  const isParticipants = pathname === '/dashboard/participants';
  const isTrainingParticipants = pathname.includes('/training-participants');
  const isReports = pathname === '/dashboard/reports';
  const isUsers = pathname === '/dashboard/users';

  const isTrainingParticipantsOpen = isTrainingParticipants;

  return (
    <nav className="mt-2">
      <ul
        className="nav sidebar-menu flex-column"
        data-lte-toggle="treeview"
        role="navigation"
        aria-label="Navigasi Utama"
        data-accordion="false"
      >
        {/* Main Menu */}
        <li className="nav-header">MENU UTAMA</li>
        <li className="nav-item">
          <Link href="/dashboard" className={`nav-link ${isDashboard ? 'active' : ''}`}>
            <i className="nav-icon bi bi-speedometer2"></i>
            <p>Dashboard</p>
          </Link>
        </li>

        {/* Management Section */}
        <li className="nav-header mt-3">MANAJEMEN</li>
        <li className="nav-item">
          <Link href="/dashboard/trainings" className={`nav-link ${isTrainings ? 'active' : ''}`}>
            <i className="nav-icon bi bi-book-fill"></i>
            <p>Pelatihan</p>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/dashboard/participants" className={`nav-link ${isParticipants ? 'active' : ''}`}>
            <i className="nav-icon bi bi-people-fill"></i>
            <p>Peserta</p>
          </Link>
        </li>
        <li className={`nav-item ${isTrainingParticipantsOpen ? 'menu-open' : ''}`}>
          <a href="#" className={`nav-link ${isTrainingParticipantsOpen ? 'active' : ''}`}>
            <i className="nav-icon bi bi-person-check-fill"></i>
            <p>
              Peserta Pelatihan
              <i className="nav-arrow bi bi-chevron-right ms-auto"></i>
            </p>
          </a>
          <ul className="nav nav-treeview">
            <li className="nav-item">
              <Link
                href="/dashboard/training-participants/register"
                className={`nav-link ${pathname.includes('/register') ? 'active' : ''}`}
              >
                <i className="nav-icon bi bi-person-plus"></i>
                <p>Daftarkan Peserta</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/dashboard/training-participants/attendance"
                className={`nav-link ${pathname.includes('/attendance') ? 'active' : ''}`}
              >
                <i className="nav-icon bi bi-calendar-check"></i>
                <p>Kehadiran</p>
              </Link>
            </li>
          </ul>
        </li>

        {/* Reports Section */}
        <li className="nav-header mt-3">LAPORAN</li>
        <li className="nav-item">
          <Link href="/dashboard/reports" className={`nav-link ${isReports ? 'active' : ''}`}>
            <i className="nav-icon bi bi-file-earmark-text-fill"></i>
            <p>Laporan</p>
          </Link>
        </li>

        {/* Settings Section (Admin Only) */}
        {userRole === 'admin' && (
          <>
            <li className="nav-header mt-3">PENGATURAN</li>
            <li className="nav-item">
              <Link href="/dashboard/users" className={`nav-link ${isUsers ? 'active' : ''}`}>
                <i className="nav-icon bi bi-person-gear"></i>
                <p>Pengguna</p>
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

