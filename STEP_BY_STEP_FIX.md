# 🔧 STEP BY STEP - Fix Firebase Error

## ⚠️ Error yang muncul:
```
Firebase configuration is missing. Please set all VITE_FIREBASE_* environment variables.
Firebase: Error (auth/invalid-api-key)
```

## ✅ SOLUSI - Ikuti Langkah Ini PERSIS:

### STEP 1: Buka GitHub Secrets Page
1. Buka browser
2. Ketik di address bar: `https://github.com/gimnas11/WEBAI/settings/secrets/actions`
3. Tekan Enter
4. **PASTIKAN** Anda sudah login ke GitHub

### STEP 2: Tambahkan Secret Pertama
1. Klik tombol **"New repository secret"** (warna hijau, di kanan atas)
2. Di field **"Name"**, ketik: `VITE_FIREBASE_API_KEY`
3. Di field **"Secret"**, ketik: `AIzaSyBqKbwpSFi9nG8L5Am-BFc96In8xQh35Sk`
4. Klik tombol **"Add secret"** (di bawah)
5. ✅ Secret pertama selesai!

### STEP 3: Tambahkan Secret Kedua
1. Klik lagi **"New repository secret"**
2. Name: `VITE_FIREBASE_AUTH_DOMAIN`
3. Secret: `g-chat-app-3726a.firebaseapp.com`
4. Klik **"Add secret"**
5. ✅ Secret kedua selesai!

### STEP 4: Tambahkan Secret Ketiga
1. Klik **"New repository secret"**
2. Name: `VITE_FIREBASE_PROJECT_ID`
3. Secret: `g-chat-app-3726a`
4. Klik **"Add secret"**
5. ✅ Secret ketiga selesai!

### STEP 5: Tambahkan Secret Keempat
1. Klik **"New repository secret"**
2. Name: `VITE_FIREBASE_STORAGE_BUCKET`
3. Secret: `g-chat-app-3726a.firebasestorage.app`
4. Klik **"Add secret"**
5. ✅ Secret keempat selesai!

### STEP 6: Tambahkan Secret Kelima
1. Klik **"New repository secret"**
2. Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`
3. Secret: `1088029239813`
4. Klik **"Add secret"**
5. ✅ Secret kelima selesai!

### STEP 7: Tambahkan Secret Keenam (Terakhir)
1. Klik **"New repository secret"**
2. Name: `VITE_FIREBASE_APP_ID`
3. Secret: `1:1088029239813:web:83c116111cef1791f28a6c`
4. Klik **"Add secret"**
5. ✅ Semua secrets selesai!

### STEP 8: Verifikasi Secrets Sudah Ada
Setelah semua secrets ditambahkan, Anda harus melihat **6 secrets** di list:
- ✅ VITE_FIREBASE_API_KEY
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID

**Jika kurang dari 6, berarti ada yang belum ditambahkan!**

### STEP 9: Trigger Deployment
1. Buka: `https://github.com/gimnas11/WEBAI/actions`
2. Di sidebar kiri, klik **"Deploy to GitHub Pages"**
3. Di kanan atas, klik tombol **"Run workflow"** (dropdown)
4. Klik lagi **"Run workflow"** (di dropdown)
5. Tunggu 2-5 menit
6. Refresh halaman Actions
7. Cek apakah ada workflow baru yang statusnya **hijau (✓)** atau **kuning (sedang running)**

### STEP 10: Hard Refresh Browser
Setelah deployment selesai (status hijau):
1. Buka: `https://gimnas11.github.io/WEBAI/`
2. Tekan: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
3. Buka Console: Tekan `F12` → tab "Console"
4. **Seharusnya TIDAK ada error lagi!**

## ❌ Jika Masih Error:

### Checklist:
- [ ] Apakah semua 6 secrets sudah ditambahkan?
- [ ] Apakah deployment sudah selesai (status hijau)?
- [ ] Apakah sudah hard refresh browser (`Ctrl + Shift + R`)?
- [ ] Apakah sudah clear browser cache?

### Jika masih error setelah semua langkah di atas:
1. Tunggu 5-10 menit (kadang GitHub Pages butuh waktu untuk update)
2. Coba buka di Incognito/Private window
3. Cek di tab Actions apakah ada error saat build

## 📞 Butuh Bantuan?
Jika masih error, kirim screenshot dari:
1. Halaman Secrets (untuk verify semua 6 secrets ada)
2. Halaman Actions (untuk verify deployment status)
3. Browser Console (untuk lihat error yang muncul)

