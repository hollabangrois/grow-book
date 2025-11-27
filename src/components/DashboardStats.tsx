'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalTrainings: number;
  totalParticipants: number;
  upcomingTrainings: number;
  attendanceRate: number;
  ongoingTrainings: number;
  completedTrainings: number;
  recentTrainings: Array<{
    id: string;
    title: string;
    status: string;
    training_date: string | null;
    location: string | null;
  }>;
  upcomingTrainingsList: Array<{
    id: string;
    title: string;
    status: string;
    training_date: string | null;
    location: string | null;
    start_time: string | null;
  }>;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Memuat...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="row">
        <div className="col-lg-3 col-6">
          <div className="small-box text-bg-primary">
            <div className="inner">
              <h3>{stats.totalTrainings}</h3>
              <p>Total Pelatihan</p>
            </div>
            <svg
              className="small-box-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"></path>
            </svg>
            <Link
              href="/dashboard/trainings"
              className="small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover"
            >
              Info lebih lanjut <i className="bi bi-link-45deg"></i>
            </Link>
          </div>
        </div>
        
        <div className="col-lg-3 col-6">
          <div className="small-box text-bg-success">
            <div className="inner">
              <h3>{stats.attendanceRate.toFixed(1)}<sup className="fs-5">%</sup></h3>
              <p>Tingkat Kehadiran</p>
            </div>
            <svg
              className="small-box-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z"></path>
            </svg>
            <Link
              href="/dashboard/training-participants/attendance"
              className="small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover"
            >
              Info lebih lanjut <i className="bi bi-link-45deg"></i>
            </Link>
          </div>
        </div>
        
        <div className="col-lg-3 col-6">
          <div className="small-box text-bg-warning">
            <div className="inner">
              <h3>{stats.totalParticipants}</h3>
              <p>Total Peserta</p>
            </div>
            <svg
              className="small-box-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z"></path>
            </svg>
            <Link
              href="/dashboard/participants"
              className="small-box-footer link-dark link-underline-opacity-0 link-underline-opacity-50-hover"
            >
              Info lebih lanjut <i className="bi bi-link-45deg"></i>
            </Link>
          </div>
        </div>
        
        <div className="col-lg-3 col-6">
          <div className="small-box text-bg-danger">
            <div className="inner">
              <h3>{stats.upcomingTrainings}</h3>
              <p>Pelatihan Mendatang</p>
            </div>
            <svg
              className="small-box-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                clipRule="evenodd"
                fillRule="evenodd"
                d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
              ></path>
              <path
                clipRule="evenodd"
                fillRule="evenodd"
                d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
              ></path>
            </svg>
            <Link
              href="/dashboard/trainings"
              className="small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover"
            >
              Info lebih lanjut <i className="bi bi-link-45deg"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="row mt-3">
        <div className="col-lg-6 col-6">
          <div className="small-box text-bg-info">
            <div className="inner">
              <h3>{stats.ongoingTrainings}</h3>
              <p>Pelatihan Berlangsung</p>
            </div>
            <svg
              className="small-box-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            <Link
              href="/dashboard/trainings"
              className="small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover"
            >
              Info lebih lanjut <i className="bi bi-link-45deg"></i>
            </Link>
          </div>
        </div>
        <div className="col-lg-6 col-6">
          <div className="small-box text-bg-secondary">
            <div className="inner">
              <h3>{stats.completedTrainings}</h3>
              <p>Pelatihan Selesai</p>
            </div>
            <svg
              className="small-box-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            <Link
              href="/dashboard/trainings"
              className="small-box-footer link-light link-underline-opacity-0 link-underline-opacity-50-hover"
            >
              Info lebih lanjut <i className="bi bi-link-45deg"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent and Upcoming Trainings */}
      <div className="row mt-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-clock-history me-2"></i>
                Pelatihan Terbaru
              </h3>
            </div>
            <div className="card-body p-0">
              {stats.recentTrainings.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  Belum ada pelatihan
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Judul</th>
                        <th>Status</th>
                        <th>Lokasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTrainings.map((training) => (
                        <tr key={training.id}>
                          <td>
                            <Link href={`/dashboard/trainings`} className="text-decoration-none">
                              {training.title}
                            </Link>
                          </td>
                          <td>
                            <span className={`badge ${
                              training.status === 'completed' ? 'text-bg-success' :
                              training.status === 'ongoing' ? 'text-bg-primary' :
                              training.status === 'cancelled' ? 'text-bg-danger' :
                              'text-bg-warning'
                            }`}>
                              {training.status === 'scheduled' ? 'Terjadwal' :
                               training.status === 'ongoing' ? 'Berlangsung' :
                               training.status === 'completed' ? 'Selesai' :
                               training.status === 'cancelled' ? 'Dibatalkan' : training.status}
                            </span>
                          </td>
                          <td>{training.location || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card-footer">
              <Link href="/dashboard/trainings" className="btn btn-sm btn-primary">
                Lihat Semua Pelatihan
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-calendar-event me-2"></i>
                Pelatihan Mendatang
              </h3>
            </div>
            <div className="card-body p-0">
              {stats.upcomingTrainingsList.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  Tidak ada pelatihan mendatang
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Judul</th>
                        <th>Tanggal</th>
                        <th>Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.upcomingTrainingsList.map((training) => (
                        <tr key={training.id}>
                          <td>
                            <Link href={`/dashboard/trainings`} className="text-decoration-none">
                              {training.title}
                            </Link>
                          </td>
                          <td>
                            {training.training_date
                              ? new Date(training.training_date).toLocaleDateString('id-ID')
                              : '-'}
                          </td>
                          <td>{training.start_time || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card-footer">
              <Link href="/dashboard/trainings" className="btn btn-sm btn-primary">
                Lihat Semua Pelatihan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="bi bi-lightning-charge me-2"></i>
                Akses Cepat
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-2">
                  <Link href="/dashboard/trainings" className="btn btn-outline-primary w-100">
                    <i className="bi bi-book me-2"></i>
                    Kelola Pelatihan
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link href="/dashboard/participants" className="btn btn-outline-success w-100">
                    <i className="bi bi-people me-2"></i>
                    Kelola Peserta
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link href="/dashboard/training-participants/attendance" className="btn btn-outline-info w-100">
                    <i className="bi bi-clipboard-check me-2"></i>
                    Kehadiran
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link href="/dashboard/reports" className="btn btn-outline-warning w-100">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Laporan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

