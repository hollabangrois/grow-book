import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import DashboardStats from '@/components/DashboardStats';
import HelpAccordion from '@/components/HelpAccordion';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const session = await getSessionByToken(sessionToken);

  if (!session) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <>
      <BreadcrumbHeader
        title="Dashboard"
        breadcrumbs={[
          { label: 'Beranda', href: '/dashboard' },
          { label: 'Dashboard' },
        ]}
      />
      
      {/* Welcome Card */}
      <div className="row mb-4">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">
                <i className="bi bi-house-door me-2"></i>
                Selamat Datang, {user.name || user.email}!
              </h3>
            </div>
            <div className="card-body">
              <p className="mb-2">
                Anda masuk sebagai <strong>{user.role === 'admin' ? 'Administrator' : user.role === 'instructor' ? 'Instruktur' : 'Pengguna'}</strong>.
              </p>
              <p className="mb-0">
                Dashboard ini menampilkan ringkasan informasi penting tentang sistem manajemen pelatihan Anda. 
                Gunakan menu navigasi untuk mengakses fitur-fitur yang tersedia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics */}
      <DashboardStats />

      {/* Information Cards */}
      <div className="row mt-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-info-circle me-2"></i>
                Informasi Aplikasi
              </h3>
            </div>
            <div className="card-body">
              <h5>Sistem Manajemen Pelatihan</h5>
              <p>
                Aplikasi ini membantu Anda mengelola pelatihan, peserta, dan kehadiran dengan mudah dan efisien.
              </p>
              <hr />
              <h6>Fitur Utama:</h6>
              <ul>
                <li><strong>Manajemen Pelatihan:</strong> Buat, edit, dan kelola pelatihan dengan sistem multi-hari</li>
                <li><strong>Manajemen Peserta:</strong> Kelola data peserta dan pendaftaran pelatihan</li>
                <li><strong>Kehadiran:</strong> Catat kehadiran per hari dengan waktu kehadiran yang detail</li>
                <li><strong>Laporan:</strong> Generate laporan pelatihan dalam format PDF</li>
                <li><strong>Statistik:</strong> Pantau statistik kehadiran dan pelatihan secara real-time</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-question-circle me-2"></i>
                Panduan Cepat
              </h3>
            </div>
            <div className="card-body">
              <h5>Cara Menggunakan Aplikasi</h5>
              <HelpAccordion />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
