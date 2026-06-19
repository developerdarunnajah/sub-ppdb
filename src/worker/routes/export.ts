import { Hono } from 'hono';

// Sesuaikan nama Env jika perlu
type Env = {
  Bindings: {
    DB: D1Database;
  };
};

// Buat instance Hono khusus untuk route export
const exportRoute = new Hono<Env>();

// ==========================================
// 1. Mengambil Riwayat Export (/export/history)
// ==========================================
exportRoute.get('/history', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM export ORDER BY export_date DESC').all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengambil riwayat export', error: error.message }, 500);
  }
});

// ==========================================
// 2. Melakukan Proses Export Baru (/export/generate)
// ==========================================
exportRoute.post('/generate', async (c) => {
  const db = c.env.DB;
  try {
    // a. Cek apakah ada data siswa baru (status = 0)
    const cekData = await db.prepare('SELECT count(*) as total FROM santri WHERE status = 0').first<{total: number}>();
    
    if (!cekData || cekData.total === 0) {
      return c.json({ success: false, message: 'Tidak ada data pendaftar baru (status 0) untuk diexport.' }, 404);
    }

    // b. Ambil rentang tanggal dari tabel 'dibuat'
    const dateRange = await db.prepare(`
      SELECT MIN(d.dibuat_pada) as awal, MAX(d.dibuat_pada) as akhir 
      FROM santri s 
      JOIN dibuat d ON s.kode_registrasi = d.kode_registrasi 
      WHERE s.status = 0
    `).first<{awal: string, akhir: string}>();

    // c. Buat export_id baru (status = 1 artinya berhasil/aktif)
    const insertExport = await db.prepare(`
      INSERT INTO export (status, tanggal_dibuat_awal, tanggal_dibuat_akhir) 
      VALUES (?, ?, ?) RETURNING export_id
    `).bind(1, dateRange?.awal || null, dateRange?.akhir || null).first<{export_id: number}>();

    const exportId = insertExport?.export_id;

    if (!exportId) {
      throw new Error("Gagal membuat ID Export");
    }

    // d. Ubah status data santri dari 0 menjadi angka sesuai export_id
    await db.prepare('UPDATE santri SET status = ? WHERE status = 0').bind(exportId).run();

    return c.json({ 
      success: true, 
      message: 'Data berhasil diproses menjadi batch export baru.', 
      data: { export_id: exportId, total_data: cekData.total } 
    });

  } catch (error: any) {
    console.error("Error saat generate export:", error);
    return c.json({ success: false, message: 'Gagal memproses export', error: error.message }, 500);
  }
});

// ==========================================
// 3. Mengambil Data Detail untuk di-Download (/export/data/:export_id)
// ==========================================
// ==========================================
// 3. Mengambil Data Detail untuk di-Download (/export/data/:export_id)
// ==========================================
// ==========================================
// 3. Mengambil Data Detail untuk di-Download (/export/data/:export_id)
// ==========================================
exportRoute.get('/data/:export_id', async (c) => {
  const exportId = c.req.param('export_id');
  try {
    // Melakukan JOIN dengan ikatan_lembaga dan lembaga_naungan
    // agar data bisa dikelompokkan berdasarkan lembaga di frontend
    const { results } = await c.env.DB.prepare(`
      SELECT 
        s.nama_lengkap, 
        s.jenis_kelamin, 
        s.foto, 
        s.kewarganegaraan, 
        s.kode_desa, 
        s.rt, 
        s.rw, 
        s.alamat_lengkap,
        l.nama_lembaga
      FROM santri s
      JOIN ikatan_lembaga il ON s.santri_uc = il.santri_uc
      JOIN lembaga_naungan l ON il.lembaga_id = l.lembaga_id
      WHERE s.status = ?
    `).bind(exportId).all();

    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengambil data detail export', error: error.message }, 500);
  }
});
export default exportRoute;