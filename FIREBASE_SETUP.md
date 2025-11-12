# Setup Firebase Authentication

Panduan lengkap untuk setup Firebase Authentication di aplikasi G Chat.

## Langkah-langkah Setup:

### 1. Buat Project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Add project"** atau **"Create a project"**
3. Masukkan nama project (contoh: `g-chat-app`)
4. Ikuti wizard setup (Google Analytics optional)
5. Klik **"Create project"**

### 2. Enable Authentication

1. Di Firebase Console, pilih project Anda
2. Di sidebar kiri, klik **"Authentication"**
3. Klik **"Get started"**
4. Pilih tab **"Sign-in method"**
5. Enable **"Email/Password"**:
   - Klik **"Email/Password"**
   - Toggle **"Enable"** menjadi ON
   - Klik **"Save"**

### 3. Dapatkan Firebase Config

1. Di Firebase Console, klik ikon **⚙️ Settings** (gear icon) di sidebar
2. Pilih **"Project settings"**
3. Scroll ke bawah ke bagian **"Your apps"**
4. Klik ikon **Web** (`</>`) untuk menambahkan web app
5. Masukkan nama app (contoh: `G Chat Web`)
6. **Opsional**: Centang "Also set up Firebase Hosting"
7. Klik **"Register app"**
8. Copy config object yang muncul, contoh:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

### 4. Setup Environment Variables

Buat file `.env` di root project (sama level dengan `package.json`):

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**PENTING:**
- Ganti semua nilai dengan config dari Firebase Console Anda
- Jangan commit file `.env` ke Git (sudah ada di `.gitignore`)
- Untuk production, set environment variables di hosting platform (Vercel, Netlify, dll)

### 5. Setup Email Templates (Opsional tapi Disarankan)

1. Di Firebase Console → **Authentication** → **Templates**
2. Customize email templates:
   - **Email address verification**: Template untuk verifikasi email
   - **Password reset**: Template untuk reset password
3. Anda bisa customize subject, body, dan styling

### 6. Test Aplikasi

1. Jalankan development server:
   ```bash
   npm run dev
   ```

2. Buka browser ke `http://localhost:5173`

3. Test fitur:
   - **Register**: Buat akun baru
   - **Email Verification**: Cek email dan klik link verifikasi
   - **Login**: Login dengan akun yang sudah diverifikasi
   - **Forgot Password**: Test reset password

## Fitur yang Tersedia:

✅ **Login/Register** - Form untuk login dan register
✅ **Email Verification** - Verifikasi email otomatis saat register
✅ **Forgot Password** - Reset password via email
✅ **Protected Routes** - Hanya user yang sudah login dan verified bisa akses app
✅ **Logout** - Button logout di header
✅ **User Info** - Display nama dan email user di header

## Troubleshooting:

### Error: "Firebase: Error (auth/api-key-not-valid)"
- Pastikan `VITE_FIREBASE_API_KEY` sudah benar
- Pastikan API key tidak ter-restrict di Firebase Console

### Error: "Firebase: Error (auth/email-already-in-use)"
- Email sudah terdaftar, gunakan email lain atau login

### Email verification tidak terkirim
- Cek spam folder
- Pastikan Email/Password authentication sudah di-enable
- Cek Firebase Console → Authentication → Users untuk melihat status

### Error saat build production
- Pastikan semua environment variables sudah di-set di hosting platform
- Untuk Vercel: Settings → Environment Variables
- Untuk Netlify: Site settings → Environment variables

## Security Best Practices:

1. **Jangan commit `.env` file** ke Git
2. **Restrict API keys** di Firebase Console jika perlu:
   - Firebase Console → Project Settings → Your apps
   - Klik app → Restrict key
3. **Enable App Check** untuk production (opsional)
4. **Setup authorized domains** di Authentication settings

## Next Steps:

- [ ] Setup OAuth providers (Google, Facebook, dll) jika perlu
- [ ] Customize email templates
- [ ] Setup Firebase Hosting untuk deploy
- [ ] Enable App Check untuk security tambahan

