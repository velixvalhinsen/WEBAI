# Setup GitHub Secrets untuk Firebase

Panduan lengkap untuk menambahkan Firebase API keys ke GitHub Secrets (AMAN - tidak ter-expose di public).

## ✅ Status Saat Ini

- ✅ API key **TIDAK ada** di source code
- ✅ API key **TIDAK ada** di git history (sudah dibersihkan dengan BFG)
- ✅ File `.env` sudah di `.gitignore`
- ⚠️ **Perlu setup GitHub Secrets** untuk production deployment

## Langkah-langkah Setup GitHub Secrets:

### 1. Buka GitHub Repository Settings

1. Buka: https://github.com/gimnas11/WEBAI
2. Klik tab **Settings** (di bagian atas repository)
3. Di sidebar kiri, klik **Secrets and variables** → **Actions**

### 2. Tambahkan Secrets Berikut

Klik **New repository secret** untuk setiap secret di bawah ini:

#### Secret 1: `VITE_FIREBASE_API_KEY`
- **Name:** `VITE_FIREBASE_API_KEY`
- **Secret:** `AIzaSyBqKbwpSFi9nG8L5Am-BFc96In8xQh35Sk`
- Klik **Add secret**

#### Secret 2: `VITE_FIREBASE_AUTH_DOMAIN`
- **Name:** `VITE_FIREBASE_AUTH_DOMAIN`
- **Secret:** `g-chat-app-3726a.firebaseapp.com`
- Klik **Add secret**

#### Secret 3: `VITE_FIREBASE_PROJECT_ID`
- **Name:** `VITE_FIREBASE_PROJECT_ID`
- **Secret:** `g-chat-app-3726a`
- Klik **Add secret**

#### Secret 4: `VITE_FIREBASE_STORAGE_BUCKET`
- **Name:** `VITE_FIREBASE_STORAGE_BUCKET`
- **Secret:** `g-chat-app-3726a.firebasestorage.app`
- Klik **Add secret**

#### Secret 5: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Name:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Secret:** `1088029239813`
- Klik **Add secret**

#### Secret 6: `VITE_FIREBASE_APP_ID`
- **Name:** `VITE_FIREBASE_APP_ID`
- **Secret:** `1:1088029239813:web:83c116111cef1791f28a6c`
- Klik **Add secret**

### 3. Trigger Deployment

Setelah semua secrets ditambahkan, deployment akan otomatis rebuild. Atau trigger manual:

1. Buka tab **Actions** di GitHub
2. Klik workflow **Deploy to GitHub Pages**
3. Klik **Run workflow** → **Run workflow**

## 🔒 Keamanan

✅ **GitHub Secrets AMAN:**
- Secrets hanya bisa dilihat oleh repository owner/collaborators
- Secrets **TIDAK** terlihat di public repository
- Secrets **TIDAK** terlihat di commit history
- Secrets hanya bisa digunakan di GitHub Actions workflows

✅ **Source Code AMAN:**
- Tidak ada hardcoded API keys
- Semua config menggunakan environment variables
- `.env` file sudah di `.gitignore`

## ✅ Verifikasi

Setelah deployment selesai, cek:
1. Buka: https://gimnas11.github.io/WEBAI/
2. Buka browser console (F12)
3. Seharusnya **TIDAK ada** error: "Firebase configuration is missing"
4. Login/Register seharusnya berfungsi

## 📝 Catatan

- API key yang digunakan adalah API key lama yang sudah ter-expose sebelumnya
- Untuk keamanan maksimal, disarankan untuk:
  1. Restrict API key di Google Cloud Console
  2. Atau buat API key baru dan ganti di GitHub Secrets

