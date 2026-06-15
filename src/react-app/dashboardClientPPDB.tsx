import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/dashboard.css';
import './style/dashboardclientppdb.css'; // <-- Import CSS baru

interface Lembaga { lembaga_id: number; nama_lembaga: string; }
interface Provinsi { kode_provinsi: string; nama_provinsi: string; }
interface Kabupaten { kode_kabupaten: string; nama_kabupaten: string; }
interface Kecamatan { kode_kecamatan: string; nama_kecamatan: string; }
interface Desa { kode_desa: string; nama_desa: string; }

const DashboardClientPPDB: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'beranda' | 'formulir'>('beranda');
  const [username, setUsername] = useState('');
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

  // State Pop-up
  const [showPopup, setShowPopup] = useState(false);
  const [registeredCode, setRegisteredCode] = useState('');

  // State Form
  const [namaLengkap, setNamaLengkap] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('');
  const [kewarganegaraan, setKewarganegaraan] = useState('1');
  const [rt, setRt] = useState('');
  const [rw, setRw] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [hpWali, setHpWali] = useState('');
  const [namaWali, setNamaWali] = useState('');
  const [isWaliFound, setIsWaliFound] = useState(false);
  const [lembagaId, setLembagaId] = useState('');

  // State Dokumen
  const [fotoBiodata, setFotoBiodata] = useState('0');
  const [ijazah, setIjazah] = useState('0');
  const [ktpWali, setKtpWali] = useState('0');
  const [akta, setAkta] = useState('0');
  const [nisn, setNisn] = useState('0');
  const [kk, setKk] = useState('0');
  const [dokumenTambahan, setDokumenTambahan] = useState('');

  // State List Wilayah
  const [lembagaList, setLembagaList] = useState<Lembaga[]>([]);
  const [provinsiList, setProvinsiList] = useState<Provinsi[]>([]);
  const [kabupatenList, setKabupatenList] = useState<Kabupaten[]>([]);
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);

  // State Selected Wilayah
  const [selectedProvinsi, setSelectedProvinsi] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedDesa, setSelectedDesa] = useState(''); 

  const API_BASE = '/api/ppdb';

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
      navigate('/');
      return;
    }
    setUsername(JSON.parse(sessionData).username);

    fetch(`${API_BASE}/lembaga`).then(res => res.json()).then(data => { if (data.success) setLembagaList(data.data); });
    fetch(`${API_BASE}/wilayah/provinsi`).then(res => res.json()).then(data => { if (data.success) setProvinsiList(data.data); });
  }, [navigate]);

  useEffect(() => {
    if (selectedProvinsi) {
      fetch(`${API_BASE}/wilayah/kabupaten/${selectedProvinsi}`).then(res => res.json()).then(data => { if (data.success) setKabupatenList(data.data); });
    } else { setKabupatenList([]); }
    setSelectedKabupaten(''); setKecamatanList([]); setSelectedKecamatan(''); setDesaList([]); setSelectedDesa('');
  }, [selectedProvinsi]);

  useEffect(() => {
    if (selectedKabupaten) {
      fetch(`${API_BASE}/wilayah/kecamatan/${selectedKabupaten}`).then(res => res.json()).then(data => { if (data.success) setKecamatanList(data.data); });
    } else { setKecamatanList([]); }
    setSelectedKecamatan(''); setDesaList([]); setSelectedDesa('');
  }, [selectedKabupaten]);

  useEffect(() => {
    if (selectedKecamatan) {
      fetch(`${API_BASE}/wilayah/desa/${selectedKecamatan}`).then(res => res.json()).then(data => { if (data.success) setDesaList(data.data); });
    } else { setDesaList([]); }
    setSelectedDesa('');
  }, [selectedKecamatan]);

  const handleCheckWali = async () => {
    if (!hpWali) { alert('Silakan masukkan nomor HP wali terlebih dahulu.'); return; }
    try {
      const res = await fetch(`${API_BASE}/wali/${hpWali}`);
      const data = await res.json();
      if (data.success && data.data) {
        setNamaWali(data.data.nama_wali); setIsWaliFound(true); alert('Data Wali ditemukan!');
      } else {
        setNamaWali(''); setIsWaliFound(false); alert('Data tidak ditemukan, silakan isi manual.');
      }
    } catch (error) { alert('Terjadi kesalahan saat memeriksa data wali.'); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); 
    setIsLoadingSubmit(true);

    const payload = {
      namaLengkap, jenisKelamin, kewarganegaraan, kodeDesa: selectedDesa, rt, rw, 
      alamatLengkap, hpWali, namaWali, lembagaId,
      fotoBiodata, ijazah, ktpWali, akta, nisn, kk, dokumenTambahan
    };

    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (result.success) {
        setRegisteredCode(result.data.kode_registrasi);
        setShowPopup(true);
      } else {
        alert(`Gagal: ${result.message}`);
      }
    } catch (error) { alert('Terjadi kesalahan saat menyimpan formulir.'); } 
    finally { setIsLoadingSubmit(false); }
  };

  const resetForm = () => {
    setNamaLengkap(''); setJenisKelamin(''); setKewarganegaraan('1'); setRt(''); setRw('');
    setAlamatLengkap(''); setHpWali(''); setNamaWali(''); setIsWaliFound(false); setLembagaId('');
    setFotoBiodata('0'); setIjazah('0'); setKtpWali('0'); setAkta('0'); setNisn('0'); setKk('0'); setDokumenTambahan('');
    setSelectedProvinsi('');
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    resetForm();
  };

  const handleLogout = () => { localStorage.removeItem('user_session'); navigate('/'); };

  const renderRadioGroup = (label: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => (
    <div className="radio-item">
      <label className="radio-label">{label}</label>
      <div className="radio-options">
        <label className="radio-option-label">
          <input type="radio" value="1" checked={value === '1'} onChange={(e) => setter(e.target.value)} className="radio-option-input" /> Ada
        </label>
        <label className="radio-option-label">
          <input type="radio" value="0" checked={value === '0'} onChange={(e) => setter(e.target.value)} className="radio-option-input" /> Belum
        </label>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* POP-UP MODAL */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-icon">🎉</div>
            <h2 className="popup-title">Pendaftaran Berhasil!</h2>
            <p className="popup-desc">Simpan kode registrasi berikut untuk verifikasi lebih lanjut.</p>
            <div className="popup-code-box">
              <h1 className="popup-code-text">{registeredCode}</h1>
            </div>
            <button type="button" onClick={handleClosePopup} className="btn-close-popup">
              Tutup & Input Pendaftar Baru
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">Portal PPDB</div>
        <ul className="sidebar-menu">
          <li className={activeTab === 'beranda' ? 'active' : ''} onClick={() => setActiveTab('beranda')}>🏠 Beranda</li>
          <li className={activeTab === 'formulir' ? 'active' : ''} onClick={() => setActiveTab('formulir')}>📝 Formulir</li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="top-navbar">
          <span style={{ marginRight: '15px', color: '#555' }}>Halo, {username}</span>
          <button className="logout-btn" onClick={handleLogout}>Keluar</button>
        </div>

        <div className="content-area">
          {activeTab === 'beranda' && (
            <div className="content-card">
              <h2>Selamat Datang di Dasbor PPDB</h2>
              <p>Ini adalah halaman beranda Anda. Di sini Anda bisa melihat status pendaftaran dan informasi penting lainnya.</p>
            </div>
          )}

          {activeTab === 'formulir' && (
            <div className="content-card">
              <h2>Formulir Pendaftaran Santri</h2>
              <p>Silakan isi data diri santri dan pilih lembaga tujuan dengan lengkap.</p>
              <p className="text-danger-small">* Menandakan data wajib diisi</p>
              
              <hr className="form-divider" />
              
              <form className="ppdb-form" onSubmit={handleSubmit}>
                
                <h3 className="form-section-title">Data Santri</h3>
                
                <div className="form-group">
                  <label className="form-label">Nama Lengkap <span className="required-star">*</span></label>
                  <input type="text" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} placeholder="Masukkan nama lengkap santri" className="form-control" required />
                </div>

                <div className="form-row-large">
                  <div className="form-col">
                    <label className="form-label">Jenis Kelamin <span className="required-star">*</span></label>
                    <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="form-control" required>
                      <option value="">-- Pilih Jenis Kelamin --</option>
                      <option value="1">Laki-laki</option>
                      <option value="2">Perempuan</option>
                    </select>
                  </div>
                  <div className="form-col">
                    <label className="form-label">Kewarganegaraan <span className="required-star">*</span></label>
                    <select value={kewarganegaraan} onChange={(e) => setKewarganegaraan(e.target.value)} className="form-control" required>
                      <option value="1">WNI (Warga Negara Indonesia)</option>
                      <option value="2">WNA (Warga Negara Asing)</option>
                    </select>
                  </div>
                </div>

                <h3 className="form-section-title" style={{ marginTop: '10px' }}>Alamat & Wilayah <span className="required-star">*</span></h3>

                {kewarganegaraan === '1' && (
                  <>
                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">Provinsi</label>
                        <select value={selectedProvinsi} onChange={(e) => setSelectedProvinsi(e.target.value)} className="form-control" required>
                          <option value="">-- Pilih Provinsi --</option>
                          {provinsiList.map(p => <option key={p.kode_provinsi} value={p.kode_provinsi}>{p.nama_provinsi}</option>)}
                        </select>
                      </div>
                      <div className="form-col">
                        <label className="form-label">Kabupaten / Kota</label>
                        <select value={selectedKabupaten} onChange={(e) => setSelectedKabupaten(e.target.value)} className="form-control" required disabled={!selectedProvinsi}>
                          <option value="">-- Pilih Kabupaten --</option>
                          {kabupatenList.map(k => <option key={k.kode_kabupaten} value={k.kode_kabupaten}>{k.nama_kabupaten}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">Kecamatan</label>
                        <select value={selectedKecamatan} onChange={(e) => setSelectedKecamatan(e.target.value)} className="form-control" required disabled={!selectedKabupaten}>
                          <option value="">-- Pilih Kecamatan --</option>
                          {kecamatanList.map(k => <option key={k.kode_kecamatan} value={k.kode_kecamatan}>{k.nama_kecamatan}</option>)}
                        </select>
                      </div>
                      <div className="form-col">
                        <label className="form-label">Desa / Kelurahan</label>
                        <select value={selectedDesa} onChange={(e) => setSelectedDesa(e.target.value)} className="form-control" required disabled={!selectedKecamatan}>
                          <option value="">-- Pilih Desa --</option>
                          {desaList.map(d => <option key={d.kode_desa} value={d.kode_desa}>{d.nama_desa}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">RT</label>
                        <input type="number" value={rt} onChange={(e) => setRt(e.target.value)} placeholder="000" className="form-control" />
                      </div>
                      <div className="form-col">
                        <label className="form-label">RW</label>
                        <input type="number" value={rw} onChange={(e) => setRw(e.target.value)} placeholder="000" className="form-control" />
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group-large">
                  <label className="form-label">Alamat Lengkap <span className="required-star">*</span></label>
                  <textarea rows={3} value={alamatLengkap} onChange={(e) => setAlamatLengkap(e.target.value)} placeholder={kewarganegaraan === '2' ? "Masukkan alamat lengkap negara asal atau domisili saat ini" : "Masukkan alamat lengkap (Jalan, Dusun, dll)"} className="form-control" required></textarea>
                </div>

                <h3 className="form-section-title">Data Wali</h3>
                
                <div className="form-row-bottom">
                  <div className="form-col">
                    <label className="form-label">Nomor HP Wali <span className="required-star">*</span></label>
                    <div className="form-input-group">
                      <input type="text" value={hpWali} onChange={(e) => setHpWali(e.target.value)} placeholder="Masukkan nomor HP wali" className="form-control" style={{ flex: 1 }} required />
                      <button type="button" onClick={handleCheckWali} className="btn-check-hp">Periksa</button>
                    </div>
                  </div>
                  
                  <div className="form-col">
                    <label className="form-label">Nama Wali <span className="required-star">*</span></label>
                    <input type="text" value={namaWali} onChange={(e) => setNamaWali(e.target.value)} placeholder="Masukkan nama wali" disabled={isWaliFound} className="form-control" required />
                  </div>
                </div>

                <hr className="form-divider" />

                <h3 className="form-section-title">Lembaga Tujuan</h3>

                <div className="form-group-large">
                  <label className="form-label">Lembaga Naungan <span className="required-star">*</span></label>
                  <select value={lembagaId} onChange={(e) => setLembagaId(e.target.value)} className="form-control" required>
                    <option value="">-- Pilih Lembaga Tujuan --</option>
                    {lembagaList.map((item) => (
                      <option key={item.lembaga_id} value={item.lembaga_id}>{item.nama_lembaga}</option>
                    ))}
                  </select>
                </div>

                <hr className="form-divider-thick" />

                <h3 className="form-section-title">Kelengkapan Dokumen Fisik</h3>
                <p className="form-info-text">Tandai "Ada" jika dokumen fisik sudah disiapkan oleh santri.</p>

                <div className="radio-list-container">
                  {renderRadioGroup("1. Foto Biodata", fotoBiodata, setFotoBiodata)}
                  {renderRadioGroup("2. Ijazah Terakhir", ijazah, setIjazah)}
                  {renderRadioGroup("3. KTP Wali", ktpWali, setKtpWali)}
                  {renderRadioGroup("4. Akta Kelahiran", akta, setAkta)}
                  {renderRadioGroup("5. NISN / Surat Keterangan", nisn, setNisn)}
                  {renderRadioGroup("6. Kartu Keluarga (KK)", kk, setKk)}
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label className="form-label">Dokumen Tambahan (Opsional)</label>
                  <textarea rows={3} value={dokumenTambahan} onChange={(e) => setDokumenTambahan(e.target.value)} placeholder="Sebutkan jika ada dokumen pendukung lainnya..." className="form-control"></textarea>
                </div>

                <div className="form-action-end">
                  <button type="submit" disabled={isLoadingSubmit} className="btn-submit">
                    {isLoadingSubmit ? 'Memproses...' : 'Kirim Pendaftaran'}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardClientPPDB;