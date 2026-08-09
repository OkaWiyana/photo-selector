# Kala Archives — Photo Proofing

> Private photo proofing platform for photographers.

Kala Archives adalah aplikasi web untuk membantu fotografer mengelola proses **photo proofing** secara sederhana.

Fotografer dapat membuat galeri berdasarkan folder foto di **Google Drive**, kemudian membagikan link galeri kepada klien. Klien dapat melihat, melakukan preview, dan memilih foto yang ingin diedit sesuai batas jumlah yang ditentukan fotografer.

Setelah selesai memilih, daftar foto terpilih dapat langsung dikirimkan kepada fotografer melalui **WhatsApp**, sehingga klien tidak perlu mengetik nama file secara manual.

Project ini dikembangkan sebagai **personal project dan MVP** untuk kebutuhan photo proofing fotografi, sekaligus sebagai eksplorasi pengembangan aplikasi web menggunakan Next.js, Google Drive API, Supabase, dan Vercel.

---

## ✨ Features

### 📷 Photographer / Admin

- Membuat gallery baru.
- Memasukkan nama klien.
- Menghubungkan gallery dengan folder Google Drive.
- Menentukan jumlah maksimum foto yang dapat dipilih.
- Menentukan nomor WhatsApp fotografer.
- Menghasilkan link gallery khusus untuk setiap klien.
- Menyimpan konfigurasi gallery secara persisten.

### 🖼️ Client Photo Proofing

- Menampilkan foto langsung dari Google Drive.
- Responsive photo gallery.
- Preview foto menggunakan lightbox.
- Memilih foto yang ingin diedit.
- Membatasi jumlah foto sesuai konfigurasi fotografer.
- Menampilkan jumlah foto yang sudah dipilih.
- Menampilkan status batas pilihan secara real-time.
- Mengirim daftar foto terpilih melalui WhatsApp.
- Nama file foto dimasukkan otomatis ke dalam pesan WhatsApp.
- Klien tidak perlu mengetik nama file secara manual.

### ☁️ Google Drive Integration

- Google Drive digunakan sebagai sumber foto.
- Fotografer cukup memasukkan link folder Google Drive.
- Aplikasi mengambil foto dari folder tersebut melalui Google Drive API.
- Foto tidak perlu di-upload ulang ke aplikasi.
- Kredensial Google Drive hanya digunakan pada server.

### 💾 Persistent Storage

- Konfigurasi gallery disimpan menggunakan Supabase.
- Gallery tidak hilang ketika development server direstart.
- Link gallery yang sudah dibuat tetap dapat digunakan selama record-nya masih tersedia di database.
- Supabase hanya menyimpan konfigurasi dan referensi folder Google Drive, bukan file foto.

### 🔐 Security

- Google Drive credentials hanya digunakan pada server.
- Supabase service-role key hanya digunakan pada server.
- Secret credentials tidak diekspos ke browser.
- Environment variables digunakan untuk konfigurasi sensitif.
- `.env.local` tidak disimpan di repository.

---

# 🛠️ Tech Stack

| Technology           | Purpose                          |
| -------------------- | -------------------------------- |
| **Next.js**          | Full-stack React framework       |
| **React**            | User interface                   |
| **TypeScript**       | Type-safe development            |
| **Tailwind CSS**     | Styling & responsive UI          |
| **Supabase**         | Persistent gallery configuration |
| **Google Drive API** | Photo source                     |
| **WhatsApp**         | Client selection delivery        |
| **Vercel**           | Deployment                       |

---

# 🏗️ Architecture

```text
Photographer
     |
     v
  /admin
     |
     v
  Supabase
     |
     v
/gallery/[id]
     |
     v
Google Drive API
     |
     v
Client Gallery
     |
     v
Photo Selection
     |
     v
WhatsApp
     |
     v
Photographer
```

---

# 🔄 Application Flow

## 1. Photographer Creates Gallery

Photographer membuka `/admin` dan mengisi:

- Client name
- Google Drive folder URL
- Maximum selections
- WhatsApp number

Setelah form dikirim:

```text
Admin
  ↓
createGalleryConfig()
  ↓
Supabase INSERT
  ↓
Generate Gallery ID
  ↓
Redirect
  ↓
/gallery/[id]
```

## 2. Client Opens Gallery

Client menerima link seperti:

```text
https://your-domain.com/gallery/gal_xxxxx
```

Aplikasi kemudian:

```text
Gallery ID
    ↓
Supabase
    ↓
Get Gallery Configuration
    ↓
Get Google Drive Folder ID
    ↓
Google Drive API
    ↓
Fetch Photos
    ↓
Render Gallery
```

## 3. Client Selects Photos

Client dapat memilih foto sesuai batas yang ditentukan fotografer.

Contoh:

```text
Selected 7 / 10
```

Jika batas sudah tercapai:

```text
Selected 10 / 10
```

## 4. Client Sends Selection

Setelah selesai memilih, client menekan tombol WhatsApp.

Aplikasi otomatis membuat pesan berisi nama client dan daftar nama file foto yang dipilih. Client tidak perlu mengetik nama file secara manual.

---

# 💾 Database

Supabase digunakan sebagai persistent storage untuk konfigurasi gallery.

Table utama:

```text
galleries
├── id
├── client_name
├── drive_folder_id
├── max_selections
├── whatsapp_number
└── created_at
```

| Column            | Type        | Description                      |
| ----------------- | ----------- | -------------------------------- |
| `id`              | TEXT        | Unique gallery ID                |
| `client_name`     | TEXT        | Nama client                      |
| `drive_folder_id` | TEXT        | Google Drive folder ID           |
| `max_selections`  | INTEGER     | Maksimum foto yang dapat dipilih |
| `whatsapp_number` | TEXT        | Nomor WhatsApp fotografer        |
| `created_at`      | TIMESTAMPTZ | Waktu gallery dibuat             |

Google Drive tetap menjadi sumber file foto, sedangkan Supabase hanya menyimpan konfigurasi gallery.

---

# 📁 Project Structure

```text
photo-selector/
│
├── app/
│   ├── admin/
│   ├── gallery/
│   │   └── [id]/
│   └── ...
│
├── components/
│   ├── gallery/
│   ├── admin/
│   └── ...
│
├── lib/
│   ├── services/
│   │   ├── gallery-service.ts
│   │   ├── google-drive.ts
│   │   └── ...
│   ├── supabase/
│   │   └── server.ts
│   └── types/
│       └── gallery.ts
│
├── supabase/
│   └── schema.sql
│
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js
- npm
- Git

## 1. Clone Repository

```bash
git clone <repository-url>
cd photo-selector
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

### Windows

```powershell
Copy-Item .env.example .env.local
```

### macOS / Linux

```bash
cp .env.example .env.local
```

Kemudian isi nilai environment variables sesuai project masing-masing.

---

# 🔐 Environment Variables

Contoh `.env.local`:

```dotenv
# Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-publishable-or-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"
```

> **WARNING:** Jangan pernah memasukkan credentials asli ke repository public.

File `.env.local` harus tetap berada di local environment dan tidak boleh di-commit.

`SUPABASE_SERVICE_ROLE_KEY` merupakan credential sensitif dan hanya boleh digunakan pada server.

---

# 🗄️ Supabase Setup

Buat project baru di Supabase.

Kemudian buka:

```text
Supabase Dashboard
    ↓
SQL Editor
```

Jalankan schema yang tersedia di:

```text
supabase/schema.sql
```

Setelah table berhasil dibuat, konfigurasi environment variables sesuai project Supabase.

---

# ☁️ Google Drive Setup

Aplikasi menggunakan Google Drive sebagai sumber foto.

Flow penggunaan:

```text
Google Drive
    ↓
Client Folder
    ↓
Share Folder
    ↓
Copy Folder URL
    ↓
Paste ke /admin
```

Contoh struktur folder:

```text
Google Drive
│
├── Client A
│   ├── IMG_001.JPG
│   ├── IMG_002.JPG
│   ├── IMG_003.JPG
│   └── ...
│
├── Client B
│   ├── IMG_101.JPG
│   ├── IMG_102.JPG
│   └── ...
│
└── Client C
    └── ...
```

Aplikasi mengambil `folderId` dari Google Drive URL dan menggunakan Google Drive API untuk mengambil daftar file gambar.

---

# ▶️ Run Development Server

```bash
npm run dev
```

Kemudian buka:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

---

# 🧪 Testing

Sebelum deployment:

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

Ketiga command tersebut harus berhasil tanpa error.

## Manual Verification

### Gallery Creation

1. Buka `/admin`.
2. Masukkan nama client.
3. Masukkan Google Drive folder URL.
4. Tentukan maximum selections.
5. Masukkan nomor WhatsApp.
6. Submit form.
7. Pastikan gallery berhasil dibuat.
8. Pastikan konfigurasi gallery masuk ke Supabase.

### Client Gallery

1. Buka generated gallery URL.
2. Pastikan foto Google Drive muncul.
3. Buka preview foto.
4. Pilih beberapa foto.
5. Pastikan selection counter berubah.
6. Pastikan batas maksimum bekerja.
7. Batalkan salah satu pilihan.
8. Pilih foto lain.

### WhatsApp

1. Pilih beberapa foto.
2. Klik tombol WhatsApp.
3. Pastikan WhatsApp terbuka.
4. Pastikan nama file foto muncul otomatis.
5. Pastikan nomor tujuan benar.

### Persistence

```text
Create Gallery
      ↓
Copy Gallery URL
      ↓
Stop Next.js
      ↓
npm run dev
      ↓
Open Previous Gallery URL
```

Gallery harus tetap dapat ditemukan karena konfigurasi disimpan di Supabase.

---

# 🌐 Deployment

Project dirancang untuk dapat di-deploy menggunakan **Vercel**.

Build command:

```bash
npm run build
```

Tambahkan environment variables pada:

```text
Vercel
  ↓
Project Settings
  ↓
Environment Variables
```

Variables yang diperlukan:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
```

---

# 🗺️ Roadmap

## Completed

- [x] Next.js application setup
- [x] Responsive client gallery
- [x] Photo preview / lightbox
- [x] Photo selection
- [x] Selection limit
- [x] WhatsApp integration
- [x] Automatic selected filename generation
- [x] Photographer admin page
- [x] Google Drive integration
- [x] Dynamic gallery routing
- [x] Persistent gallery configuration
- [x] Supabase integration

## Planned

- [ ] Production deployment
- [ ] Custom domain
- [ ] Gallery management dashboard
- [ ] Delete / archive gallery
- [ ] Gallery expiration
- [ ] Client access protection
- [ ] Password-protected galleries
- [ ] Selection history
- [ ] Re-open previous selections
- [ ] Photo delivery workflow
- [ ] Client download functionality
- [ ] Photographer dashboard
- [ ] Multiple galleries management
- [ ] Gallery status
- [ ] Better error handling
- [ ] Analytics

---

# 🔮 Future Vision

Kala Archives saat ini dimulai sebagai aplikasi sederhana untuk membantu fotografer melakukan photo proofing.

Ke depannya, project ini dapat dikembangkan menjadi platform workflow fotografi yang lebih lengkap:

```text
                 KALA ARCHIVES
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    Proofing       Selection       Delivery
        │              │              │
        ▼              ▼              ▼
    Client         Editing         Download
    Gallery        Request          Gallery
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                Photographer
                  Dashboard
```

Fokus utama tetap pada workflow yang sederhana dan cepat bagi fotografer maupun client.

---

# 📌 Project Status

**Status:** Active MVP / Personal Project

Kala Archives saat ini dikembangkan sebagai personal photo proofing platform dan experimental project.

Project ini juga digunakan sebagai eksplorasi teknologi:

- Next.js
- React
- TypeScript
- Supabase
- Google Drive API
- Vercel
- Server-side application architecture

---

# 🎯 Why This Project?

Project ini dibuat untuk menyederhanakan workflow photo proofing:

```text
Photographer
    ↓
Upload banyak foto
    ↓
Client harus memilih foto
    ↓
Client melihat gallery
    ↓
Client mencatat nama file
    ↓
Client mengirim daftar foto
```

Kala Archives menyederhanakan proses tersebut menjadi:

```text
Photographer
    ↓
Create Gallery
    ↓
Share Link
    ↓
Client Select Photos
    ↓
Send via WhatsApp
```

Dengan begitu client tidak perlu:

- Download seluruh foto.
- Membuka file satu per satu.
- Menyalin nama file secara manual.
- Mengetik daftar foto ke WhatsApp.

---

# 👤 Author

**Oka Wiyana**

Kala Archives — Photo Proofing

Built with:

```text
Next.js
React
TypeScript
Supabase
Google Drive API
Vercel
```

---

# 📄 License

This project is currently intended for personal use, experimentation, and portfolio purposes.

No production license has been defined yet.
