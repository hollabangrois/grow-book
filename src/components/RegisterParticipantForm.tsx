'use client';

import { useState, useEffect } from 'react';
import type { Participant, Training } from '@/types/database';

interface SelectedParticipant {
  id: string;
  name: string;
  email: string;
}

export default function RegisterParticipantForm() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);
  const [tempParticipantId, setTempParticipantId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  useEffect(() => {
    if (selectedTraining) {
      fetchUnregisteredParticipants();
    } else {
      setParticipants([]);
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

  const fetchUnregisteredParticipants = async () => {
    if (!selectedTraining) return;

    try {
      const response = await fetch(`/api/training-participants/unregistered/${selectedTraining}`);
      const data = await response.json();
      if (response.ok) {
        setParticipants(data);
        // Clear selected participants if they're no longer available
        setSelectedParticipants((prev) =>
          prev.filter((sp) => data.some((p: Participant) => p.id === sp.id))
        );
        // Clear temp participant if no longer available
        if (tempParticipantId && !data.some((p: Participant) => p.id === tempParticipantId)) {
          setTempParticipantId('');
        }
      }
    } catch (error) {
      console.error('Error fetching unregistered participants:', error);
    }
  };

  const addParticipantToList = () => {
    if (!tempParticipantId) {
      setMessage({ type: 'error', text: 'Silakan pilih peserta' });
      return;
    }

    const participant = participants.find((p) => p.id === tempParticipantId);
    if (!participant) return;

    // Check if already added
    if (selectedParticipants.some((p) => p.id === participant.id)) {
      setMessage({ type: 'error', text: 'Peserta sudah ditambahkan ke daftar' });
      return;
    }

    setSelectedParticipants([
      ...selectedParticipants,
      {
        id: participant.id,
        name: participant.name,
        email: participant.email,
      },
    ]);
    setTempParticipantId('');
    setMessage(null);
  };

  const removeParticipantFromList = (id: string) => {
    setSelectedParticipants(selectedParticipants.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedTraining) {
      setMessage({ type: 'error', text: 'Silakan pilih pelatihan' });
      return;
    }

    if (selectedParticipants.length === 0) {
      setMessage({ type: 'error', text: 'Silakan tambahkan minimal satu peserta' });
      return;
    }

    setRegistering(true);

    try {
      const results = [];
      const errors = [];

      // Register all participants
      for (const participant of selectedParticipants) {
        try {
          const response = await fetch('/api/training-participants/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participant_id: participant.id,
              training_id: selectedTraining,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            results.push(participant.name);
          } else {
            errors.push(`${participant.name}: ${data.error || 'Failed to register'}`);
          }
        } catch (error) {
          errors.push(`${participant.name}: Failed to register`);
        }
      }

      if (results.length > 0) {
        const successMsg =
          results.length === selectedParticipants.length
            ? `Successfully registered ${results.length} participant(s)!`
            : `Successfully registered ${results.length} participant(s). ${errors.length} failed.`;
        setMessage({ type: 'success', text: successMsg });
        setSelectedParticipants([]);
        setTempParticipantId('');
        // Refresh unregistered participants list
        if (selectedTraining) {
          await fetchUnregisteredParticipants();
        }
      }

      if (errors.length > 0 && results.length === 0) {
        setMessage({ type: 'error', text: errors.join('; ') });
      } else if (errors.length > 0) {
        // Show errors in console or as additional message
        console.error('Registration errors:', errors);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mendaftarkan peserta' });
    } finally {
      setRegistering(false);
    }
  };

  // Get available participants (not yet added to list)
  const availableParticipants = participants.filter(
    (p) => !selectedParticipants.some((sp) => sp.id === p.id)
  );

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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Daftarkan Peserta ke Pelatihan</h3>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
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

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="training" className="form-label">
              Pelatihan <span className="text-danger">*</span>
            </label>
            <select
              className="form-control"
              id="training"
              value={selectedTraining}
              onChange={(e) => setSelectedTraining(e.target.value)}
              required
            >
              <option value="">Pilih Pelatihan</option>
              {trainings.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.title} ({training.status})
                </option>
              ))}
            </select>
          </div>

          <hr />

          <div className="mb-3">
            <label htmlFor="participant" className="form-label">
              Tambah Peserta
            </label>
            <div className="input-group">
              <select
                className="form-control"
                id="participant"
                value={tempParticipantId}
                onChange={(e) => setTempParticipantId(e.target.value)}
                disabled={!selectedTraining || availableParticipants.length === 0}
              >
                <option value="">
                  {!selectedTraining
                    ? 'Pilih pelatihan terlebih dahulu'
                    : availableParticipants.length === 0
                    ? 'Tidak ada peserta yang belum terdaftar'
                    : 'Pilih Peserta'}
                </option>
                {availableParticipants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name} ({participant.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-success"
                onClick={addParticipantToList}
                disabled={!tempParticipantId || availableParticipants.length === 0 || !selectedTraining}
              >
                <i className="bi bi-plus-lg me-1"></i>Tambah ke Daftar
              </button>
            </div>
            {availableParticipants.length === 0 && selectedTraining && (
              <small className="text-muted">
                {selectedParticipants.length > 0
                  ? 'Semua peserta yang tersedia telah ditambahkan ke daftar'
                  : 'Tidak ada peserta yang belum terdaftar untuk pelatihan ini'}
              </small>
            )}
            {!selectedTraining && (
              <small className="text-muted">Silakan pilih pelatihan terlebih dahulu</small>
            )}
          </div>

          {selectedParticipants.length > 0 && (
            <div className="mb-3">
              <label className="form-label">
                Peserta Terpilih ({selectedParticipants.length})
              </label>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th style={{ width: '80px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParticipants.map((participant) => (
                      <tr key={participant.id}>
                        <td>{participant.name}</td>
                        <td>{participant.email}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeParticipantFromList(participant.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={registering || selectedParticipants.length === 0 || !selectedTraining}
            >
              {registering ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>Daftarkan {selectedParticipants.length} Peserta
                </>
              )}
            </button>
            {selectedParticipants.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => {
                  setSelectedParticipants([]);
                  setMessage(null);
                }}
              >
                Hapus Daftar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
