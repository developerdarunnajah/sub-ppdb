import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/dashboard.css'; // Menggunakan CSS layout yang sama dengan Client

const DashboardAdminPPDB: React.FC = () => {
  const [username, setUsername] = useState('');
  // State untuk melacak menu mana yang sedang aktif
  const [activeTab, setActiveTab] = useState<'beranda' | 'export'>('beranda');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Cek sesi login
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
      navigate('/');
      return;
    }
    const user = JSON.parse(sessionData);
    setUsername(user.username);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          Admin PPDB
        </div>
        <ul className="sidebar-menu">
          <li 
            className={activeTab === 'beranda' ? 'active' : ''} 
            onClick={() => setActiveTab('beranda')}
          >
            🏠 Beranda
          </li>
          <li 
            className={activeTab === 'export' ? 'active' : ''} 
            onClick={() => setActiveTab('export')}
          >
            📥 Export Data
          </li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* Top Navbar */}
        <div className="top-navbar">
          <span style={{ marginRight: '15px', color: '#555', fontWeight: '500' }}>
            Halo Admin, {username}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Keluar
          </button>
        </div>

        {/* Content Area (Berubah sesuai tab yang dipilih) */}
        <div className="content-area">
          
          {/* TAB: BERANDA */}
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

          {/* TAB: EXPORT */}
          {activeTab === 'export' && (
            <div className="content-card">
              <h2>Export Data Pendaftar</h2>
              <p>Halaman ini digunakan untuk mengunduh data pendaftaran dalam bentuk file Excel atau CSV.</p>
              
              <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />
              
              <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center' }}>
                <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>* Konten UI Filter dan Tombol Unduh akan diletakkan di sini</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardAdminPPDB;