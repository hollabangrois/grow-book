'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Training, TrainingDay } from '@/types/database';

interface TrainingDayForm {
  day_number: number;
  training_date: string;
  start_time: string;
  end_time: string;
  location: string;
  instructor: string;
  description: string;
}

export default function TrainingsTable() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    instructor: '',
    max_participants: '',
    status: 'scheduled' as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
  });
  const [trainingDays, setTrainingDays] = useState<TrainingDayForm[]>([
    {
      day_number: 1,
      training_date: '',
      start_time: '',
      end_time: '',
      location: '',
      instructor: '',
      description: '',
    },
  ]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTrainings();
    
    if (!(window as any).bootstrap) {
      const checkBootstrap = setInterval(() => {
        if ((window as any).bootstrap) {
          clearInterval(checkBootstrap);
        }
      }, 100);
      
      return () => clearInterval(checkBootstrap);
    }
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch('/api/trainings');
      const data = await response.json();
      if (response.ok) {
        setTrainings(data);
      }
    } catch (error) {
      console.error('Error fetching trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTraining(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      instructor: '',
      max_participants: '',
      status: 'scheduled',
    });
    setTrainingDays([
      {
        day_number: 1,
        training_date: '',
        start_time: '',
        end_time: '',
        location: '',
        instructor: '',
        description: '',
      },
    ]);
    setMessage(null);
    
    setTimeout(() => {
      const modalElement = document.getElementById('trainingModal');
      if (modalElement) {
        if ((window as any).bootstrap) {
          let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (!modal) {
            modal = new (window as any).bootstrap.Modal(modalElement);
          }
          modal.show();
        } else {
          const triggerBtn = document.createElement('button');
          triggerBtn.setAttribute('data-bs-toggle', 'modal');
          triggerBtn.setAttribute('data-bs-target', '#trainingModal');
          triggerBtn.style.display = 'none';
          document.body.appendChild(triggerBtn);
          triggerBtn.click();
          document.body.removeChild(triggerBtn);
        }
      }
    }, 10);
  };

  const handleEdit = async (training: Training) => {
    setEditingTraining(training);
    setFormData({
      title: training.title,
      description: training.description || '',
      location: training.location || '',
      instructor: training.instructor || '',
      max_participants: training.max_participants?.toString() || '',
      status: training.status,
    });
    
    // Fetch training days
    try {
      const response = await fetch(`/api/trainings/${training.id}/days`);
      if (response.ok) {
        const days: TrainingDay[] = await response.json();
        setTrainingDays(
          days.map((day) => ({
            day_number: day.day_number,
            training_date: day.training_date,
            start_time: day.start_time,
            end_time: day.end_time,
            location: day.location || '',
            instructor: day.instructor || '',
            description: day.description || '',
          }))
        );
      } else {
        setTrainingDays([
          {
            day_number: 1,
            training_date: '',
            start_time: '',
            end_time: '',
            location: '',
            instructor: '',
            description: '',
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching training days:', error);
      setTrainingDays([
        {
          day_number: 1,
          training_date: '',
          start_time: '',
          end_time: '',
          location: '',
          instructor: '',
          description: '',
        },
      ]);
    }
    
    setMessage(null);
    
    setTimeout(() => {
      const modalElement = document.getElementById('trainingModal');
      if (modalElement) {
        if ((window as any).bootstrap) {
          let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (!modal) {
            modal = new (window as any).bootstrap.Modal(modalElement);
          }
          modal.show();
        } else {
          const triggerBtn = document.createElement('button');
          triggerBtn.setAttribute('data-bs-toggle', 'modal');
          triggerBtn.setAttribute('data-bs-target', '#trainingModal');
          triggerBtn.style.display = 'none';
          document.body.appendChild(triggerBtn);
          triggerBtn.click();
          document.body.removeChild(triggerBtn);
        }
      }
    }, 10);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training?')) return;

    try {
      const response = await fetch(`/api/trainings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Training deleted successfully!' });
        fetchTrainings();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete training' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete training' });
    }
  };

  const addTrainingDay = () => {
    setTrainingDays([
      ...trainingDays,
      {
        day_number: trainingDays.length + 1,
        training_date: '',
        start_time: '',
        end_time: '',
        location: '',
        instructor: '',
        description: '',
      },
    ]);
  };

  const copyFromPreviousDay = (index: number) => {
    if (index === 0) return; // Can't copy from first day
    
    const previousDay = trainingDays[index - 1];
    const newDays = [...trainingDays];
    
    // Calculate next date (add 1 day to previous date)
    let nextDate = '';
    if (previousDay.training_date) {
      const prevDate = new Date(previousDay.training_date);
      prevDate.setDate(prevDate.getDate() + 1);
      nextDate = prevDate.toISOString().split('T')[0];
    }
    
    newDays[index] = {
      ...newDays[index],
      training_date: nextDate || previousDay.training_date,
      start_time: previousDay.start_time,
      end_time: previousDay.end_time,
      location: previousDay.location,
      instructor: previousDay.instructor,
      description: previousDay.description,
    };
    setTrainingDays(newDays);
  };

  const removeTrainingDay = (index: number) => {
    if (trainingDays.length > 1) {
      const newDays = trainingDays.filter((_, i) => i !== index);
      // Renumber days
      const renumberedDays = newDays.map((day, i) => ({
        ...day,
        day_number: i + 1,
      }));
      setTrainingDays(renumberedDays);
    }
  };

  const updateTrainingDay = (index: number, field: keyof TrainingDayForm, value: string) => {
    const newDays = [...trainingDays];
    newDays[index] = { ...newDays[index], [field]: value };
    setTrainingDays(newDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate training days
    if (trainingDays.length === 0) {
        setMessage({ type: 'error', text: 'Minimal satu hari pelatihan diperlukan' });
      return;
    }

    for (const day of trainingDays) {
      if (!day.training_date || !day.start_time || !day.end_time) {
        setMessage({ type: 'error', text: 'Semua hari pelatihan harus memiliki tanggal, waktu mulai, dan waktu selesai' });
        return;
      }
    }

    try {
      const url = editingTraining ? `/api/trainings/${editingTraining.id}` : '/api/trainings';
      const method = editingTraining ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          days: trainingDays,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: editingTraining ? 'Pelatihan berhasil diperbarui!' : 'Pelatihan berhasil dibuat!' });
        const modalElement = document.getElementById('trainingModal');
        if (modalElement) {
          const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        fetchTrainings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pelatihan' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pelatihan' });
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p>Memuat...</p>
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
          <h3 className="card-title">Daftar Pelatihan</h3>
          <div className="card-tools">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
              data-bs-toggle="modal"
              data-bs-target="#trainingModal"
            >
              <i className="bi bi-plus-lg me-1"></i>Tambah Baru
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Hari</th>
                  <th>Rentang Tanggal</th>
                  <th>Lokasi</th>
                  <th>Instruktur</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {trainings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      Tidak ada pelatihan ditemukan
                    </td>
                  </tr>
                ) : (
                  trainings.map((training) => (
                    <TrainingRow key={training.id} training={training} onEdit={handleEdit} onDelete={handleDelete} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal id="trainingModal" title={editingTraining ? 'Edit Pelatihan' : 'Tambah Pelatihan Baru'} size="xl">
        <form onSubmit={handleSubmit}>
          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
              {message.text}
            </div>
          )}
          <div className="row">
            <div className="col-md-8 mb-3">
              <label htmlFor="title" className="form-label">
                Judul <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="status" className="form-label">
                Status <span className="text-danger">*</span>
              </label>
              <select
                className="form-control"
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Training['status'] })}
                required
              >
                <option value="scheduled">Terjadwal</option>
                <option value="ongoing">Berlangsung</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Deskripsi
            </label>
            <textarea
              className="form-control"
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="location" className="form-label">
                Lokasi
              </label>
              <input
                type="text"
                className="form-control"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="instructor" className="form-label">
                Instruktur
              </label>
              <input
                type="text"
                className="form-control"
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="max_participants" className="form-label">
              Maksimal Peserta
            </label>
            <input
              type="number"
              className="form-control"
              id="max_participants"
              min="1"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
            />
          </div>

          <hr />
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Hari Pelatihan</h5>
            <button type="button" className="btn btn-sm btn-success" onClick={addTrainingDay}>
              <i className="bi bi-plus-lg me-1"></i>Tambah Hari
            </button>
          </div>

          {trainingDays.map((day, index) => (
            <div key={index} className="card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>Hari {day.day_number}</strong>
                <div>
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-info me-2"
                      onClick={() => copyFromPreviousDay(index)}
                      title="Salin dari hari sebelumnya"
                    >
                      <i className="bi bi-copy me-1"></i>Salin Sebelumnya
                    </button>
                  )}
                  {trainingDays.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeTrainingDay(index)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <label className="form-label">
                      Tanggal <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={day.training_date}
                      onChange={(e) => updateTrainingDay(index, 'training_date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label">
                      Waktu Mulai <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={day.start_time}
                      onChange={(e) => updateTrainingDay(index, 'start_time', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label">
                      Waktu Selesai <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={day.end_time}
                      onChange={(e) => updateTrainingDay(index, 'end_time', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={day.location}
                      onChange={(e) => updateTrainingDay(index, 'location', e.target.value)}
                      placeholder="Kosongkan untuk menggunakan lokasi pelatihan"
                    />
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label">Instructor</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={day.instructor}
                      onChange={(e) => updateTrainingDay(index, 'instructor', e.target.value)}
                      placeholder="Kosongkan untuk menggunakan instruktur pelatihan"
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={day.description}
                    onChange={(e) => updateTrainingDay(index, 'description', e.target.value)}
                    placeholder="Deskripsi khusus hari (opsional)"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTraining ? 'Perbarui' : 'Buat'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// Component to display training row with days
function TrainingRow({
  training,
  onEdit,
  onDelete,
}: {
  training: Training;
  onEdit: (training: Training) => void;
  onDelete: (id: string) => void;
}) {
  const [days, setDays] = useState<TrainingDay[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);

  useEffect(() => {
    fetchTrainingDays();
  }, [training.id]);

  const fetchTrainingDays = async () => {
    try {
      const response = await fetch(`/api/trainings/${training.id}/days`);
      if (response.ok) {
        const data = await response.json();
        setDays(data);
      }
    } catch (error) {
      console.error('Error fetching training days:', error);
    } finally {
      setLoadingDays(false);
    }
  };

  const getDateRange = () => {
    if (days.length === 0) return '-';
    const sortedDays = [...days].sort((a, b) => 
      new Date(a.training_date).getTime() - new Date(b.training_date).getTime()
    );
    const firstDate = new Date(sortedDays[0].training_date).toLocaleDateString();
    const lastDate = new Date(sortedDays[sortedDays.length - 1].training_date).toLocaleDateString();
    return firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
  };

  return (
    <tr>
      <td>{training.title}</td>
      <td>
        {loadingDays ? (
          <span className="text-muted">Memuat...</span>
        ) : (
          <span className="badge text-bg-info">{days.length} hari</span>
        )}
      </td>
      <td>{loadingDays ? '-' : getDateRange()}</td>
      <td>{training.location || '-'}</td>
      <td>{training.instructor || '-'}</td>
      <td>
        <span
          className={`badge ${
            training.status === 'completed'
              ? 'text-bg-success'
              : training.status === 'ongoing'
              ? 'text-bg-primary'
              : training.status === 'cancelled'
              ? 'text-bg-danger'
              : 'text-bg-warning'
          }`}
        >
          {training.status === 'scheduled' ? 'Terjadwal' : 
           training.status === 'ongoing' ? 'Berlangsung' :
           training.status === 'completed' ? 'Selesai' :
           training.status === 'cancelled' ? 'Dibatalkan' : training.status}
        </span>
      </td>
      <td>
        <div className="d-flex gap-1 flex-wrap">
          <button 
            className="btn btn-sm btn-info" 
            onClick={() => onEdit(training)}
            title="Edit pelatihan"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button 
            className="btn btn-sm btn-danger" 
            onClick={() => onDelete(training.id)}
            title="Hapus pelatihan"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
