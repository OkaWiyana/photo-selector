# Kala Archives — Photo Proofing

> Private photo proofing & workflow platform for photographers.

Kala Archives adalah aplikasi web modern untuk membantu fotografer mengelola proses **photo proofing** dan pemilihan foto klien secara sederhana, cepat, dan kolaboratif.

Fotografer dapat membuat galeri berdasarkan folder foto di **Google Drive**, kemudian membagikan link galeri kepada klien. Klien dapat membuka galeri dari berbagai perangkat secara bersamaan, melakukan preview lightbox, dan memilih foto dengan fitur **Shared Live Sync (Real-time)**.

Setelah selesai, daftar foto terpilih dapat langsung dikirimkan kepada fotografer melalui **WhatsApp** atau disalin ke clipboard menggunakan tombol **Copy**, tanpa perlu mencatat nama file satu per satu secara manual. Fotografer juga dilengkapi dengan **Admin Dashboard** untuk memantau progres pemilihan dan **Editor Workspace** untuk mencocokkan nama file foto yang dipilih dengan file RAW/JPG di komputer lokal.

Project ini dikembangkan sebagai personal project, portfolio, dan MVP yang siap digunakan untuk workflow fotografi nyata menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Google Drive API**, dan **Supabase (Database & Realtime)**.

---

## ✨ Features

### 🖼️ Client Photo Proofing & Shared Selection
- **Google Drive Direct Streaming**: Foto ditampilkan langsung dari folder Google Drive tanpa perlu re-upload.
- **Shared Live Selection (Real-time Sync)**: Beberapa orang (misal: pasangan atau keluarga) dapat membuka satu link galeri yang sama dari berbagai perangkat (HP & laptop) dan memilih foto secara bersamaan. Pilihan dan pembatalan foto tersinkronisasi seketika secara live tanpa perlu reload.
- **Enforced Global Selection Limit**: Batas maksimal pilihan berlaku secara global untuk seluruh galeri dan aman dari race-condition via fungsi atomic PostgreSQL.
- **Dual Submit / Export Action**:
  - **Kirim WhatsApp**: Mengirimkan daftar foto terpilih otomatis dengan format pesan rapi langsung ke nomor WhatsApp fotografer.
  - **Copy List**: Opsi menyalin daftar nama file foto ke clipboard dengan satu klik (sangat berguna di desktop atau jika ingin dikirim via email/DM).
- **Responsive Mobile-First UI**: Tampilan galeri dan action bar bawah yang bersih, nyaman, dan ergonomis di layar smartphone maupun layar lebar.
- **Photo Preview / Lightbox**: Fitur preview foto layar penuh dengan navigasi cepat.
- **Connection Status Indicator**: Menampilkan status sinkronisasi live (Sync, Connecting, Reconnecting, Offline) di header galeri.

### 📷 Photographer Admin & Dashboard
- **Create Gallery Wizard (`/admin`)**:
  - Memasukkan nama klien.
  - Menghubungkan URL folder Google Drive (otomatis validasi & ekstrak Folder ID).
  - Menentukan kuota batas maksimal pilihan foto.
  - Menentukan nomor WhatsApp tujuan.
  - Menghasilkan link unik `/gallery/[id]`.
- **Photographer Dashboard (`/admin/dashboard`)**:
  - Melihat daftar semua galeri yang pernah dibuat.
  - Memantau status pemilihan klien secara real-time (jumlah foto yang sudah dipilih vs batas maksimal).
  - Melihat detail nama file yang dipilih klien.
  - Akses cepat untuk menyalin link galeri, membuka galeri klien, atau menghapus galeri.

### 💻 Editor Workspace & Photo Matching (`/editor`)
- **Matching Tool**: Mencocokkan daftar nama file foto yang dipilih klien dengan folder foto lokal di komputer fotografer.
- **Multi-Format Support**: Mendukung deteksi file RAW (.CR2, .CR3, .ARW, .NEF, .DNG) dan JPG.
- **Export & Job Management**: Simpan preset pekerjaan editing dan salin/pindahkan hanya foto-foto yang dipilih untuk efisiensi workflow editing.

### ☁️ Google Drive Integration
- Menggunakan Service Account Google Drive API untuk akses server-side yang aman.
- Mendukung folder publik maupun shared folder Google Drive.
- Otomatis memfilter hanya format file gambar yang didukung.

### 💾 Persistent Database & Realtime
- Konfigurasi galeri dan data pilihan foto disimpan secara persisten di Supabase.
- Menggunakan skema granular `shared_selections` dengan `REPLICA IDENTITY FULL` untuk mendukung sinkronisasi real-time dua arah (INSERT & DELETE).
- Dilengkapi fallback cerdas untuk galeri lokal/demo.

### 🔐 Security & Privacy
- Kredensial sensitif (Google Service Account private key & Supabase Service Role key) **100% server-side** dan tidak pernah diekspos ke browser.
- Browser client hanya menggunakan Supabase Anon Key publik yang diproteksi Row Level Security (RLS).
- Validasi input ketat dan sanitasi nomor telepon.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| --- | --- |
| **Next.js (App Router)** | Full-stack React Framework (Server Components & API Routes) |
| **React 19** | Modern UI components & client interactivity |
| **TypeScript** | Strict type safety di seluruh layer aplikasi |
| **Tailwind CSS v4** | Styling sistem, dark theme, dan responsive UI |
| **Supabase Database** | PostgreSQL persistent storage (Galleries & Shared Selections) |
| **Supabase Realtime** | WebSocket Postgres Changes & Broadcast Channel untuk live sync |
| **Google Drive API (v3)** | Server-side photo metadata & preview extraction |
| **WhatsApp Deep Link** | Pengiriman daftar seleksi terformat via URL-encoded messaging |
| **Vercel** | Hosting platform & edge deployment |

---

## 🏗️ Architecture

```text
Photographer
     │
     ├─────────────► /admin ─────────────► Supabase (Create Gallery)
     │                                           │
     ├─────────────► /admin/dashboard ◄──────────┤ (Monitor Selections)
     │                                           │
     └─────────────► /editor (Photo Matcher)     │
                                                 │
Client Devices (HP / Laptop)                     ▼
     │                                     /gallery/[id]
     ├───────────────────────────────────────────┤
     │                                           ├─► Google Drive API (Photos)
     │                                           │
     ├─── Device A (Selects Photo) ───┐          ├─► POST /api/selections/toggle
     │                                │          │        │
     │   ◄─── Supabase Realtime ──────┴──────────┼────────┘ (Atomic PostgreSQL Function)
     │        (Broadcast + Postgres Changes)     │
     │                                           │
     └─── Device B (Live Deselects Photo)        │
                                                 │
                                                 ▼
                                     Floating Action Bar
                                     ┌───────────┴───────────┐
                                     ▼                       ▼
                               Kirim WhatsApp            Salin (Copy)
```

---

## 🔄 Application Flow

### 1. Photographer Membuat Galeri
1. Fotografer membuka `/admin`.
2. Mengisi nama klien, link folder Google Drive, batas foto, dan nomor WhatsApp.
3. Aplikasi mengekstrak Google Drive Folder ID, menyimpan konfigurasi ke tabel `galleries` di Supabase, dan membuat URL galeri unik:
   ```text
   https://domain.com/gallery/gal_xxxxxx
   ```

### 2. Klien Membuka Galeri & Memilih Bersama (Shared Live Sync)
1. Klien membuka URL galeri dari smartphone atau laptop.
2. Foto-foto dimuat secara lazy-loaded dari Google Drive API.
3. Klien atau pasangannya memilih/membatalkan foto:
   - Request dikirim ke `POST /api/selections/toggle`.
   - Database PostgreSQL menjalankan function `toggle_photo_selection` untuk memastikan batas pilihan tidak terlampaui (mencegah race-condition).
   - Event Realtime (`Broadcast` & `Postgres Changes`) memancarkan perubahan ke semua perangkat yang sedang membuka galeri tersebut secara instan.
   - Counter pilihan (misal: `Selected 7 / 10`) terupdate secara otomatis di semua layar.

### 3. Finalisasi Pilihan Klien
Setelah foto selesai dipilih, klien memiliki 2 opsi mudah di Floating Action Bar:
- **Kirim WhatsApp**: Membuka WhatsApp dengan pesan otomatis berisi nomor urut dan nama file foto yang terpilih.
- **Copy**: Menyalin daftar nama file ke clipboard untuk dikirim lewat channel lain atau disimpan sebagai catatan.

### 4. Fotografer Memproses Foto (Dashboard & Editor)
- Fotografer dapat membuka `/admin/dashboard` kapan saja untuk melihat status seleksi klien.
- Fotografer dapat membuka `/editor` untuk langsung mencocokkan nama file yang dipilih klien dengan file RAW di harddisk lokal untuk siap diedit di Lightroom / Photoshop.

---

## 💾 Database Schema

Supabase PostgreSQL menggunakan dua tabel utama:

### 1. Tabel `galleries`
Menyimpan konfigurasi galeri fotografer.

```sql
CREATE TABLE galleries (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  drive_folder_id TEXT NOT NULL,
  max_selections INTEGER NOT NULL DEFAULT 10,
  whatsapp_number TEXT NOT NULL,
  client_whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. Tabel `shared_selections` (Real-time Selections)
Menyimpan setiap foto yang dipilih secara granular untuk mendukung live sync antar perangkat.

```sql
CREATE TABLE shared_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL,
  photo_name TEXT NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wajib untuk Realtime DELETE event:
ALTER TABLE shared_selections REPLICA IDENTITY FULL;

-- Aktifkan Realtime:
ALTER PUBLICATION supabase_realtime ADD TABLE shared_selections;
```

---

## 📁 Project Structure

```text
photo-selector/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx    # Photographer monitoring dashboard
│   │   └── page.tsx              # Create gallery page
│   ├── api/
│   │   ├── drive-image/          # Server proxy for Google Drive thumbnails
│   │   └── selections/
│   │       ├── [galleryId]/      # Fetch selections API (Supabase + fallback)
│   │       └── toggle/           # Atomic toggle selection API
│   ├── editor/
│   │   └── page.tsx              # Local RAW/JPG matching workspace
│   ├── gallery/
│   │   └── [id]/page.tsx         # Client photo proofing page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Home / Landing page
│
├── components/
│   ├── admin/                    # Admin forms, tables & monitor components
│   ├── editor/                   # Editor workspace, folder selector, result tables
│   ├── gallery/
│   │   ├── GalleryContainer.tsx  # Main gallery interactive client wrapper
│   │   ├── GalleryHeader.tsx     # Header with counter & sync status indicator
│   │   ├── PhotoCard.tsx         # Grid photo tile with select toggle
│   │   ├── PhotoLightbox.tsx     # Fullscreen photo preview
│   │   └── FloatingActionBar.tsx # Bottom bar (Counter + Copy + WhatsApp actions)
│   └── ui/                       # Shared UI modals and components
│
├── lib/
│   ├── hooks/
│   │   └── useSharedSelections.ts # Realtime shared selection sync hook
│   ├── services/
│   │   ├── gallery-service.ts    # Gallery service layer & data fetching
│   │   ├── google-drive.ts       # Google Drive API integration
│   │   └── editor-storage-service.ts # Local storage service for editor jobs
│   ├── supabase/
│   │   ├── browser.ts            # Client-side Supabase client (Anon key)
│   │   └── server.ts             # Server-side Supabase client (Service role)
│   ├── types/                    # TypeScript interfaces & types
│   └── utils/
│       ├── editor.ts             # Filename matching algorithm & parser
│       └── whatsapp.ts           # WhatsApp message formatting & deep links
│
├── supabase/
│   ├── migrations/
│   │   └── 001_shared_selections.sql # Migration for shared live sync
│   └── schema.sql                # Complete Supabase reference schema
│
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (disarankan Node.js 20+)
- npm / pnpm / yarn
- Akun Supabase (Gratis)
- Google Cloud Console Project (dengan Google Drive API aktif)

### 1. Clone Repository
```bash
git clone https://github.com/OkaWiyana/photo-selector.git
cd photo-selector
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database (Supabase)
1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka menu **SQL Editor**.
3. Jalankan script dari file [`supabase/schema.sql`](supabase/schema.sql) atau [`supabase/migrations/001_shared_selections.sql`](supabase/migrations/001_shared_selections.sql).
4. Pastikan baris berikut ikut dijalankan agar event batal pilih (*DELETE*) tersinkronisasi:
   ```sql
   ALTER TABLE shared_selections REPLICA IDENTITY FULL;
   ```

### 4. Setup Google Drive API
1. Buat Service Account di Google Cloud Console dan unduh file JSON key-nya.
2. Aktifkan **Google Drive API**.
3. Masukkan Service Account Email dan Private Key ke file environment.
4. *Catatan:* Folder Google Drive yang akan digunakan harus dibagikan (*Share*) ke email Service Account tersebut dengan akses Viewer, atau disetel ke *Anyone with the link can view*.

### 5. Konfigurasi Environment Variables
Salin template environment:
```bash
cp .env.example .env.local
```

Isi nilai di `.env.local`:
```dotenv
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Google Drive API
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### 6. Jalankan Local Development
```bash
npm run dev
```

Buka di browser:
- Client Gallery Demo: `http://localhost:3000/gallery/demo`
- Create Gallery: `http://localhost:3000/admin`
- Photographer Dashboard: `http://localhost:3000/admin/dashboard`
- Editor Matching Tool: `http://localhost:3000/editor`

---

## 🧪 Quality & Build Verification

Pastikan kode selalu bersih dan bebas error sebelum push:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Production build test
npm run build
```

---

## 🗺️ Roadmap & Progress

- [x] Next.js App Router & TypeScript architecture
- [x] Responsive client gallery with Google Drive streaming
- [x] Photo preview lightbox
- [x] Selection limits & counter
- [x] WhatsApp formatted deep link generator
- [x] Copy list to clipboard action for desktop & mobile
- [x] Photographer create gallery wizard (`/admin`)
- [x] Photographer dashboard & selection monitor (`/admin/dashboard`)
- [x] Shared Live Selection with Realtime sync (multi-device collaboration)
- [x] Atomic race-condition safe selection limit enforcement
- [x] Editor workspace & RAW photo matching tool (`/editor`)
- [x] Fallback offline/demo gallery support
- [ ] Client gallery password protection (PIN access)
- [ ] Automated email notification upon client selection completion
- [ ] Bulk ZIP export / Google Drive tag automation

---

## 👤 Author

**Oka Wiyana**
- Project: Kala Archives — Photo Proofing & Workflow Platform
- GitHub: [@OkaWiyana](https://github.com/OkaWiyana)

---

## 📄 License

This project is open for personal exploration, learning, and portfolio demonstration.
