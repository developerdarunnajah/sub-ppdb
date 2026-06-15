import { Hono } from 'hono';

const ppdb = new Hono<{ Bindings: Env }>();

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

    if (!namaLengkap || !jenisKelamin || !kewarganegaraan || !alamatLengkap || !hpWali || !namaWali || !lembagaId) {
      return c.json({ success: false, message: 'Semua data wajib (*) harus diisi' }, 400);
    }

    if (kewarganegaraan === '2') {
      kodeDesa = null; rt = null; rw = null;
    } else if (!kodeDesa) {
      return c.json({ success: false, message: 'Data wilayah (Desa) wajib dipilih untuk WNI' }, 400);
    }

    const db = c.env.DB;
    const statements = [];

    const waliExist = await db.prepare('SELECT hp_wali FROM wali WHERE hp_wali = ?').bind(hpWali).first();
    if (!waliExist) {
      statements.push(db.prepare('INSERT INTO wali (hp_wali, nama_wali) VALUES (?, ?)').bind(hpWali, namaWali));
    }

    const santriUc = crypto.randomUUID(); 
    const tahun = new Date().getFullYear();
    const countData = await db.prepare('SELECT COUNT(*) as total FROM ikatan_lembaga WHERE lembaga_id = ?').bind(parseInt(lembagaId)).first<{total: number}>();
    
    const nomorUrut = (countData?.total || 0) + 1;
    const stringNomorUrut = String(nomorUrut).padStart(4, '0');
    const kodeRegistrasi = `${lembagaId}-${tahun}-${stringNomorUrut}`; 
    const statusAwal = 0; 

    statements.push(
      db.prepare(`
        INSERT INTO santri (
          santri_uc, kode_registrasi, nama_lengkap, jenis_kelamin, 
          kewarganegaraan, kode_desa, rt, rw, alamat_lengkap, hp_wali, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        santriUc, kodeRegistrasi, namaLengkap, parseInt(jenisKelamin), 
        parseInt(kewarganegaraan), kodeDesa || null, rt ? parseInt(rt) : null, 
        rw ? parseInt(rw) : null, alamatLengkap, hpWali, statusAwal
      )
    );

    statements.push(db.prepare('INSERT INTO ikatan_lembaga (santri_uc, lembaga_id) VALUES (?, ?)').bind(santriUc, parseInt(lembagaId)));

    // Tabel Dokumen perlu dipastikan ada di database Anda
    statements.push(
      db.prepare(`
        INSERT INTO dokumen (santri_uc, foto_biodata, ijazah, ktp_wali, akta, nisn, kk, dokumen_tambahan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        santriUc, parseInt(fotoBiodata || '0'), parseInt(ijazah || '0'), parseInt(ktpWali || '0'), 
        parseInt(akta || '0'), parseInt(nisn || '0'), parseInt(kk || '0'), dokumenTambahan || null
      )
    );

    await db.batch(statements);

    return c.json({ success: true, message: 'Pendaftaran berhasil disimpan', data: { kode_registrasi: kodeRegistrasi } }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal menyimpan data pendaftaran', error: error.message }, 500);
  }
});

export default ppdb;