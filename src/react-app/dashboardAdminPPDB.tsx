import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // <--- IMPORT LIBRARY EXCEL DI SINI
import './style/dashboard.css';

const DashboardAdminPPDB: React.FC = () => {
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'beranda' | 'export'>('beranda');
  
  // State untuk Export
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
      navigate('/');
      return;
    }
    const user = JSON.parse(sessionData);
    setUsername(user.username);
  }, [navigate]);

  const fetchExportHistory = async () => {
    try {
      const response = await fetch('/export/history'); 
      const result = await response.json();
      if (result.success) {
        setExportHistory(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil riwayat:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'export') {
      fetchExportHistory();
    }
  }, [activeTab]);

  const handleGenerateExport = async () => {
    if(!window.confirm("Apakah Anda yakin ingin memproses semua data pendaftar baru (status 0) menjadi batch export?")) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/export/generate', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        alert(`Berhasil! ${result.data.total_data} data pendaftar diproses dengan ID Export: ${result.data.export_id}`);
        fetchExportHistory(); 
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat memproses export.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ========================================================
  // LOGIKA UTAMA: UNDUH XLSX TERPISAH PER LEMBAGA NAUNGAN
  // ========================================================
  const handleDownloadXLSX = async (exportId: number) => {
    try {
      const response = await fetch(`/export/data/${exportId}`);
      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        alert("Gagal mengunduh atau tidak ada data dalam batch export ini.");
        return;
      }

      const allData = result.data;

      // 1. Kelompokkan data pendaftar berdasarkan nama_lembaga
      const groupedData: { [key: string]: any[] } = {};
      
      allData.forEach((student: any) => {
        const namaLembaga = student.nama_lembaga || 'Lembaga_Tidak_Diketahui';
        if (!groupedData[namaLembaga]) {
          groupedData[namaLembaga] = [];
        }

        // Mapping struktur kolom agar rapi dan user-friendly di Excel
        groupedData[namaLembaga].push({
          'Nama Lengkap': student.nama_lengkap,
          'Jenis Kelamin': student.jenis_kelamin === 1 ? 'Laki-laki' : 'Perempuan',
          'Kewarganegaraan': student.kewarganegaraan === 1 ? 'WNI' : 'WNA',
          'Kode Desa': student.kode_desa || '-',
          'RT': student.rt || '-',
          'RW': student.rw || '-',
          'Alamat Lengkap': student.alamat_lengkap,
          'Foto': student.foto || '-'
        });
      });

      // 2. Loop setiap kelompok lembaga dan unduh sebagai file .xlsx terpisah
      Object.keys(groupedData).forEach((lembaga) => {
        // Buat sheet baru dari objek JSON pendaftar lembaga terkait
        const worksheet = XLSX.utils.json_to_sheet(groupedData[lembaga]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri Baru");

        // Format nama file: PPDB_Batch_[ID]_[Nama_Lembaga].xlsx
        const namaFileBersih = lembaga.replace(/[^a-zA-Z0-9]/g, '_'); // ganti spasi/karakter aneh dengan underscore
        const fileName = `PPDB_Batch_${exportId}_${namaFileBersih}.xlsx`;

        // Trigger unduhan file langsung ke browser
        XLSX.writeFile(workbook, fileName);
      });

    } catch (error) {
      console.error("Error Excel Export:", error);
      alert("Terjadi kesalahan saat memproses data Excel.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">Admin PPDB</div>
        <ul className="sidebar-menu">
          <li className={activeTab === 'beranda' ? 'active' : ''} onClick={() => setActiveTab('beranda')}>🏠 Beranda</li>
          <li className={activeTab === 'export' ? 'active' : ''} onClick={() => setActiveTab('export')}>📥 Export Data</li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="top-navbar">
          <span style={{ marginRight: '15px', color: '#555', fontWeight: '500' }}>Halo Admin, {username}</span>
          <button className="logout-btn" onClick={handleLogout}>Keluar</button>
        </div>

        <div className="content-area">
          {activeTab === 'beranda' && (
            <div className="content-card">
              <h2>Selamat Datang di Panel Admin</h2>
              <p>Ini adalah halaman beranda untuk melihat ringkasan pendaftaran dan mengelola data.</p>
              <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />
              <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center' }}>
                <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>* Konten UI Ringkasan Data / Tabel akan diletakkan di sini</p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="content-card">
              <h2>Riwayat Export Data Pendaftar</h2>
              <p>Proses pendaftar baru menjadi batch export, lalu unduh datanya terpisah berdasarkan lembaga di sini.</p>
              
              <button onClick={handleGenerateExport} disabled={isGenerating} className="btn-generate-export" style={{ padding: '10px 20px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: isGenerating ? 'not-allowed' : 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                {isGenerating ? 'Memproses...' : '➕ Proses Export Baru'}
              </button>

              <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px' }}>ID Export</th>
                    <th style={{ padding: '12px' }}>Waktu Export</th>
                    <th style={{ padding: '12px' }}>Tgl Dibuat (Awal)</th>
                    <th style={{ padding: '12px' }}>Tgl Dibuat (Akhir)</th>
                    <th style={{ padding: '12px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#888' }}>Belum ada riwayat export.</td>
                    </tr>
                  ) : (
                    exportHistory.map((item) => (
                      <tr key={item.export_id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>#{item.export_id}</td>
                        <td style={{ padding: '12px' }}>{new Date(item.export_date).toLocaleString('id-ID')}</td>
                        <td style={{ padding: '12px' }}>{item.tanggal_dibuat_awal ? new Date(item.tanggal_dibuat_awal).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ padding: '12px' }}>{item.tanggal_dibuat_akhir ? new Date(item.tanggal_dibuat_akhir).toLocaleDateString('id-ID') : '-'}</td>
                        <td style={{ padding: '12px' }}>
                          {/* TOMBOL AKSI DIUBAH UNTUK MEMANGGIL LOGIKA XLS TERPISAH */}
                          <button 
                            onClick={() => handleDownloadXLSX(item.export_id)}
                            style={{ padding: '6px 12px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            🟢 Unduh Excel (.xlsx)
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAdminPPDB;