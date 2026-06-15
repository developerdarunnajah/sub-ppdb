import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset pesan error dan set status loading
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Memanggil endpoint backend API
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Jika sukses, simpan data sesi dasar di localStorage
        // agar bisa diakses oleh halaman /multiperan nanti
        localStorage.setItem('user_session', JSON.stringify(data.user));
        
        // Arahkan (redirect) pengguna ke halaman pemilihan peran
        navigate('/multiperan');
      } else {
        // Jika gagal (username/password salah), tampilkan pesan dari backend
        setErrorMsg(data.message || 'Login gagal, silakan coba lagi.');
      }
    } catch (error) {
      // Jika terjadi kesalahan jaringan (server mati/koneksi putus)
      setErrorMsg('Terjadi kesalahan pada jaringan atau server.');
      console.error("Error saat login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Masuk Sistem</h2>
        
        {/* Tampilkan pesan error jika ada */}
        {errorMsg && (
          <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;