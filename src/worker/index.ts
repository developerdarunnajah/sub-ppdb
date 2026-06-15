// File: src/worker/index.ts
import { Hono } from "hono";
// Import file routing yang baru dibuat
import authRouter from "./routes/login";

const app = new Hono<{ Bindings: Env }>();

// Endpoint tes
app.get("/api", (c) => c.json({ message: "Backend Sub-PPDB API Aktif" }));

// Sambungkan rute '/api' dengan authRouter
// Semua rute di dalam authRouter otomatis akan diawali dengan '/api'
// Sehingga endpoint-nya tetap menjadi POST /api/login
app.route("/api", authRouter);

export default app;