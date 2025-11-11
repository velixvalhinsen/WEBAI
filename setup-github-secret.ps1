# Script Helper untuk Setup GitHub Secret VITE_PROXY_URL
# Script ini akan membuka browser ke halaman GitHub untuk menambahkan secret

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup GitHub Secret VITE_PROXY_URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# URL yang akan ditambahkan
$PROXY_URL = "https://web-ai-proxy.velixaiden.workers.dev"
$SECRET_NAME = "VITE_PROXY_URL"

Write-Host "Secret yang akan ditambahkan:" -ForegroundColor Yellow
Write-Host "  Name:  $SECRET_NAME" -ForegroundColor White
Write-Host "  Value: $PROXY_URL" -ForegroundColor White
Write-Host ""

# Minta konfirmasi repository URL
Write-Host "Masukkan URL repository GitHub kamu:" -ForegroundColor Yellow
Write-Host "Contoh: https://github.com/velixvalhinsen/WEBAI" -ForegroundColor Gray
$repoUrl = Read-Host "Repository URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "Error: Repository URL tidak boleh kosong!" -ForegroundColor Red
    exit 1
}

# Validasi format URL
if (-not $repoUrl.StartsWith("https://github.com/")) {
    Write-Host "Error: URL harus dimulai dengan https://github.com/" -ForegroundColor Red
    exit 1
}

# Buat URL ke halaman secrets
$secretsUrl = "$repoUrl/settings/secrets/actions"

Write-Host ""
Write-Host "Membuka browser ke halaman GitHub Secrets..." -ForegroundColor Green
Write-Host "URL: $secretsUrl" -ForegroundColor Gray
Write-Host ""

# Buka browser
Start-Process $secretsUrl

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instruksi:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Di halaman yang terbuka, klik tombol 'New repository secret'" -ForegroundColor White
Write-Host "2. Masukkan:" -ForegroundColor White
Write-Host "   - Name:  $SECRET_NAME" -ForegroundColor Yellow
Write-Host "   - Secret: $PROXY_URL" -ForegroundColor Yellow
Write-Host "3. Klik 'Add secret'" -ForegroundColor White
Write-Host "4. Setelah secret ditambahkan, trigger workflow:" -ForegroundColor White
Write-Host "   - Buka tab 'Actions'" -ForegroundColor Gray
Write-Host "   - Pilih 'Deploy to GitHub Pages'" -ForegroundColor Gray
Write-Host "   - Klik 'Run workflow' → pilih branch 'master'" -ForegroundColor Gray
Write-Host ""
Write-Host "Detail lengkap: Lihat file GITHUB_SECRET_SETUP.md" -ForegroundColor Cyan
Write-Host ""

# Tanya apakah ingin membuka halaman Actions juga
$openActions = Read-Host "Buka halaman Actions untuk trigger workflow? (y/n)"
if ($openActions -eq "y" -or $openActions -eq "Y") {
    $actionsUrl = "$repoUrl/actions/workflows/deploy.yml"
    Write-Host "Membuka halaman Actions..." -ForegroundColor Green
    Start-Process $actionsUrl
}

Write-Host ""
Write-Host "Selesai! Pastikan secret sudah ditambahkan dan workflow sudah di-trigger." -ForegroundColor Green
Write-Host ""

