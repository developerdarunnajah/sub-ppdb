import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/dashboard.css';

const DashboardClientPPDB: React.FC = () => {
  // State untuk melacak menu mana yang sedang aktif
  const [activeTab, setActiveTab] = useState<'beranda' | 'formulir'>('beranda');
  const [username, setUsername] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Mengecek apakah pengguna sudah login
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
          Portal PPDB
        </div>
        <ul className="sidebar-menu">
          <li 
            className={activeTab === 'beranda' ? 'active' : ''} 
            onClick={() => setActiveTab('beranda')}
          >
            🏠 Beranda
          </li>
          <li 
            className={activeTab === 'formulir' ? 'active' : ''} 
            onClick={() => setActiveTab('formulir')}
          >
            📝 Formulir
          </li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {/* Top Navbar */}
        <div className="top-navbar">
          <span style={{ marginRight: '15px', color: '#555' }}>
            Halo, {username}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Keluar
          </button>
        </div>

        {/* Content Area (Berubah sesuai tab yang dipilih) */}
        <div className="content-area">
          {activeTab === 'beranda' && (
            <div className="content-card">
              <h2>Selamat Datang di Dasbor PPDB</h2>
              <p>Ini adalah halaman beranda Anda. Di sini Anda bisa melihat status pendaftaran dan informasi penting lainnya.</p>
            </div>
          )}

          {activeTab === 'formulir' && (
            <div className="content-card">
              <h2>Formulir Pendaftaran</h2>
              <p>Silakan isi data diri santri dengan lengkap pada form di bawah ini.</p>
              {/* Nanti form inputan Anda bisa ditaruh di sini */}
              <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />
              <p style={{ color: '#888', fontStyle: 'italic' }}>* Komponen Form belum dibuat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardClientPPDB;