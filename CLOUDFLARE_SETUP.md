# Setup Cloudflare Workers (Gratis)

## Langkah-langkah Setup:

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login ke Cloudflare
```bash
wrangler login
```
- Akan membuka browser untuk login
- Login dengan akun Cloudflare (gratis)

### 3. Set Environment Variables (API Keys)

**PENTING:** Secret harus di-set menggunakan Wrangler CLI, bukan di dashboard Cloudflare.

```bash
# Set Groq API Key
wrangler secret put GROQ_API_KEY
# Masukkan API key Groq kamu saat diminta (format: gsk_...)

# Optional: Set OpenAI API Key (jika mau pakai OpenAI juga)
wrangler secret put OPENAI_API_KEY
# Masukkan API key OpenAI kamu saat diminta (format: sk-...)
```

**Verifikasi Secret sudah ter-set:**
```bash
# List semua secrets (akan menampilkan nama secret, bukan value)
wrangler secret list
```

**Catatan:**
- Secret di-set per-worker, bukan per-account
- Setelah set secret, **WAJIB redeploy worker** agar secret aktif
- Jika secret tidak terdeteksi, pastikan:
  1. Secret sudah di-set dengan benar (cek dengan `wrangler secret list`)
  2. Worker sudah di-redeploy setelah set secret
  3. Nama secret tepat: `GROQ_API_KEY` (huruf besar semua)

### 4. Deploy Worker

**PENTING:** Setelah set secret, WAJIB deploy ulang worker!

```bash
npm run deploy:worker
```

Atau jika menggunakan wrangler langsung:
```bash
wrangler deploy
```

**Verifikasi setelah deploy:**
- Cek log di Cloudflare Dashboard → Workers & Pages → web-ai-proxy → Logs
- Atau test dengan curl:
```bash
curl -X POST https://web-ai-proxy.YOUR_SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"provider":"groq"}'
```

Jika masih error "API key not found", pastikan:
1. Secret sudah di-set: `wrangler secret list`
2. Worker sudah di-redeploy setelah set secret
3. Nama secret benar: `GROQ_API_KEY` (case-sensitive)

### 5. Dapatkan URL Worker
- Setelah deploy, akan muncul URL seperti: `https://web-ai-proxy.YOUR_SUBDOMAIN.workers.dev`
- Copy URL ini

### 6. Update GitHub Secret
1. Buka GitHub → Repository → Settings → Secrets and variables → Actions
2. Klik **New repository secret** (jika belum ada) atau edit secret `VITE_PROXY_URL` (jika sudah ada)
3. **Name:** `VITE_PROXY_URL` (huruf besar semua)
4. **Secret:** `https://web-ai-proxy.velixaiden.workers.dev` (tanpa trailing slash)
5. Klik **Add secret** atau **Update secret**

**Detail lengkap:** Lihat file `GITHUB_SECRET_SETUP.md` untuk panduan step-by-step dengan screenshot.

### 7. Trigger Rebuild GitHub Pages
1. Buka GitHub → Repository → tab "Actions"
2. Pilih workflow "Deploy to GitHub Pages"
3. Klik "Run workflow" → pilih branch `master` → Run workflow

### 8. Selesai!
- Setelah deployment selesai, buka `https://velixvalhinsen.github.io/WEBAI/`
- User bisa langsung chat tanpa perlu masukkan API key!

## Catatan:
- Cloudflare Workers **GRATIS** dengan limit 100,000 requests/hari
- API key disimpan aman di Cloudflare (tidak terlihat di code)
- User tidak perlu masukkan API key, langsung bisa chat seperti ChatGPT

## Troubleshooting: API Key Tidak Terdeteksi

Jika kamu mendapat error seperti ini:
```
[Worker] API key exists: false, Provider: groq
[Worker] API key not found for provider: groq
```

Ikuti langkah-langkah berikut:

### 1. Verifikasi Secret Sudah Ter-set
```bash
wrangler secret list
```

Pastikan `GROQ_API_KEY` muncul di list. Jika tidak ada, set ulang:
```bash
wrangler secret put GROQ_API_KEY
```

### 2. Pastikan Worker Sudah Di-redeploy
**PENTING:** Setelah set/update secret, WAJIB deploy ulang worker!

```bash
npm run deploy:worker
```

Atau:
```bash
wrangler deploy
```

### 3. Cek Log di Cloudflare Dashboard
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih **Workers & Pages** → **web-ai-proxy**
3. Klik tab **Logs**
4. Cari log yang menampilkan:
   - `Available env keys: ...` - ini akan menunjukkan secret apa saja yang tersedia
   - `Looking for API key: GROQ_API_KEY` - ini menunjukkan secret yang dicari
   - `API key exists: true/false` - ini menunjukkan apakah secret ditemukan

### 4. Pastikan Nama Secret Benar
- Nama secret **case-sensitive**: `GROQ_API_KEY` (huruf besar semua)
- Bukan: `groq_api_key`, `Groq_Api_Key`, dll.

### 5. Set Secret untuk Environment yang Benar
Jika menggunakan multiple environments, pastikan set secret untuk environment yang benar:
```bash
# Untuk production (default)
wrangler secret put GROQ_API_KEY

# Untuk environment tertentu (jika ada)
wrangler secret put GROQ_API_KEY --env production
```

### 6. Test Worker Langsung
Setelah deploy, test dengan curl:
```bash
curl -X POST https://web-ai-proxy.YOUR_SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"provider":"groq"}'
```

Jika berhasil, akan mendapat response streaming. Jika error, cek pesan error di response.

### 7. Re-deploy dari Awal (Jika Masih Error)
Jika semua langkah di atas sudah dilakukan tapi masih error:

1. **Hapus secret lama:**
   ```bash
   wrangler secret delete GROQ_API_KEY
   ```

2. **Set secret baru:**
   ```bash
   wrangler secret put GROQ_API_KEY
   ```

3. **Deploy ulang:**
   ```bash
   npm run deploy:worker
   ```

4. **Tunggu beberapa menit** (kadang perlu waktu untuk propagate)

5. **Test lagi**

### 8. Cek Worker Configuration
Pastikan `wrangler.toml` sudah benar:
```toml
name = "web-ai-proxy"
main = "cloudflare-worker.js"
compatibility_date = "2024-01-01"
workers_dev = true
```

## Troubleshooting: 500 Internal Server Error

Jika kamu mendapat error `500 (Internal Server Error)` di browser console:

### Langkah 1: Cek Log Cloudflare Workers
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih **Workers & Pages** → **web-ai-proxy**
3. Klik tab **Logs** (atau **Real-time Logs**)
4. Cari error message yang muncul saat request

**Atau gunakan Wrangler CLI untuk melihat log real-time:**
```bash
wrangler tail
```
Ini akan menampilkan semua log dari worker secara real-time.

### Langkah 2: Test Worker dengan cURL
Test worker langsung untuk melihat error message yang detail:

```bash
curl -X POST https://web-ai-proxy.velixaiden.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"provider":"groq"}' \
  -v
```

Flag `-v` akan menampilkan response headers dan body, termasuk error message.

### Langkah 3: Test dengan Script
Gunakan script test yang sudah disediakan:

```bash
node test-worker.js https://web-ai-proxy.velixaiden.workers.dev
```

Script ini akan menampilkan error message yang lebih mudah dibaca.

### Langkah 4: Verifikasi API Key
Paling sering, 500 error disebabkan oleh API key yang tidak ter-set:

```bash
# Cek apakah secret sudah ter-set
wrangler secret list

# Jika tidak ada GROQ_API_KEY, set sekarang:
wrangler secret put GROQ_API_KEY
# Masukkan API key Groq kamu (format: gsk_...)

# Setelah set secret, WAJIB deploy ulang:
npm run deploy:worker
```

### Langkah 5: Cek Error Response di Browser
Di browser console, cek response body dari error 500:
1. Buka Developer Tools (F12)
2. Tab **Network**
3. Cari request yang error (status 500)
4. Klik request tersebut
5. Tab **Response** - lihat error message yang detail

Error message biasanya akan memberitahu:
- `API key not configured` → Secret belum di-set
- `API key not found` → Secret tidak terdeteksi (perlu redeploy)
- `No response body from API` → Error dari Groq/OpenAI API
- Error lainnya → Lihat stack trace di log

### Langkah 6: Redeploy Worker
Setelah melakukan perubahan, selalu redeploy:

```bash
npm run deploy:worker
```

Atau:

```bash
wrangler deploy
```

Tunggu beberapa menit setelah deploy untuk memastikan perubahan sudah propagate.

Jika masih bermasalah, buka issue di GitHub dengan menyertakan:
- Output dari `wrangler secret list`
- Log dari Cloudflare Dashboard (atau output dari `wrangler tail`)
- Error message lengkap dari browser console atau cURL response
- Output dari `node test-worker.js <WORKER_URL>`

