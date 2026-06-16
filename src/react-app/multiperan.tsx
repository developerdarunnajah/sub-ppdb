import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/multiperan.css';

const Multiperan: React.FC = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [username, setUsername] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Ambil data sesi dari localStorage
    const sessionData = localStorage.getItem('user_session');
    
    if (!sessionData) {
      // Jika tidak ada sesi (belum login), kembalikan ke halaman login
      navigate('/');
      return;
    }

    const user = JSON.parse(sessionData);
    setUsername(user.username);

    // 2. Fungsi untuk mengambil data peran dari backend
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/peran', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Kirimkan pengguna_uc ke backend
          body: JSON.stringify({ pengguna_uc: user.uc }), 
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setRoles(data.peran); // Menyimpan array peran, misal: ['client_ppdb']
        } else {
          setErrorMsg(data.message || 'Gagal mengambil data peran.');
        }
      } catch (error) {
        setErrorMsg('Terjadi kesalahan jaringan.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [navigate]);

  // Fungsi saat salah satu kartu peran diklik
// Fungsi saat salah satu kartu peran diklik
  const handleRoleSelect = (roleName: string) => {
    if (roleName === 'client_ppdb') {
      navigate('/dashboardClientPPDB');
    } else if (roleName === 'admin_ppdb') {
      navigate('/dashboardAdminPPDB');
    } 
    else {
      alert(`Dasbor untuk peran ${roleName} belum tersedia.`);
    }
  };

  // Tampilan saat data sedang dimuat
  if (isLoading) {
    return <div className="loading-text">Memuat hak akses...</div>;
  }

  // Tampilan jika terjadi error
  if (errorMsg) {
    return <div className="error-text">{errorMsg}</div>;
  }

  

  return (
    <div className="multiperan-container">
      <div className="multiperan-header">
        <h2>Selamat Datang, {username}!</h2>
        <p>Silakan pilih peran Anda untuk melanjutkan</p>
      </div>

      {/* Grid untuk menampilkan kartu peran */}
      <div className="cards-grid">
        {roles.length > 0 ? (
          roles.map((role, index) => (
            <div 
              key={index} 
              className="role-card"
              onClick={() => handleRoleSelect(role)}
            >
              {/* Anda bisa menyesuaikan icon berdasarkan nama peran nantinya */}
              <div className="role-icon">👤</div>
              <div className="role-name">{role.replace('_', ' ')}</div>
              <p>Masuk ke panel {role.replace('_', ' ')}</p>
            </div>
          ))
        ) : (
          <p>Anda belum memiliki peran yang ditetapkan.</p>
        )}
      </div>
    </div>
  );
};

export default Multiperan;