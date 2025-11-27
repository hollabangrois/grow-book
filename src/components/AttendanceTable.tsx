'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Training, TrainingDay } from '@/types/database';

interface TrainingParticipant {
  id: string;
  participant_id: string;
  training_id: string;
  registration_date: string;
  attendance_status: 'registered' | 'attended' | 'absent' | 'cancelled';
  attendance_time: string | null;
  notes: string | null;
  participant: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  training: {
    id: string;
    title: string;
  };
}

interface DailyAttendanceData {
  training_day_id: string;
  day_number: number;
  training_date: string;
  attendance_status: 'registered' | 'attended' | 'absent' | 'cancelled';
  attendance_time: string | null;
  notes: string | null;
}

export default function AttendanceTable() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAttendance, setEditingAttendance] = useState<{
    participant: TrainingParticipant;
    day: TrainingDay;
    attendance: DailyAttendanceData | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    attendance_status: 'registered' as 'registered' | 'attended' | 'absent' | 'cancelled',
    attendance_time: '',
    use_event_time: false,
    notes: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // State untuk batch edit
  const [batchEditingAttendance, setBatchEditingAttendance] = useState<{
    participant: TrainingParticipant;
  } | null>(null);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [batchFormData, setBatchFormData] = useState({
    attendance_status: 'registered' as 'registered' | 'attended' | 'absent' | 'cancelled',
    attendance_time: '',
    use_event_time: false,
    notes: '',
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  useEffect(() => {
    if (selectedTraining) {
      fetchTrainingDays();
      fetchTrainingParticipants();
    } else {
      setParticipants([]);
      setTrainingDays([]);
    }
  }, [selectedTraining]);

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

  const fetchTrainingDays = async () => {
    if (!selectedTraining) return;

    try {
      const response = await fetch(`/api/trainings/${selectedTraining}/days`);
      if (response.ok) {
        const data = await response.json();
        setTrainingDays(data);
      }
    } catch (error) {
      console.error('Error fetching training days:', error);
    }
  };

  const fetchTrainingParticipants = async () => {
    if (!selectedTraining) return;

    try {
      const response = await fetch(`/api/training-participants/training/${selectedTraining}`);
      const data = await response.json();
      if (response.ok) {
        setParticipants(data);
      }
    } catch (error) {
      console.error('Error fetching training participants:', error);
    }
  };

  const handleEditAttendance = async (participant: TrainingParticipant, day: TrainingDay) => {
    try {
      // Fetch existing attendance for this participant and day
      const response = await fetch(
        `/api/daily-attendance/${participant.participant.id}/${day.id}`
      );
      let attendance: DailyAttendanceData | null = null;

      if (response.ok) {
        const data = await response.json();
        attendance = {
          training_day_id: day.id,
          day_number: day.day_number,
          training_date: day.training_date,
          attendance_status: data.attendance_status || 'registered',
          attendance_time: data.attendance_time,
          notes: data.notes || null,
        };
      } else {
        attendance = {
          training_day_id: day.id,
          day_number: day.day_number,
          training_date: day.training_date,
          attendance_status: 'registered',
          attendance_time: null,
          notes: null,
        };
      }

      setEditingAttendance({ participant, day, attendance });
      
      // Format attendance_time for time input (HH:mm only)
      let formattedTime = '';
      if (attendance.attendance_time) {
        const date = new Date(attendance.attendance_time);
        // Format as HH:mm for time input
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        formattedTime = `${hours}:${minutes}`;
      }
      
      setFormData({
        attendance_status: attendance.attendance_status,
        attendance_time: formattedTime,
        use_event_time: false,
        notes: attendance.notes || '',
      });

      setTimeout(() => {
        const modalElement = document.getElementById('attendanceModal');
        if (modalElement) {
          if ((window as any).bootstrap) {
            let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (!modal) {
              modal = new (window as any).bootstrap.Modal(modalElement);
            }
            modal.show();
          }
        }
      }, 10);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data kehadiran' });
    }
  };

  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!editingAttendance) return;

    try {
      // Determine attendance_time based on status and user input
      let attendanceTime: string | null = null;
      
      if (formData.attendance_status === 'attended') {
        if (formData.use_event_time) {
          // Use event start time
          const eventDate = new Date(editingAttendance.day.training_date);
          const [hours, minutes] = editingAttendance.day.start_time.split(':');
          eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          attendanceTime = eventDate.toISOString();
        } else if (formData.attendance_time) {
          // Use manually entered time - combine with training day date
          const trainingDate = new Date(editingAttendance.day.training_date);
          const [hours, minutes] = formData.attendance_time.split(':');
          trainingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          attendanceTime = trainingDate.toISOString();
        } else {
          // Default to current time if no time specified
          attendanceTime = new Date().toISOString();
        }
      }

      const response = await fetch('/api/daily-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_participant_id: editingAttendance.participant.id, // This is the training_participants.id
          training_day_id: editingAttendance.day.id,
          attendance_status: formData.attendance_status,
          attendance_time: attendanceTime,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Kehadiran berhasil diperbarui!' });
        const modalElement = document.getElementById('attendanceModal');
        if (modalElement) {
          const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        setEditingAttendance(null);
        // Trigger refresh event for all AttendanceRow components
        // Add small delay to ensure database update is complete
        setTimeout(() => {
          window.dispatchEvent(new Event('attendance-updated'));
          fetchTrainingParticipants();
        }, 300);
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memperbarui kehadiran' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui kehadiran' });
    }
  };

  const handleUnregister = async (participantId: string, trainingId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pendaftaran peserta ini?')) return;

    try {
      const response = await fetch(`/api/training-participants/${participantId}/${trainingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Peserta berhasil dibatalkan pendaftarannya!' });
        fetchTrainingParticipants();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Gagal membatalkan pendaftaran peserta' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal membatalkan pendaftaran peserta' });
    }
  };

  const handleBatchEditAttendance = (participant: TrainingParticipant) => {
    setBatchEditingAttendance({ participant });
    setSelectedDays(new Set());
    setBatchFormData({
      attendance_status: 'registered',
      attendance_time: '',
      use_event_time: false,
      notes: '',
    });
    setTimeout(() => {
      const modalElement = document.getElementById('batchAttendanceModal');
      if (modalElement) {
        if ((window as any).bootstrap) {
          let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (!modal) {
            modal = new (window as any).bootstrap.Modal(modalElement);
          }
          modal.show();
        }
      }
    }, 10);
  };

  const handleBatchUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!batchEditingAttendance || selectedDays.size === 0) {
      setMessage({ type: 'error', text: 'Silakan pilih minimal satu hari pelatihan' });
      return;
    }

    try {
      const selectedDayIds = Array.from(selectedDays);
      let successCount = 0;
      let errorCount = 0;

      // Update each selected day
      for (const dayId of selectedDayIds) {
        const day = trainingDays.find(d => d.id === dayId);
        if (!day) continue;

        // Determine attendance_time based on status and user input
        let attendanceTime: string | null = null;
        
        if (batchFormData.attendance_status === 'attended') {
          if (batchFormData.use_event_time) {
            // Use event start time
            const eventDate = new Date(day.training_date);
            const [hours, minutes] = day.start_time.split(':');
            eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            attendanceTime = eventDate.toISOString();
          } else if (batchFormData.attendance_time) {
            // Use manually entered time - combine with training day date
            const trainingDate = new Date(day.training_date);
            const [hours, minutes] = batchFormData.attendance_time.split(':');
            trainingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            attendanceTime = trainingDate.toISOString();
          } else {
            // Default to current time if no time specified
            attendanceTime = new Date().toISOString();
          }
        }

        try {
          const response = await fetch('/api/daily-attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              training_participant_id: batchEditingAttendance.participant.id,
              training_day_id: dayId,
              attendance_status: batchFormData.attendance_status,
              attendance_time: attendanceTime,
              notes: batchFormData.notes || null,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setMessage({ type: 'success', text: `Kehadiran berhasil diperbarui untuk ${successCount} hari!` });
        const modalElement = document.getElementById('batchAttendanceModal');
        if (modalElement) {
          const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        setBatchEditingAttendance(null);
        setSelectedDays(new Set());
        // Trigger refresh event
        setTimeout(() => {
          window.dispatchEvent(new Event('attendance-updated'));
          fetchTrainingParticipants();
        }, 300);
      } else {
        setMessage({ type: 'error', text: `Berhasil memperbarui ${successCount} hari, gagal ${errorCount} hari` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui kehadiran' });
    }
  };

  const toggleDaySelection = (dayId: string) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayId)) {
      newSelected.delete(dayId);
    } else {
      newSelected.add(dayId);
    }
    setSelectedDays(newSelected);
  };

  const selectAllDays = () => {
    setSelectedDays(new Set(trainingDays.map(d => d.id)));
  };

  const deselectAllDays = () => {
    setSelectedDays(new Set());
  };

  const getAttendanceStatus = async (participantId: string, dayId: string) => {
    try {
      const response = await fetch(`/api/daily-attendance/${participantId}/${dayId}`);
      if (response.ok) {
        const data = await response.json();
        return data.attendance_status || 'registered';
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
    return 'registered';
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
          <h3 className="card-title">Kehadiran Pelatihan</h3>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="trainingSelect" className="form-label">
              Pilih Pelatihan <span className="text-danger">*</span>
            </label>
            <select
              className="form-control"
              id="trainingSelect"
              value={selectedTraining}
              onChange={(e) => setSelectedTraining(e.target.value)}
            >
              <option value="">Pilih Pelatihan</option>
              {trainings.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.title} ({training.status})
                </option>
              ))}
            </select>
          </div>

          {selectedTraining && trainingDays.length > 0 && participants.length > 0 && (
            <div 
              className="table-responsive" 
              style={{ 
                overflowX: 'auto', 
                overflowY: 'visible',
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: '-ms-autohiding-scrollbar'
              }}
            >
              <table className="table table-bordered table-striped" style={{ minWidth: '800px', width: '100%', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ minWidth: '150px' }}>Peserta</th>
                    <th rowSpan={2} style={{ minWidth: '200px' }}>Email</th>
                    <th rowSpan={2} style={{ minWidth: '120px' }}>Telepon</th>
                    <th colSpan={trainingDays.length} className="text-center">
                      Hari Pelatihan
                    </th>
                    <th rowSpan={2} style={{ minWidth: '100px' }}>Aksi</th>
                  </tr>
                  <tr>
                    {trainingDays.map((day) => (
                      <th key={day.id} className="text-center" style={{ minWidth: '120px' }}>
                        <div>Hari {day.day_number}</div>
                        <small className="text-muted">
                          {new Date(day.training_date).toLocaleDateString()}
                        </small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((tp) => (
                    <AttendanceRow
                      key={`${tp.id}-${trainingDays.map(d => d.id).join('-')}`}
                      participant={tp}
                      trainingDays={trainingDays}
                      onEdit={handleEditAttendance}
                      onUnregister={handleUnregister}
                      onBatchEdit={handleBatchEditAttendance}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedTraining && trainingDays.length === 0 && (
            <div className="alert alert-warning">
              Tidak ada hari pelatihan untuk pelatihan ini. Silakan tambahkan hari pelatihan terlebih dahulu.
            </div>
          )}

          {selectedTraining && participants.length === 0 && (
            <div className="alert alert-info">
              Tidak ada peserta yang terdaftar untuk pelatihan ini.
            </div>
          )}
        </div>
      </div>

      <Modal id="attendanceModal" title="Perbarui Kehadiran" size="lg">
        <form onSubmit={handleUpdateAttendance}>
          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
              {message.text}
            </div>
          )}
          {editingAttendance && (
            <>
              <div className="mb-3">
                <label className="form-label">Peserta</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingAttendance.participant.participant.name}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Hari Pelatihan</label>
                <input
                  type="text"
                  className="form-control"
                  value={`Hari ${editingAttendance.day.day_number} - ${new Date(editingAttendance.day.training_date).toLocaleDateString('id-ID')}`}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label htmlFor="attendance_status" className="form-label">
                  Status Kehadiran <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control"
                  id="attendance_status"
                  value={formData.attendance_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attendance_status: e.target.value as TrainingParticipant['attendance_status'],
                    })
                  }
                  required
                >
                  <option value="registered">Terdaftar</option>
                  <option value="attended">Hadir</option>
                  <option value="absent">Tidak Hadir</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              
              {formData.attendance_status === 'attended' && (
                <div className="mb-3">
                  <label className="form-label">
                    Waktu Kehadiran
                  </label>
                  <div className="mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="use_event_time"
                        checked={formData.use_event_time}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            use_event_time: e.target.checked,
                            attendance_time: e.target.checked ? '' : formData.attendance_time,
                          });
                        }}
                      />
                      <label className="form-check-label" htmlFor="use_event_time">
                        Gunakan waktu mulai acara ({new Date(editingAttendance.day.training_date).toLocaleDateString('id-ID')} {editingAttendance.day.start_time})
                      </label>
                    </div>
                  </div>
                  {!formData.use_event_time && (
                    <div>
                      <input
                        type="time"
                        className="form-control"
                        id="attendance_time"
                        value={formData.attendance_time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            attendance_time: e.target.value,
                          })
                        }
                        placeholder="Pilih waktu kehadiran"
                      />
                      <small className="form-text text-muted">
                        Masukkan jam dan menit kehadiran. Tanggal akan menggunakan tanggal pelatihan ({new Date(editingAttendance.day.training_date).toLocaleDateString('id-ID')}). Kosongkan untuk menggunakan waktu saat ini.
                      </small>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-3">
                <label htmlFor="notes" className="form-label">
                  Catatan
                </label>
                <textarea
                  className="form-control"
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Perbarui
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Modal untuk batch edit */}
      <Modal id="batchAttendanceModal" title="Edit Kehadiran untuk Beberapa Hari" size="lg">
        <form onSubmit={handleBatchUpdateAttendance}>
          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
              {message.text}
            </div>
          )}
          {batchEditingAttendance && (
            <>
              <div className="mb-3">
                <label className="form-label">Peserta</label>
                <input
                  type="text"
                  className="form-control"
                  value={batchEditingAttendance.participant.participant.name}
                  disabled
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">
                  Pilih Hari Pelatihan <span className="text-danger">*</span>
                </label>
                <div className="mb-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={selectAllDays}
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={deselectAllDays}
                  >
                    Batal Pilih Semua
                  </button>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px' }}>
                  {trainingDays.map((day) => (
                    <div key={day.id} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`day-${day.id}`}
                        checked={selectedDays.has(day.id)}
                        onChange={() => toggleDaySelection(day.id)}
                      />
                      <label className="form-check-label" htmlFor={`day-${day.id}`}>
                        <strong>Hari {day.day_number}</strong> - {new Date(day.training_date).toLocaleDateString('id-ID')} 
                        ({day.start_time} - {day.end_time})
                      </label>
                    </div>
                  ))}
                </div>
                {selectedDays.size > 0 && (
                  <small className="text-muted">
                    {selectedDays.size} hari dipilih
                  </small>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="batch_attendance_status" className="form-label">
                  Status Kehadiran <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control"
                  id="batch_attendance_status"
                  value={batchFormData.attendance_status}
                  onChange={(e) =>
                    setBatchFormData({
                      ...batchFormData,
                      attendance_status: e.target.value as TrainingParticipant['attendance_status'],
                    })
                  }
                  required
                >
                  <option value="registered">Terdaftar</option>
                  <option value="attended">Hadir</option>
                  <option value="absent">Tidak Hadir</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              
              {batchFormData.attendance_status === 'attended' && (
                <div className="mb-3">
                  <label className="form-label">
                    Waktu Kehadiran
                  </label>
                  <div className="mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="batch_use_event_time"
                        checked={batchFormData.use_event_time}
                        onChange={(e) => {
                          setBatchFormData({
                            ...batchFormData,
                            use_event_time: e.target.checked,
                            attendance_time: e.target.checked ? '' : batchFormData.attendance_time,
                          });
                        }}
                      />
                      <label className="form-check-label" htmlFor="batch_use_event_time">
                        Gunakan waktu mulai acara untuk setiap hari
                      </label>
                    </div>
                  </div>
                  {!batchFormData.use_event_time && (
                    <div>
                      <input
                        type="time"
                        className="form-control"
                        id="batch_attendance_time"
                        value={batchFormData.attendance_time}
                        onChange={(e) =>
                          setBatchFormData({
                            ...batchFormData,
                            attendance_time: e.target.value,
                          })
                        }
                        placeholder="Pilih waktu kehadiran"
                      />
                      <small className="form-text text-muted">
                        Waktu ini akan diterapkan ke semua hari yang dipilih. Tanggal akan menggunakan tanggal masing-masing hari pelatihan. Kosongkan untuk menggunakan waktu saat ini.
                      </small>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-3">
                <label htmlFor="batch_notes" className="form-label">
                  Catatan
                </label>
                <textarea
                  className="form-control"
                  id="batch_notes"
                  rows={3}
                  value={batchFormData.notes}
                  onChange={(e) => setBatchFormData({ ...batchFormData, notes: e.target.value })}
                  placeholder="Catatan akan diterapkan ke semua hari yang dipilih"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={selectedDays.size === 0}>
                  Perbarui {selectedDays.size > 0 ? `(${selectedDays.size} hari)` : ''}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </>
  );
}

// Component for attendance row
function AttendanceRow({
  participant,
  trainingDays,
  onEdit,
  onUnregister,
  onBatchEdit,
}: {
  participant: TrainingParticipant;
  trainingDays: TrainingDay[];
  onEdit: (participant: TrainingParticipant, day: TrainingDay) => void;
  onUnregister: (participantId: string, trainingId: string) => void;
  onBatchEdit: (participant: TrainingParticipant) => void;
}) {
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, string>>({});
  const [attendanceTimes, setAttendanceTimes] = useState<Record<string, string | null>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchAttendanceStatuses();
  }, [participant.id, participant.participant.id, trainingDays, refreshKey]);

  // Listen for attendance update events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('attendance-updated', handleRefresh);
    return () => window.removeEventListener('attendance-updated', handleRefresh);
  }, []);

  const fetchAttendanceStatuses = async () => {
    // Set loading state for all days
    const initialLoading: Record<string, boolean> = {};
    trainingDays.forEach(day => {
      initialLoading[day.id] = true;
    });
    setLoadingStatuses(initialLoading);

    const statuses: Record<string, string> = {};
    const times: Record<string, string | null> = {};

    // Fetch statuses for all days in parallel
    const fetchPromises = trainingDays.map(async (day) => {
      try {
        // Use participant.participant.id (participants.id) and day.id
        const response = await fetch(`/api/daily-attendance/${participant.participant.id}/${day.id}`);
        if (response.ok) {
          const data = await response.json();
          statuses[day.id] = data.attendance_status || 'registered';
          times[day.id] = data.attendance_time || null;
        } else {
          statuses[day.id] = 'registered';
          times[day.id] = null;
        }
      } catch (error) {
        console.error('Error fetching attendance status:', error);
        statuses[day.id] = 'registered';
        times[day.id] = null;
      }
    });

    await Promise.all(fetchPromises);
    
    // Update both statuses, times, and clear loading states
    setAttendanceStatuses(statuses);
    setAttendanceTimes(times);
    setLoadingStatuses({});
  };

  const getStatusBadge = (status: string, attendanceTime: string | null) => {
    const badgeClass =
      status === 'attended'
        ? 'text-bg-success'
        : status === 'absent'
        ? 'text-bg-danger'
        : status === 'cancelled'
        ? 'text-bg-secondary'
        : 'text-bg-warning';

    const statusLabels: Record<string, string> = {
      'registered': 'Terdaftar',
      'attended': 'Hadir',
      'absent': 'Tidak Hadir',
      'cancelled': 'Dibatalkan'
    };

    let timeDisplay = '';
    if (status === 'attended' && attendanceTime) {
      const date = new Date(attendanceTime);
      timeDisplay = ` (${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
    }

    return (
      <div style={{ cursor: 'pointer' }}>
        <span className={`badge ${badgeClass}`}>
          {statusLabels[status] || status}
        </span>
        {timeDisplay && (
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
            {timeDisplay}
          </div>
        )}
      </div>
    );
  };

  return (
    <tr>
      <td style={{ minWidth: '150px' }}>{participant.participant.name}</td>
      <td style={{ minWidth: '200px' }}>{participant.participant.email}</td>
      <td style={{ minWidth: '120px' }}>{participant.participant.phone || '-'}</td>
      {trainingDays.map((day) => (
        <td key={day.id} className="text-center" style={{ minWidth: '120px' }}>
          <div
            onClick={() => onEdit(participant, day)}
            style={{ cursor: 'pointer' }}
            title="Klik untuk mengedit kehadiran"
          >
            {loadingStatuses[day.id] ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '24px' }}>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Memuat...</span>
                </div>
              </div>
            ) : (
              getStatusBadge(attendanceStatuses[day.id] || 'registered', attendanceTimes[day.id] || null)
            )}
          </div>
        </td>
      ))}
      <td style={{ minWidth: '150px' }}>
        <button
          className="btn btn-sm btn-primary me-1"
          onClick={() => onBatchEdit(participant)}
          title="Edit kehadiran untuk beberapa hari sekaligus"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onUnregister(participant.participant.id, participant.training_id)}
        >
          <i className="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  );
}
