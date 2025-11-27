'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Participant } from '@/types/database';

interface ParticipantWithCount extends Participant {
  training_count?: number;
}

export default function ParticipantsTable() {
  const [participants, setParticipants] = useState<ParticipantWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  // Detail training modal
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithCount | null>(null);
  const [trainingDetails, setTrainingDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchParticipants();
    
    // Initialize modal when component mounts
    const initModal = () => {
      const modalElement = document.getElementById('participantModal');
      if (modalElement && (window as any).bootstrap) {
        // Modal will be initialized by Bootstrap automatically via data attributes
      }
    };
    
    // Wait for Bootstrap to be available
    if ((window as any).bootstrap) {
      initModal();
    } else {
      const checkBootstrap = setInterval(() => {
        if ((window as any).bootstrap) {
          initModal();
          clearInterval(checkBootstrap);
        }
      }, 100);
      
      return () => clearInterval(checkBootstrap);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [currentPage, searchTerm]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const url = searchTerm
        ? `/api/participants?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${limit}`
        : `/api/participants?page=${currentPage}&limit=${limit}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        if (result.data) {
          // With pagination
          setParticipants(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
          
          // Fetch training count for each participant
          const participantsWithCount = await Promise.all(
            result.data.map(async (p: Participant) => {
              try {
                const countResponse = await fetch(`/api/participants/${p.id}/training-count`);
                if (countResponse.ok) {
                  const countData = await countResponse.json();
                  return { ...p, training_count: countData.count || 0 };
                }
              } catch (error) {
                console.error('Error fetching training count:', error);
              }
              return { ...p, training_count: 0 };
            })
          );
          setParticipants(participantsWithCount);
        } else {
          // Without pagination (fallback)
          setParticipants(result);
          setTotal(result.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrainings = async (participant: ParticipantWithCount) => {
    setSelectedParticipant(participant);
    setLoadingDetails(true);
    setTrainingDetails([]);
    
    try {
      const response = await fetch(`/api/participants/${participant.id}/trainings`);
      if (response.ok) {
        const data = await response.json();
        setTrainingDetails(data);
      }
    } catch (error) {
      console.error('Error fetching training details:', error);
      setMessage({ type: 'error', text: 'Gagal memuat detail pelatihan' });
    } finally {
      setLoadingDetails(false);
      setTimeout(() => {
        const modalElement = document.getElementById('trainingDetailsModal');
        if (modalElement && (window as any).bootstrap) {
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.show();
        }
      }, 10);
    }
  };

  const handleCreate = () => {
    setEditingParticipant(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setMessage(null);
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const modalElement = document.getElementById('participantModal');
      if (modalElement) {
        if ((window as any).bootstrap) {
          let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (!modal) {
            modal = new (window as any).bootstrap.Modal(modalElement);
          }
          modal.show();
        } else {
          // Fallback: trigger click on hidden button with data attributes
          const triggerBtn = document.createElement('button');
          triggerBtn.setAttribute('data-bs-toggle', 'modal');
          triggerBtn.setAttribute('data-bs-target', '#participantModal');
          triggerBtn.style.display = 'none';
          document.body.appendChild(triggerBtn);
          triggerBtn.click();
          document.body.removeChild(triggerBtn);
        }
      }
    }, 10);
  };

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      email: participant.email,
      phone: participant.phone || '',
      address: participant.address || '',
    });
    setMessage(null);
    
    const showModal = () => {
      const modalElement = document.getElementById('participantModal');
      if (modalElement && (window as any).bootstrap) {
        let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
          modal = new (window as any).bootstrap.Modal(modalElement);
        }
        modal.show();
      } else if (modalElement) {
        setTimeout(showModal, 100);
      }
    };
    
    if ((window as any).bootstrap) {
      showModal();
    } else {
      setTimeout(showModal, 100);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) return;

    try {
      const response = await fetch(`/api/participants/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Participant deleted successfully!' });
        fetchParticipants();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete participant' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete participant' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const url = editingParticipant
        ? `/api/participants/${editingParticipant.id}`
        : '/api/participants';
      const method = editingParticipant ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: editingParticipant ? 'Participant updated!' : 'Participant created!' });
        const modalElement = document.getElementById('participantModal');
        if (modalElement) {
          const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        fetchParticipants();
        setFormData({ name: '', email: '', phone: '', address: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save participant' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save participant' });
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Daftar Peserta</h3>
          <div className="card-tools">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
              data-bs-toggle="modal"
              data-bs-target="#participantModal"
            >
              <i className="bi bi-plus-lg me-1"></i>Tambah Baru
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Search */}
          <div className="mb-3">
            <div className="row">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari nama peserta..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="col-md-6 text-end">
                <small className="text-muted">
                  Menampilkan {participants.length} dari {total} peserta
                </small>
              </div>
            </div>
          </div>

          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Alamat</th>
                <th className="text-center">Jumlah Pelatihan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Memuat...</span>
                    </div>
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Tidak ada peserta ditemukan
                  </td>
                </tr>
              ) : (
                participants.map((participant) => (
                  <tr key={participant.id}>
                    <td>{participant.name}</td>
                    <td>{participant.email}</td>
                    <td>{participant.phone || '-'}</td>
                    <td>{participant.address || '-'}</td>
                    <td className="text-center">
                      <span className="badge text-bg-info">
                        {participant.training_count ?? 0} pelatihan
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-success me-1"
                        onClick={() => handleViewTrainings(participant)}
                        title="Lihat detail pelatihan"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-info me-1"
                        onClick={() => handleEdit(participant)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(participant.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      <Modal
        id="participantModal"
        title={editingParticipant ? 'Edit Participant' : 'Add New Participant'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
              {message.text}
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <input
              type="tel"
              className="form-control"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <textarea
              className="form-control"
              id="address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingParticipant ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Training Details Modal */}
      <Modal id="trainingDetailsModal" title={`Detail Pelatihan - ${selectedParticipant?.name || ''}`} size="xl">
        {loadingDetails ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Memuat...</span>
            </div>
          </div>
        ) : trainingDetails.length === 0 ? (
          <div className="alert alert-info">
            Peserta ini belum mengikuti pelatihan apapun.
          </div>
        ) : (
          <div>
            {trainingDetails.map((training: any, index: number) => (
              <div key={index} className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0">{training.training?.title || 'Pelatihan'}</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <strong>Status Pendaftaran:</strong>{' '}
                      <span className={`badge ${
                        training.attendance_status === 'attended' ? 'text-bg-success' :
                        training.attendance_status === 'absent' ? 'text-bg-danger' :
                        training.attendance_status === 'cancelled' ? 'text-bg-secondary' :
                        'text-bg-warning'
                      }`}>
                        {training.attendance_status === 'attended' ? 'Hadir' :
                         training.attendance_status === 'absent' ? 'Tidak Hadir' :
                         training.attendance_status === 'cancelled' ? 'Dibatalkan' :
                         'Terdaftar'}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <strong>Tanggal Pendaftaran:</strong>{' '}
                      {new Date(training.registration_date).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  {training.days && training.days.length > 0 && (
                    <div>
                      <strong>Kehadiran per Hari:</strong>
                      <div className="table-responsive mt-2">
                        <table className="table table-sm table-bordered">
                          <thead>
                            <tr>
                              <th>Hari</th>
                              <th>Tanggal</th>
                              <th>Waktu Mulai</th>
                              <th>Waktu Selesai</th>
                              <th>Status</th>
                              <th>Waktu Kehadiran</th>
                            </tr>
                          </thead>
                          <tbody>
                            {training.days.map((day: any, dayIndex: number) => (
                              <tr key={dayIndex}>
                                <td>Hari {day.day_number}</td>
                                <td>{new Date(day.training_date).toLocaleDateString('id-ID')}</td>
                                <td>{day.start_time}</td>
                                <td>{day.end_time}</td>
                                <td>
                                  {day.attendance ? (
                                    <span className={`badge ${
                                      day.attendance.attendance_status === 'attended' ? 'text-bg-success' :
                                      day.attendance.attendance_status === 'absent' ? 'text-bg-danger' :
                                      day.attendance.attendance_status === 'cancelled' ? 'text-bg-secondary' :
                                      'text-bg-warning'
                                    }`}>
                                      {day.attendance.attendance_status === 'attended' ? 'Hadir' :
                                       day.attendance.attendance_status === 'absent' ? 'Tidak Hadir' :
                                       day.attendance.attendance_status === 'cancelled' ? 'Dibatalkan' :
                                       'Terdaftar'}
                                    </span>
                                  ) : (
                                    <span className="badge text-bg-secondary">Belum ada data</span>
                                  )}
                                </td>
                                <td>
                                  {day.attendance?.attendance_time
                                    ? new Date(day.attendance.attendance_time).toLocaleString('id-ID')
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
            Tutup
          </button>
        </div>
      </Modal>
    </>
  );
}

