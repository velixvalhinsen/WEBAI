# 🔧 QUICK FIX - Firebase Error

Error yang muncul:
```
Firebase configuration is missing. Please set all VITE_FIREBASE_* environment variables.
Firebase: Error (auth/invalid-api-key)
```

## ⚡ Solusi Cepat (5 menit):

### Langkah 1: Tambahkan GitHub Secrets

1. **Buka:** https://github.com/gimnas11/WEBAI/settings/secrets/actions
2. **Klik:** "New repository secret" (tombol di kanan atas)
3. **Tambahkan 6 secrets ini satu per satu:**

   **Secret 1:**
   - Name: `VITE_FIREBASE_API_KEY`
   - Secret: `AIzaSyBqKbwpSFi9nG8L5Am-BFc96In8xQh35Sk`
   - Klik "Add secret"

   **Secret 2:**
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`
   - Secret: `g-chat-app-3726a.firebaseapp.com`
   - Klik "Add secret"

   **Secret 3:**
   - Name: `VITE_FIREBASE_PROJECT_ID`
   - Secret: `g-chat-app-3726a`
   - Klik "Add secret"

   **Secret 4:**
   - Name: `VITE_FIREBASE_STORAGE_BUCKET`
   - Secret: `g-chat-app-3726a.firebasestorage.app`
   - Klik "Add secret"

   **Secret 5:**
   - Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - Secret: `1088029239813`
   - Klik "Add secret"

   **Secret 6:**
   - Name: `VITE_FIREBASE_APP_ID`
   - Secret: `1:1088029239813:web:83c116111cef1791f28a6c`
   - Klik "Add secret"

### Langkah 2: Trigger Deployment

1. **Buka:** https://github.com/gimnas11/WEBAI/actions
2. **Klik:** "Deploy to GitHub Pages" (workflow di kiri)
3. **Klik:** "Run workflow" (tombol di kanan atas)
4. **Klik:** "Run workflow" (di dropdown)
5. **Tunggu 2-5 menit** sampai deployment selesai

### Langkah 3: Verifikasi

1. **Buka:** https://gimnas11.github.io/WEBAI/
2. **Hard refresh:** `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
3. **Buka Console:** Tekan `F12` → tab "Console"
4. **Cek:** Seharusnya **TIDAK ada** error "Firebase configuration is missing"
5. **Test:** Coba login/register - seharusnya berfungsi

## ✅ Setelah ini, error akan hilang!

---

**Catatan:** Jika masih error setelah 5 menit, pastikan:
- ✅ Semua 6 secrets sudah ditambahkan
- ✅ Deployment sudah selesai (cek di tab Actions)
- ✅ Sudah hard refresh browser

