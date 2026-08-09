# Photo Selector – Aplikasi Proofing Foto untuk Fotografer

## 📸 Ringkasan Proyek
Aplikasi web **Photo Selector** memungkinkan fotografer membuat galeri foto berbasis **Google Drive** untuk dibagikan ke klien. Klien dapat memilih foto yang ingin diedit, batas pilihan dapat dikonfigurasi, dan pilihan tersebut dikirimkan ke fotografer via **WhatsApp**.

### Fitur Utama (saat ini)
- **Admin /create‑gallery** – formulir untuk membuat galeri baru (nama klien, URL folder Google Drive, maksimum foto, nomor WhatsApp).
- **Galeri Klien** – menampilkan foto dari Google Drive (atau data mock untuk pengembangan), mendukung **preview**, **seleksi** dengan batas jumlah, serta **generasi tautan WhatsApp** yang ter‑URL‑encode.
- **Penyimpanan** – konfigurasi galeri disimpan secara persisten di **Supabase** (tabel `galleries`).
- **Keamanan** – kredensial Google Drive dan kunci Supabase hanya diakses di server (tidak pernah terekspos ke browser).

## 🚀 Cara Menjalankan (Development)
```bash
# Install dependencies
npm install

# Salin contoh environment dan sesuaikan
cp .env.example .env.local   # lalu edit .env.local dengan nilai yang valid

# Jalankan server development
npm run dev
```
Buka <http://localhost:3000> di browser.

## 📁 Struktur Direktori Penting
```
app/                # Next.js App Router – halaman & server components
components/         # Komponen UI (gallery grid, lightbox, dll.)
lib/
  supabase/         # Inisialisasi klien Supabase (anon & service‑role)
  services/         # Logika bisnis gallery (create, fetch)
  types/            # TypeScript types untuk foto & galeri
public/              # Static assets (favicon, dll.)
.supabase/           # (opsional) konfigurasi lokal Supabase
```

## 📄 .gitignore
File `.gitignore` sudah disiapkan untuk mengabaikan:
- `node_modules/`
- folder build Next.js (`.next/`, `out/`)
- file konfigurasi lingkungan (`.env*`)
- output test (`coverage/`)
- file kunci/sertifikat (`*.pem`)
- log debug (`npm-debug.log*`, `yarn-*.log`)
- file sistem (`.DS_Store`)
- artefak TypeScript (`*.tsbuildinfo`, `next-env.d.ts`)

## 📘 PRD (Product Requirements Document)
Dokumen **PRD.md** berisi spesifikasi lengkap proyek, mulai dari *Product Overview*, alur kerja fotografer → klien, hingga tahapan pengembangan (Phase 1–4). Bacalah untuk memahami prioritas fitur dan keputusan arsitektur.

## 🤖 AGENTS.md (Aturan Agen)
`AGENTS.md` mendefinisikan **aturan perilaku, arsitektur, dan keamanan** yang harus diikuti oleh semua kode:
- Gunakan **Next.js**, **TypeScript**, **App Router**, **Tailwind CSS**
- Server Components secara default, `"use client"` hanya untuk interaktivitas (seleksi foto, lightbox)
- Google Drive API dipanggil di sisi server, tidak pernah mengekspos kredensial
- Supabase: *anon key* untuk read‑only di client, *service‑role key* hanya di server untuk menulis
- UI harus bersih, tipografi netral, responsif, dan tidak berlebihan (tidak menggunakan gradient/animasi berlebih)

## 📚 CLAUDE.md
File ini berfungsi sebagai **metadata** untuk agen Claude yang membantu proyek ini. Saat ini berisi satu baris `@AGENTS.md` yang menandakan bahwa aturan di `AGENTS.md` berlaku untuk Claude.

## 📦 .env.example – Contoh Konfigurasi Lingkungan
File `.env.example` menyediakan contoh variabel lingkungan yang **harus dipublikasikan** (tanpa nilai rahasia) sehingga kontributor dapat menyiapkan lingkungan mereka:
```dotenv
# Google Service Account (untuk Google Drive API)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Supabase credentials (dapat ditemukan di Supabase Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABRANE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"
```
> **Catatan:** Jangan pernah menempatkan nilai nyata di repository publik. Gantilah dengan nilai Anda sendiri pada file `.env.local` setelah menyalin contoh ini.

---

*Dibuat oleh tim **Photo Selector** – kode bersifat open‑source dan dapat disesuaikan untuk proyek fotografi lainnya.*
