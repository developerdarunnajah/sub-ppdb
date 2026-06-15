import { Hono } from "hono";

const authRouter = new Hono<{ Bindings: Env }>();

/**
 * 1. ENDPOINT LOGIN
 * Hanya mengecek tabel "akses" (username & password)
 * POST /api/login
 */
authRouter.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ success: false, message: "Username dan password wajib diisi." }, 400);
    }

    // Kueri HANYA ke tabel akses
    const queryAkses = `
      SELECT pengguna_uc, username, password 
      FROM "akses" 
      WHERE username = ?
    `;
    
    const userRow = await c.env.DB.prepare(queryAkses).bind(username).first<{
      pengguna_uc: string;
      username: string;
      password: string;
    }>();

    // Cek apakah username ada dan password cocok
    if (!userRow || userRow.password !== password) {
      return c.json({ success: false, message: "Username atau password salah." }, 401);
    }

    // Jika berhasil, hanya kembalikan data akses dasar (pengguna_uc)
    return c.json({
      success: true,
      message: "Otentikasi berhasil!",
      user: {
        uc: userRow.pengguna_uc,
        username: userRow.username
      }
    });

  } catch (error: any) {
    return c.json({ 
      success: false, 
      message: "Terjadi kesalahan internal server.",
      error: error.message 
    }, 500);
  }
});


/**
 * 2. ENDPOINT AMBIL PERAN
 * Dipanggil nanti di halaman /multiperan berdasarkan pengguna_uc
 * POST /api/peran
 */
authRouter.post("/peran", async (c) => {
  try {
    // Menerima pengguna_uc dari halaman frontend
    const { pengguna_uc } = await c.req.json();

    if (!pengguna_uc) {
      return c.json({ success: false, message: "ID Pengguna tidak valid." }, 400);
    }

    // Kueri untuk mengambil daftar peran berdasarkan pengguna_uc
    const queryPeran = `
      SELECT pr.nama_peran 
      FROM "multiperan" mp
      JOIN "peran" pr ON mp.peran_id = pr.peran_id
      WHERE mp.pengguna_uc = ?
    `;

    const { results } = await c.env.DB.prepare(queryPeran).bind(pengguna_uc).all<{ nama_peran: string }>();
    const daftarPeran = results.map(row => row.nama_peran);

    return c.json({
      success: true,
      peran: daftarPeran
    });

  } catch (error: any) {
    return c.json({ success: false, message: "Gagal mengambil data peran." }, 500);
  }
});

export default authRouter;