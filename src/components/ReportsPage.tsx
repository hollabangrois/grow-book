'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Training } from '@/types/database';

interface ReportData {
  training: {
    id: string;
    title: string;
    status: string;
    location: string | null;
    instructor: string | null;
  };
  days: Array<{
    id: string;
    day_number: number;
    training_date: string;
    start_time: string;
    end_time: string;
  }>;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    registration_date: string;
    attendance_by_day: Record<string, {
      status: string;
      attendance_time: string | null;
    }>;
  }>;
  summary: {
    total_participants: number;
    total_days: number;
    attendance_stats: {
      registered: number;
      attended: number;
      absent: number;
      cancelled: number;
    };
  };
}

// Helper function to calculate hours between start and end time
const calculateHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const diffMinutes = endMinutes - startMinutes;
  return diffMinutes / 60; // Convert to hours
};

// Helper function to calculate hours from datetime strings
const calculateHoursFromDateTime = (startDateTime: string, endDateTime: string): number => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
};

// Helper function to calculate duration for a single day based on attendance time
const calculateDayDuration = (
  day: ReportData['days'][0],
  attendanceTime: string | null,
  useFullDuration: boolean = false
): number => {
  if (!attendanceTime) {
    // If no attendance time, use full duration
    return calculateHours(day.start_time, day.end_time);
  }

  if (useFullDuration) {
    // Override: always use full duration
    return calculateHours(day.start_time, day.end_time);
  }

  // Parse attendance time and training day
  const attendanceDate = new Date(attendanceTime);
  const trainingDate = new Date(day.training_date);
  
  // Combine date and time for training start and end
  const [startHour, startMin] = day.start_time.split(':').map(Number);
  const [endHour, endMin] = day.end_time.split(':').map(Number);
  
  const trainingStart = new Date(trainingDate);
  trainingStart.setHours(startHour, startMin, 0, 0);
  
  const trainingEnd = new Date(trainingDate);
  trainingEnd.setHours(endHour, endMin, 0, 0);

  // Check if attended before or at training start time
  if (attendanceDate <= trainingStart) {
    // Tepat waktu atau datang lebih awal: hitung dari awal pelatihan
    return calculateHoursFromDateTime(trainingStart.toISOString(), trainingEnd.toISOString());
  } else {
    // Terlambat: hitung dari jam datang hingga selesai
    return calculateHoursFromDateTime(attendanceDate.toISOString(), trainingEnd.toISOString());
  }
};

// Helper function to calculate total training hours for a participant
const calculateParticipantTotalHours = (
  participant: ReportData['participants'][0],
  days: ReportData['days'],
  overrideDays: Set<string> = new Set()
): number => {
  let totalHours = 0;
  days.forEach((day) => {
    const attendance = participant.attendance_by_day[day.id];
    if (attendance && attendance.status === 'attended') {
      const useFullDuration = overrideDays.has(`${participant.id}-${day.id}`);
      totalHours += calculateDayDuration(day, attendance.attendance_time, useFullDuration);
    }
  });
  return totalHours;
};

export default function ReportsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'single' | 'range' | 'byParticipant'>('single');
  const [selectedTraining, setSelectedTraining] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // State untuk override perhitungan (hanya tampilan, tidak mengubah database)
  // Format: Set<string> dengan key "participantId-dayId"
  const [overrideDays, setOverrideDays] = useState<Set<string>>(new Set());
  // State untuk autocomplete
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{ id: string; name: string; email: string; phone: string | null }>>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchTrainings();
  }, []);

  // Reset autocomplete when report type changes
  useEffect(() => {
    if (reportType !== 'byParticipant') {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      setSelectedParticipant(null);
    }
  }, [reportType]);

  // Debounce function untuk autocomplete
  useEffect(() => {
    if (reportType === 'byParticipant' && participantName.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        fetchAutocompleteSuggestions(participantName.trim());
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  }, [participantName, reportType]);

  const fetchAutocompleteSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 1) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const response = await fetch(`/api/participants?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setAutocompleteSuggestions(data);
        setShowAutocomplete(data.length > 0);
      } else {
        setAutocompleteSuggestions([]);
        setShowAutocomplete(false);
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  };

  const handleParticipantSelect = (participant: { id: string; name: string; email: string; phone: string | null }) => {
    setParticipantName(participant.name);
    setSelectedParticipant({ id: participant.id, name: participant.name });
    setShowAutocomplete(false);
    setAutocompleteSuggestions([]);
  };

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

  const generateReport = async () => {
    setGenerating(true);
    setMessage(null);

    try {
      let url = '/api/reports';
      if (reportType === 'single') {
        if (!selectedTraining) {
          setMessage({ type: 'error', text: 'Silakan pilih pelatihan' });
          setGenerating(false);
          return;
        }
        url += `?trainingId=${selectedTraining}`;
      } else if (reportType === 'range') {
        if (!startDate || !endDate) {
          setMessage({ type: 'error', text: 'Silakan pilih tanggal mulai dan tanggal akhir' });
          setGenerating(false);
          return;
        }
        url += `?startDate=${startDate}&endDate=${endDate}`;
      } else if (reportType === 'byParticipant') {
        if (!participantName || participantName.trim() === '') {
          setMessage({ type: 'error', text: 'Silakan masukkan nama peserta' });
          setGenerating(false);
          return;
        }
        url += `?participantName=${encodeURIComponent(participantName.trim())}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setReportData(data);
        setMessage({ type: 'success', text: 'Laporan berhasil dibuat!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal membuat laporan' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal membuat laporan' });
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (reportData.length === 0) {
      setMessage({ type: 'error', text: 'Tidak ada data laporan untuk diunduh' });
      return;
    }

    // PDF akan menggunakan overrideDays yang sudah dipilih user melalui button "Tepat Waktu"
    // Perhitungan durasi akan sesuai dengan pilihan user

    const doc = new jsPDF();
    let yPosition = 20;

    reportData.forEach((report, index) => {
      if (index > 0) {
        doc.addPage();
        yPosition = 20;
      }

      // Title
      doc.setFontSize(18);
      doc.text('Laporan Pelatihan', 14, yPosition);
      yPosition += 10;

      // Training Info
      doc.setFontSize(12);
      doc.text(`Pelatihan: ${report.training.title}`, 14, yPosition);
      yPosition += 7;
      const statusLabels: Record<string, string> = {
        'scheduled': 'Terjadwal',
        'ongoing': 'Berlangsung',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
      };
      doc.text(`Status: ${statusLabels[report.training.status] || report.training.status}`, 14, yPosition);
      yPosition += 7;
      if (report.training.location) {
        doc.text(`Lokasi: ${report.training.location}`, 14, yPosition);
        yPosition += 7;
      }
      if (report.training.instructor) {
        doc.text(`Instruktur: ${report.training.instructor}`, 14, yPosition);
        yPosition += 7;
      }
      yPosition += 5;

      // Summary
      doc.setFontSize(14);
      doc.text('Ringkasan', 14, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      doc.text(`Total Peserta: ${report.summary.total_participants}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Total Hari: ${report.summary.total_days}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Terdaftar: ${report.summary.attendance_stats.registered}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Hadir: ${report.summary.attendance_stats.attended}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Tidak Hadir: ${report.summary.attendance_stats.absent}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Dibatalkan: ${report.summary.attendance_stats.cancelled}`, 14, yPosition);
      yPosition += 10;

      // Training Days
      if (report.days.length > 0) {
        doc.setFontSize(12);
        doc.text('Hari Pelatihan', 14, yPosition);
        yPosition += 7;

        const daysData = report.days.map((day) => [
          `Hari ${day.day_number}`,
          new Date(day.training_date).toLocaleDateString('id-ID'),
          day.start_time,
          day.end_time,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Hari', 'Tanggal', 'Waktu Mulai', 'Waktu Selesai']],
          body: daysData,
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202] },
        });

        yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 50;
        yPosition += 10;
      }

      // Participants Table
      if (report.participants.length > 0) {
        doc.setFontSize(12);
        doc.text('Kehadiran Peserta', 14, yPosition);
        yPosition += 7;

        const statusLabels: Record<string, string> = {
          'registered': 'Terdaftar',
          'attended': 'Hadir',
          'absent': 'Tidak Hadir',
          'cancelled': 'Dibatalkan'
        };

        const participantsData = report.participants.map((participant) => {
          const row: any[] = [
            participant.name,
            participant.email,
            participant.phone || '-',
            new Date(participant.registration_date).toLocaleDateString('id-ID'),
          ];

          // Add attendance per day
          report.days.forEach((day) => {
            const attendance = participant.attendance_by_day[day.id];
            const status = attendance ? attendance.status : 'registered';
            row.push(statusLabels[status] || status);
          });

          // Add total hours (PDF uses override calculation based on user selection)
          const totalHours = calculateParticipantTotalHours(participant, report.days, overrideDays);
          row.push(`${totalHours.toFixed(1)} jam`);

          return row;
        });

        const headers: any[] = ['Nama', 'Email', 'Telepon', 'Tanggal Pendaftaran'];
        report.days.forEach((day) => {
          headers.push(`Hari ${day.day_number}`);
        });
        headers.push('Total Jam');

        autoTable(doc, {
          startY: yPosition,
          head: [headers],
          body: participantsData,
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 8 },
        });
        
        const finalY2 = (doc as any).lastAutoTable?.finalY || yPosition + 50;
        yPosition = finalY2;
      }
    });

    // Save PDF dengan penamaan sesuai jenis report
    let fileName = '';
    const dateStr = new Date().toISOString().split('T')[0];
    
    if (reportType === 'single') {
      // Laporan satu pelatihan: training-report-[judul-pelatihan]-[tanggal].pdf
      const trainingTitle = reportData[0]?.training.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') || 'pelatihan';
      fileName = `laporan-pelatihan-${trainingTitle}-${dateStr}.pdf`;
    } else if (reportType === 'range') {
      // Laporan rentang tanggal: laporan-pelatihan-[tanggal-mulai]-hingga-[tanggal-akhir].pdf
      fileName = `laporan-pelatihan-${startDate}-hingga-${endDate}.pdf`;
    } else if (reportType === 'byParticipant') {
      // Laporan berdasarkan peserta: laporan-peserta-[nama-peserta]-[tanggal].pdf
      const participantNameFromData = reportData[0]?.participants[0]?.name || participantName || 'peserta';
      const cleanName = participantNameFromData.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
      fileName = `laporan-peserta-${cleanName}-${dateStr}.pdf`;
    } else {
      // Fallback
      fileName = `laporan-pelatihan-${dateStr}.pdf`;
    }
    
    doc.save(fileName);
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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Laporan Pelatihan</h3>
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

        <div className="row mb-3">
          <div className="col-md-12">
            <label className="form-label">Jenis Laporan</label>
            <div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="reportType"
                  id="singleReport"
                  value="single"
                  checked={reportType === 'single'}
                  onChange={(e) => setReportType(e.target.value as 'single' | 'range' | 'byParticipant')}
                />
                <label className={`form-check-label ${reportType === 'single' ? 'fw-bold' : ''}`} htmlFor="singleReport">
                  Satu Pelatihan
                </label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="reportType"
                  id="rangeReport"
                  value="range"
                  checked={reportType === 'range'}
                  onChange={(e) => setReportType(e.target.value as 'single' | 'range' | 'byParticipant')}
                />
                <label className={`form-check-label ${reportType === 'range' ? 'fw-bold' : ''}`} htmlFor="rangeReport">
                  Rentang Tanggal
                </label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="reportType"
                  id="byParticipantReport"
                  value="byParticipant"
                  checked={reportType === 'byParticipant'}
                  onChange={(e) => setReportType(e.target.value as 'single' | 'range' | 'byParticipant')}
                />
                <label className={`form-check-label ${reportType === 'byParticipant' ? 'fw-bold' : ''}`} htmlFor="byParticipantReport">
                  Berdasarkan Nama Peserta
                </label>
              </div>
            </div>
            <div className="mt-2">
              <small className="text-muted">
                {reportType === 'single' && 'Menampilkan report berdasarkan satu pelatihan'}
                {reportType === 'range' && 'Menampilkan report berdasarkan rentang tanggal'}
                {reportType === 'byParticipant' && 'Menampilkan report berdasarkan nama peserta'}
              </small>
            </div>
          </div>
        </div>

        {reportType === 'single' ? (
          <div className="mb-3">
            <label htmlFor="training" className="form-label">
              Pilih Pelatihan <span className="text-danger">*</span>
            </label>
            <select
              className="form-control"
              id="training"
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
        ) : reportType === 'range' ? (
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="startDate" className="form-label">
                Tanggal Mulai <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="endDate" className="form-label">
                Tanggal Akhir <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <label htmlFor="participantName" className="form-label">
              Nama Peserta <span className="text-danger">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                id="participantName"
                placeholder="Masukkan nama peserta"
                value={participantName}
                onChange={(e) => {
                  setParticipantName(e.target.value);
                  setSelectedParticipant(null);
                  if (e.target.value.trim().length > 0) {
                    setShowAutocomplete(true);
                  } else {
                    setShowAutocomplete(false);
                  }
                }}
                onFocus={() => {
                  if (autocompleteSuggestions.length > 0) {
                    setShowAutocomplete(true);
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowAutocomplete(false), 200);
                }}
                autoComplete="off"
              />
              {showAutocomplete && autocompleteSuggestions.length > 0 && (
                <div
                  className="list-group"
                  style={{
                    position: 'absolute',
                    zIndex: 1000,
                    width: '100%',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '2px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    borderRadius: '4px',
                  }}
                >
                  {autocompleteSuggestions.map((participant) => (
                    <button
                      key={participant.id}
                      type="button"
                      className="list-group-item list-group-item-action"
                      onClick={() => handleParticipantSelect(participant)}
                      style={{
                        textAlign: 'left',
                        border: 'none',
                        borderBottom: '1px solid #dee2e6',
                        padding: '10px 15px',
                        cursor: 'pointer',
                      }}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                    >
                      <div>
                        <strong>{participant.name}</strong>
                      </div>
                      <small className="text-muted">
                        {participant.email}
                        {participant.phone && ` • ${participant.phone}`}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <small className="text-muted">
              {selectedParticipant 
                ? `Peserta terpilih: ${selectedParticipant.name}` 
                : 'Ketik nama peserta untuk melihat saran autocomplete. Klik pada saran untuk memilih.'}
            </small>
          </div>
        )}

        <div className="mb-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={generateReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Membuat...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-text me-1"></i>Buat Laporan
              </>
            )}
          </button>
          {reportData.length > 0 && (
            <button
              type="button"
              className="btn btn-success ms-2"
              onClick={downloadPDF}
            >
              <i className="bi bi-download me-1"></i>Unduh PDF
            </button>
          )}
        </div>

        {reportData.length > 0 && (
          <div className="mt-4">
            {reportType === 'byParticipant' ? (
              // Special view for participant-based report
              reportData.map((report, reportIndex) => {
                // Get participant info from first participant (assuming all reports are for same participant)
                const participant = report.participants[0];
                if (!participant) return null;

                return (
                  <div key={reportIndex} className="card mb-3">
                    <div className="card-header bg-primary text-white">
                      <h5 className="card-title mb-0">Laporan Peserta: {participant.name}</h5>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <strong>Nama:</strong> {participant.name}
                        </div>
                        <div className="col-md-6">
                          <strong>Email:</strong> {participant.email}
                        </div>
                        <div className="col-md-6">
                          <strong>Telepon:</strong> {participant.phone || '-'}
                        </div>
                        <div className="col-md-6">
                          <strong>Total Pelatihan:</strong> {reportData.length}
                        </div>
                      </div>

                      <h6 className="mt-3">Daftar Pelatihan yang Diikuti:</h6>
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped table-sm">
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>Judul Pelatihan</th>
                              <th>Status</th>
                              <th>Lokasi</th>
                              <th>Instruktur</th>
                              <th>Total Hari</th>
                              <th>Total Jam</th>
                              <th>Tanggal Pendaftaran</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.map((r, idx) => {
                              const totalHours = calculateParticipantTotalHours(participant, r.days, overrideDays);
                              return (
                                <tr key={idx}>
                                  <td>{idx + 1}</td>
                                  <td>{r.training.title}</td>
                                  <td>
                                    <span className={`badge ${
                                      r.training.status === 'completed' ? 'text-bg-success' :
                                      r.training.status === 'ongoing' ? 'text-bg-primary' :
                                      r.training.status === 'cancelled' ? 'text-bg-danger' :
                                      'text-bg-warning'
                                    }`}>
                                      {r.training.status === 'scheduled' ? 'Terjadwal' :
                                       r.training.status === 'ongoing' ? 'Berlangsung' :
                                       r.training.status === 'completed' ? 'Selesai' :
                                       r.training.status === 'cancelled' ? 'Dibatalkan' : r.training.status}
                                    </span>
                                  </td>
                                  <td>{r.training.location || '-'}</td>
                                  <td>{r.training.instructor || '-'}</td>
                                  <td>{r.days.length} hari</td>
                                  <td><strong>{totalHours.toFixed(1)} jam</strong></td>
                                  <td>{new Date(participant.registration_date).toLocaleDateString('id-ID')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Detail per pelatihan */}
                      <div className="mt-4">
                        <h6>Detail Kehadiran per Pelatihan:</h6>
                        {reportData.map((r, trainingIdx) => (
                          <div key={trainingIdx} className="card mb-3">
                            <div className="card-header">
                              <h6 className="mb-0">{r.training.title}</h6>
                            </div>
                            <div className="card-body">
                              {r.days.length > 0 && (
                                <div className="mb-3">
                                  <strong>Hari Pelatihan:</strong>
                                  <div className="table-responsive mt-2">
                                    <table className="table table-bordered table-sm">
                                      <thead>
                                        <tr>
                                          <th>Hari</th>
                                          <th>Tanggal</th>
                                          <th>Waktu Mulai</th>
                                          <th>Waktu Selesai</th>
                                          <th>Status Kehadiran</th>
                                          <th>Durasi</th>
                                          <th>Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {r.days.map((day) => {
                                          const attendance = participant.attendance_by_day[day.id];
                                          const status = attendance ? attendance.status : 'registered';
                                          const statusLabels: Record<string, string> = {
                                            'registered': 'Terdaftar',
                                            'attended': 'Hadir',
                                            'absent': 'Tidak Hadir',
                                            'cancelled': 'Dibatalkan'
                                          };
                                          const badgeClass =
                                            status === 'attended' ? 'text-bg-success' :
                                            status === 'absent' ? 'text-bg-danger' :
                                            status === 'cancelled' ? 'text-bg-secondary' :
                                            'text-bg-warning';
                                          
                                          // Calculate duration for this day
                                          let dayDuration = 0;
                                          let isLate = false;
                                          if (status === 'attended' && attendance?.attendance_time) {
                                            const overrideKey = `${participant.id}-${day.id}`;
                                            const useFullDuration = overrideDays.has(overrideKey);
                                            dayDuration = calculateDayDuration(day, attendance.attendance_time, useFullDuration);
                                            
                                            // Check if late
                                            if (!useFullDuration && attendance.attendance_time) {
                                              const attendanceDate = new Date(attendance.attendance_time);
                                              const trainingDate = new Date(day.training_date);
                                              const [startHour, startMin] = day.start_time.split(':').map(Number);
                                              const trainingStart = new Date(trainingDate);
                                              trainingStart.setHours(startHour, startMin, 0, 0);
                                              isLate = attendanceDate > trainingStart;
                                            }
                                          }
                                          
                                          return (
                                            <tr key={day.id}>
                                              <td>Hari {day.day_number}</td>
                                              <td>{new Date(day.training_date).toLocaleDateString('id-ID')}</td>
                                              <td>{day.start_time}</td>
                                              <td>{day.end_time}</td>
                                              <td>
                                                <span className={`badge ${badgeClass}`}>
                                                  {statusLabels[status] || status}
                                                </span>
                                                {status === 'attended' && attendance?.attendance_time && (
                                                  <div className="mt-1" style={{ fontSize: '0.75rem' }}>
                                                    {new Date(attendance.attendance_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                  </div>
                                                )}
                                              </td>
                                              <td>
                                                {status === 'attended' ? (
                                                  <>
                                                    <strong>{dayDuration.toFixed(1)} jam</strong>
                                                    {isLate && !overrideDays.has(`${participant.id}-${day.id}`) && (
                                                      <div className="text-warning" style={{ fontSize: '0.75rem' }}>
                                                        <i className="bi bi-clock-history"></i> Terlambat
                                                      </div>
                                                    )}
                                                  </>
                                                ) : (
                                                  '-'
                                                )}
                                              </td>
                                              <td>
                                                {status === 'attended' && isLate && !overrideDays.has(`${participant.id}-${day.id}`) && (
                                                  <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {
                                                      const key = `${participant.id}-${day.id}`;
                                                      const newOverride = new Set(overrideDays);
                                                      newOverride.add(key);
                                                      setOverrideDays(newOverride);
                                                    }}
                                                    title="Hitung sebagai tepat waktu"
                                                  >
                                                    <i className="bi bi-check-circle me-1"></i>Tepat Waktu
                                                  </button>
                                                )}
                                                {overrideDays.has(`${participant.id}-${day.id}`) && (
                                                  <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => {
                                                      const key = `${participant.id}-${day.id}`;
                                                      const newOverride = new Set(overrideDays);
                                                      newOverride.delete(key);
                                                      setOverrideDays(newOverride);
                                                    }}
                                                    title="Kembali ke perhitungan normal"
                                                  >
                                                    <i className="bi bi-x-circle me-1"></i>Batal
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Original view for single/range reports
              reportData.map((report, index) => (
              <div key={index} className="card mb-3">
                <div className="card-header">
                  <h5 className="card-title mb-0">{report.training.title}</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Status:</strong> {report.training.status === 'scheduled' ? 'Terjadwal' : 
                       report.training.status === 'ongoing' ? 'Berlangsung' :
                       report.training.status === 'completed' ? 'Selesai' :
                       report.training.status === 'cancelled' ? 'Dibatalkan' : report.training.status}
                    </div>
                    <div className="col-md-6">
                      <strong>Total Peserta:</strong> {report.summary.total_participants}
                    </div>
                    <div className="col-md-6">
                      <strong>Total Hari:</strong> {report.summary.total_days}
                    </div>
                    <div className="col-md-6">
                      <strong>Lokasi:</strong> {report.training.location || '-'}
                    </div>
                    {report.training.instructor && (
                      <div className="col-md-6">
                        <strong>Instruktur:</strong> {report.training.instructor}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <h6>Statistik Kehadiran</h6>
                    <div className="row">
                      <div className="col-md-3">
                        <span className="badge text-bg-warning">Terdaftar: {report.summary.attendance_stats.registered}</span>
                      </div>
                      <div className="col-md-3">
                        <span className="badge text-bg-success">Hadir: {report.summary.attendance_stats.attended}</span>
                      </div>
                      <div className="col-md-3">
                        <span className="badge text-bg-danger">Tidak Hadir: {report.summary.attendance_stats.absent}</span>
                      </div>
                      <div className="col-md-3">
                        <span className="badge text-bg-secondary">Dibatalkan: {report.summary.attendance_stats.cancelled}</span>
                      </div>
                    </div>
                  </div>

                  {report.days.length > 0 && (
                    <div className="mb-3">
                      <h6>Hari Pelatihan</h6>
                      <div className="table-responsive">
                        <table className="table table-bordered table-sm">
                          <thead>
                            <tr>
                              <th>Hari</th>
                              <th>Tanggal</th>
                              <th>Waktu Mulai</th>
                              <th>Waktu Selesai</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.days.map((day) => (
                              <tr key={day.id}>
                                <td>Hari {day.day_number}</td>
                                <td>{new Date(day.training_date).toLocaleDateString('id-ID')}</td>
                                <td>{day.start_time}</td>
                                <td>{day.end_time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {report.participants.length > 0 && (
                    <div>
                      <h6>Peserta</h6>
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped table-sm">
                          <thead>
                            <tr>
                              <th>Nama</th>
                              <th>Email</th>
                              <th>Telepon</th>
                              <th>Tanggal Pendaftaran</th>
                              {report.days.map((day) => (
                                <th key={day.id} style={{ minWidth: '150px' }}>
                                  Hari {day.day_number}
                                  <br />
                                  <small className="text-muted">Status & Durasi</small>
                                </th>
                              ))}
                              <th>Total Jam</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.participants.map((participant) => (
                              <tr key={participant.id}>
                                <td>{participant.name}</td>
                                <td>{participant.email}</td>
                                <td>{participant.phone || '-'}</td>
                                <td>{new Date(participant.registration_date).toLocaleDateString('id-ID')}</td>
                                {report.days.map((day) => {
                                  const attendance = participant.attendance_by_day[day.id];
                                  const status = attendance ? attendance.status : 'registered';
                                  const statusLabels: Record<string, string> = {
                                    'registered': 'Terdaftar',
                                    'attended': 'Hadir',
                                    'absent': 'Tidak Hadir',
                                    'cancelled': 'Dibatalkan'
                                  };
                                  const badgeClass =
                                    status === 'attended'
                                      ? 'text-bg-success'
                                      : status === 'absent'
                                      ? 'text-bg-danger'
                                      : status === 'cancelled'
                                      ? 'text-bg-secondary'
                                      : 'text-bg-warning';
                                  
                                  // Calculate duration for this day
                                  let dayDuration = 0;
                                  let isLate = false;
                                  if (status === 'attended' && attendance?.attendance_time) {
                                    const overrideKey = `${participant.id}-${day.id}`;
                                    const useFullDuration = overrideDays.has(overrideKey);
                                    dayDuration = calculateDayDuration(day, attendance.attendance_time, useFullDuration);
                                    
                                    // Check if late (attendance time > start time)
                                    if (!useFullDuration && attendance.attendance_time) {
                                      const attendanceDate = new Date(attendance.attendance_time);
                                      const trainingDate = new Date(day.training_date);
                                      const [startHour, startMin] = day.start_time.split(':').map(Number);
                                      const trainingStart = new Date(trainingDate);
                                      trainingStart.setHours(startHour, startMin, 0, 0);
                                      isLate = attendanceDate > trainingStart;
                                    }
                                  }
                                  
                                  return (
                                    <td key={day.id}>
                                      <div>
                                        <span className={`badge ${badgeClass}`}>{statusLabels[status] || status}</span>
                                        {status === 'attended' && attendance?.attendance_time && (
                                          <>
                                            <div className="mt-1" style={{ fontSize: '0.85rem' }}>
                                              <strong>{dayDuration.toFixed(1)} jam</strong>
                                              {isLate && !overrideDays.has(`${participant.id}-${day.id}`) && (
                                                <span className="text-warning ms-1" title="Terlambat">
                                                  <i className="bi bi-clock-history"></i>
                                                </span>
                                              )}
                                            </div>
                                            {isLate && !overrideDays.has(`${participant.id}-${day.id}`) && (
                                              <button
                                                className="btn btn-sm btn-outline-primary mt-1"
                                                style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                                                onClick={() => {
                                                  const key = `${participant.id}-${day.id}`;
                                                  const newOverride = new Set(overrideDays);
                                                  newOverride.add(key);
                                                  setOverrideDays(newOverride);
                                                }}
                                                title="Hitung sebagai tepat waktu"
                                              >
                                                <i className="bi bi-check-circle me-1"></i>Tepat Waktu
                                              </button>
                                            )}
                                            {overrideDays.has(`${participant.id}-${day.id}`) && (
                                              <button
                                                className="btn btn-sm btn-outline-secondary mt-1"
                                                style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                                                onClick={() => {
                                                  const key = `${participant.id}-${day.id}`;
                                                  const newOverride = new Set(overrideDays);
                                                  newOverride.delete(key);
                                                  setOverrideDays(newOverride);
                                                }}
                                                title="Kembali ke perhitungan normal"
                                              >
                                                <i className="bi bi-x-circle me-1"></i>Batal
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                                <td>
                                  <strong>{calculateParticipantTotalHours(participant, report.days, overrideDays).toFixed(1)} jam</strong>
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
            ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

