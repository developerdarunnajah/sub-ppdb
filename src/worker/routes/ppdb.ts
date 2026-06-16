import { Hono } from 'hono';

// Sesuaikan nama Env jika perlu (tergantung konfigurasi Anda)
type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const ppdb = new Hono<Env>();

// ==========================================
// FUNGSI HELPER: GENERATE 50 KARAKTER ACAK
// ==========================================
function generateSantriUC(length: number = 50) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==========================================
// ENDPOINT MASTER (Lembaga & Wali)
// ==========================================
ppdb.get('/lembaga', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM lembaga_naungan').all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengambil data lembaga', error: error.message }, 500);
  }
});

ppdb.get('/wali/:hp', async (c) => {
  const hp = c.req.param('hp');
  try {
    const wali = await c.env.DB.prepare('SELECT * FROM wali WHERE hp_wali = ?').bind(hp).first();
    if (wali) return c.json({ success: true, data: wali });
    return c.json({ success: false, message: 'Data wali tidak ditemukan' }, 404);
  } catch (error: any) {
    return c.json({ success: false, message: 'Terjadi kesalahan server' }, 500);
  }
});

// ==========================================
// ENDPOINT WILAYAH BERJENJANG
// ==========================================
ppdb.get('/wilayah/provinsi', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM provinsi').all();
  return c.json({ success: true, data: results });
});

ppdb.get('/wilayah/kabupaten/:kode_prov', async (c) => {
  const kodeProv = c.req.param('kode_prov');
  const { results } = await c.env.DB.prepare('SELECT * FROM kabupaten WHERE kode_provinsi = ?').bind(kodeProv).all();
  return c.json({ success: true, data: results });
});

ppdb.get('/wilayah/kecamatan/:kode_kab', async (c) => {
  const kodeKab = c.req.param('kode_kab');
  const { results } = await c.env.DB.prepare('SELECT * FROM kecamatan WHERE kode_kabupaten = ?').bind(kodeKab).all();
  return c.json({ success: true, data: results });
});

ppdb.get('/wilayah/desa/:kode_kec', async (c) => {
  const kodeKec = c.req.param('kode_kec');
  const { results } = await c.env.DB.prepare('SELECT * FROM desa WHERE kode_kecamatan = ?').bind(kodeKec).all();
  return c.json({ success: true, data: results });
});

// ==========================================
// ENDPOINT SUBMIT (Transaksi Batch)
// ==========================================
ppdb.post('/submit', async (c) => {
  try {
    const body = await c.req.json();
    let {
      namaLengkap, jenisKelamin, kewarganegaraan, kodeDesa, rt, rw, alamatLengkap, 
      hpWali, namaWali, lembagaId,
      fotoBiodata, ijazah, ktpWali, akta, nisn, kk, dokumenTambahan
    } = body;

    // 1. Validasi Kolom Wajib (Sekarang hpWali dan namaWali TIDAK ADA di sini)
    if (!namaLengkap || !jenisKelamin || !kewarganegaraan || !alamatLengkap || !lembagaId) {
      return c.json({ success: false, message: 'Data santri, alamat, dan lembaga wajib diisi' }, 400);
    }

    // 2. Logic Pengaturan WNA/WNI
    if (kewarganegaraan === '2') {
      kodeDesa = null; rt = null; rw = null;
    } else if (!kodeDesa) {
      return c.json({ success: false, message: 'Data wilayah (Desa) wajib dipilih untuk WNI' }, 400);
    }

    // Pembersihan Input Wali agar benar-benar menjadi null jika kosong
    const finalHpWali = (hpWali && hpWali.trim() !== '') ? hpWali.trim() : null;
    const finalNamaWali = (namaWali && namaWali.trim() !== '') ? namaWali.trim() : null;

    const db = c.env.DB;
    const statements = [];

    // --- STEP A: CEK DAN INSERT WALI (HANYA JIKA ADA NOMOR HP) ---
    if (finalHpWali) {
      const waliExist = await db.prepare('SELECT hp_wali FROM wali WHERE hp_wali = ?').bind(finalHpWali).first();
      // Jika belum ada di DB, tambahkan wali baru
      if (!waliExist) {
        statements.push(db.prepare('INSERT INTO wali (hp_wali, nama_wali) VALUES (?, ?)').bind(finalHpWali, finalNamaWali));
      }
    }

    // --- STEP B: LOGIK GENERATE SANTRI_UC 50 KARAKTER UNIK ---
    let santriUc = '';
    let isUnique = false;

    while (!isUnique) {
      santriUc = generateSantriUC(50);
      const checkExist = await db.prepare('SELECT santri_uc FROM santri WHERE santri_uc = ?').bind(santriUc).first();
      if (!checkExist) {
        isUnique = true;
      }
    }

    // --- STEP C: LOGIK KODE REGISTRASI ---
    const tahun = new Date().getFullYear();
    const countData = await db.prepare('SELECT COUNT(*) as total FROM ikatan_lembaga WHERE lembaga_id = ?').bind(parseInt(lembagaId)).first<{total: number}>();
    
    const nomorUrut = (countData?.total || 0) + 1;
    const stringNomorUrut = String(nomorUrut).padStart(4, '0');
    const kodeRegistrasi = `${lembagaId}${tahun}${stringNomorUrut}`; 
    const statusAwal = 0; 

    // --- STEP D: MENYUSUN BATCH INSERT ---
    
    // Insert Santri (Perhatikan variabel `finalHpWali` yang digunakan)
    statements.push(
      db.prepare(`
        INSERT INTO santri (
          santri_uc, kode_registrasi, nama_lengkap, jenis_kelamin, 
          kewarganegaraan, kode_desa, rt, rw, alamat_lengkap, hp_wali, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        santriUc, kodeRegistrasi, namaLengkap, parseInt(jenisKelamin), 
        parseInt(kewarganegaraan), kodeDesa || null, rt ? parseInt(rt) : null, 
        rw ? parseInt(rw) : null, alamatLengkap, finalHpWali, statusAwal
      )
    );

    // Insert ke tabel dibuat (Logika monitoring export tanggal)
    statements.push(
      db.prepare('INSERT INTO dibuat (kode_registrasi) VALUES (?)').bind(kodeRegistrasi)
    );

    // Insert Ikatan Lembaga
    statements.push(
      db.prepare('INSERT INTO ikatan_lembaga (santri_uc, lembaga_id) VALUES (?, ?)').bind(santriUc, parseInt(lembagaId))
    );

    // Insert Dokumen
    statements.push(
      db.prepare(`
        INSERT INTO dokumen (santri_uc, foto_biodata, ijazah, ktp_wali, akta, nisn, kk, dokumen_tambahan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        santriUc, parseInt(fotoBiodata || '0'), parseInt(ijazah || '0'), parseInt(ktpWali || '0'), 
        parseInt(akta || '0'), parseInt(nisn || '0'), parseInt(kk || '0'), dokumenTambahan || null
      )
    );

    // --- STEP E: EKSEKUSI SEMUA QUERY BATCH ---
    await db.batch(statements);

    return c.json({ success: true, message: 'Pendaftaran berhasil disimpan', data: { kode_registrasi: kodeRegistrasi } }, 201);
  } catch (error: any) {
    console.error("Error saat submit PPDB:", error);
    return c.json({ success: false, message: 'Gagal menyimpan data pendaftaran', error: error.message }, 500);
  }
});

export default ppdb;