# Setup GitHub Secret VITE_PROXY_URL

Panduan lengkap untuk menambahkan secret `VITE_PROXY_URL` di GitHub Actions.

## 🎯 URL yang Akan Ditambahkan

```
https://web-ai-proxy.velixaiden.workers.dev
```

**Catatan:** Jangan tambahkan trailing slash (`/`) di akhir URL.

## 📝 Langkah-langkah Menambahkan Secret

### Langkah 1: Buka Repository di GitHub
1. Buka browser dan login ke [GitHub](https://github.com)
2. Navigasi ke repository kamu: `https://github.com/velixvalhinsen/WEBAI` (atau URL repository kamu)

### Langkah 2: Buka Settings
1. Di halaman repository, klik tab **Settings** (di bagian atas, sebelah kanan)
2. Scroll ke bawah di sidebar kiri, cari bagian **Secrets and variables**
3. Klik **Actions**

### Langkah 3: Tambahkan Secret Baru
1. Klik tombol **New repository secret** (tombol hijau di kanan atas)
2. Di form yang muncul:
   - **Name:** Masukkan `VITE_PROXY_URL` (huruf besar semua, persis seperti ini)
   - **Secret:** Masukkan `https://web-ai-proxy.velixaiden.workers.dev` (tanpa trailing slash)
3. Klik **Add secret**

### Langkah 4: Verifikasi Secret Sudah Ditambahkan
1. Pastikan secret `VITE_PROXY_URL` muncul di list secrets
2. Value tidak akan ditampilkan (untuk keamanan), tapi pastikan nama secret benar

### Langkah 5: Trigger Rebuild GitHub Actions
Setelah secret ditambahkan, trigger workflow untuk rebuild:

1. Klik tab **Actions** di repository
2. Di sidebar kiri, pilih workflow **Deploy to GitHub Pages**
3. Klik tombol **Run workflow** (di kanan atas)
4. Pastikan branch yang dipilih adalah `master`
5. Klik **Run workflow** (tombol hijau)

### Langkah 6: Tunggu Deployment Selesai
1. Klik pada run workflow yang baru dibuat
2. Tunggu sampai semua step selesai (biasanya 2-5 menit)
3. Pastikan semua step berhasil (centang hijau)

## ✅ Verifikasi Setup Berhasil

Setelah deployment selesai:

1. Buka aplikasi di: `https://velixvalhinsen.github.io/WEBAI/`
2. Coba chat tanpa memasukkan API key
3. Jika berhasil, aplikasi akan menggunakan proxy Cloudflare Workers

## 🔍 Troubleshooting

### Secret Tidak Terdeteksi
Jika setelah rebuild masih error:

1. **Cek nama secret:**
   - Pastikan nama persis: `VITE_PROXY_URL` (huruf besar semua)
   - Tidak ada spasi di awal/akhir
   - Tidak ada typo

2. **Cek value secret:**
   - Pastikan URL: `https://web-ai-proxy.velixaiden.workers.dev`
   - Tanpa trailing slash di akhir
   - Tanpa spasi di awal/akhir

3. **Edit secret jika perlu:**
   - Klik pada secret `VITE_PROXY_URL`
   - Klik **Update** (jika perlu edit)
   - Atau **Delete** dan buat ulang

4. **Trigger rebuild lagi:**
   - Setelah update secret, trigger workflow lagi
   - Pastikan menggunakan branch `master`

### Workflow Gagal
Jika workflow gagal:

1. **Cek log error:**
   - Klik pada failed workflow run
   - Cek step yang gagal
   - Baca error message

2. **Cek secret:**
   - Pastikan secret sudah ditambahkan dengan benar
   - Pastikan nama dan value benar

3. **Cek worker:**
   - Pastikan Cloudflare Worker sudah di-deploy
   - Test worker dengan: `node test-worker.js https://web-ai-proxy.velixaiden.workers.dev`

## 📸 Screenshot Locations (Visual Guide)

Jika kamu butuh bantuan visual:

1. **Settings → Secrets and variables → Actions:**
   ```
   Repository → Settings → (Scroll down) → Secrets and variables → Actions
   ```

2. **New repository secret button:**
   ```
   Di kanan atas halaman Secrets, tombol hijau "New repository secret"
   ```

3. **Run workflow button:**
   ```
   Actions tab → Deploy to GitHub Pages → (Kanan atas) "Run workflow"
   ```

## 🎉 Selesai!

Setelah semua langkah selesai, aplikasi kamu akan:
- ✅ Menggunakan Cloudflare Workers sebagai proxy
- ✅ User tidak perlu memasukkan API key
- ✅ Bisa langsung chat seperti ChatGPT

---

**Pertanyaan?** Buka issue di GitHub atau cek dokumentasi di `CLOUDFLARE_SETUP.md`

