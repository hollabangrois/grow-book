'use client';

import { useState } from 'react';

export default function HelpAccordion() {
  const [openItem, setOpenItem] = useState<string | null>('help1');

  const handleToggle = (itemId: string) => {
    setOpenItem(openItem === itemId ? null : itemId);
  };

  return (
    <div className="accordion" id="helpAccordion">
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button 
            className={`accordion-button ${openItem === 'help1' ? '' : 'collapsed'}`}
            type="button" 
            onClick={() => handleToggle('help1')}
            aria-expanded={openItem === 'help1'}
            aria-controls="help1"
          >
            Membuat Pelatihan Baru
          </button>
        </h2>
        <div 
          id="help1" 
          className={`accordion-collapse ${openItem === 'help1' ? 'show' : 'collapse'}`}
        >
          <div className="accordion-body">
            Klik menu <strong>Pelatihan</strong> → <strong>Tambah Baru</strong>. Isi informasi pelatihan dan tambahkan hari pelatihan sesuai kebutuhan.
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button 
            className={`accordion-button ${openItem === 'help2' ? '' : 'collapsed'}`}
            type="button" 
            onClick={() => handleToggle('help2')}
            aria-expanded={openItem === 'help2'}
            aria-controls="help2"
          >
            Mendaftarkan Peserta
          </button>
        </h2>
        <div 
          id="help2" 
          className={`accordion-collapse ${openItem === 'help2' ? 'show' : 'collapse'}`}
        >
          <div className="accordion-body">
            Pilih pelatihan di halaman <strong>Daftar Pelatihan</strong>, kemudian klik <strong>Daftarkan Peserta</strong>. Pilih peserta yang ingin didaftarkan.
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button 
            className={`accordion-button ${openItem === 'help3' ? '' : 'collapsed'}`}
            type="button" 
            onClick={() => handleToggle('help3')}
            aria-expanded={openItem === 'help3'}
            aria-controls="help3"
          >
            Mencatat Kehadiran
          </button>
        </h2>
        <div 
          id="help3" 
          className={`accordion-collapse ${openItem === 'help3' ? 'show' : 'collapse'}`}
        >
          <div className="accordion-body">
            Buka halaman <strong>Kehadiran</strong>, pilih pelatihan, lalu klik pada badge status peserta untuk mengedit kehadiran. Anda dapat mengatur waktu kehadiran secara manual atau menggunakan waktu mulai acara.
          </div>
        </div>
      </div>
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button 
            className={`accordion-button ${openItem === 'help4' ? '' : 'collapsed'}`}
            type="button" 
            onClick={() => handleToggle('help4')}
            aria-expanded={openItem === 'help4'}
            aria-controls="help4"
          >
            Membuat Laporan
          </button>
        </h2>
        <div 
          id="help4" 
          className={`accordion-collapse ${openItem === 'help4' ? 'show' : 'collapse'}`}
        >
          <div className="accordion-body">
            Buka halaman <strong>Laporan</strong>, pilih jenis laporan (Satu Pelatihan, Rentang Tanggal, atau Berdasarkan Peserta), kemudian klik <strong>Buat Laporan</strong>. Anda dapat mengunduh laporan dalam format PDF.
          </div>
        </div>
      </div>
    </div>
  );
}

