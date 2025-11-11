// Script untuk test Cloudflare Worker dan cek API key
// Jalankan: node test-worker.js <WORKER_URL>

const WORKER_URL = process.argv[2] || 'https://web-ai-proxy.YOUR_SUBDOMAIN.workers.dev';

async function testWorker() {
  console.log('🧪 Testing Cloudflare Worker...\n');
  console.log(`📍 Worker URL: ${WORKER_URL}\n`);

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'test' }
        ],
        provider: 'groq'
      }),
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error Response:');
      console.log(JSON.stringify(errorData, null, 2));
      
      if (errorData.error && errorData.error.includes('API key not configured')) {
        console.log('\n⚠️  API KEY TIDAK TERDETEKSI!');
        console.log('\n📝 Langkah perbaikan:');
        console.log('1. Set secret: wrangler secret put GROQ_API_KEY');
        console.log('2. Deploy ulang: npm run deploy:worker');
        console.log('3. Tunggu beberapa menit untuk propagate');
        console.log('4. Test lagi dengan script ini\n');
      }
    } else {
      console.log('✅ Worker berfungsi! API key terdeteksi.\n');
      console.log('📝 Untuk melihat log detail:');
      console.log('   - Buka Cloudflare Dashboard → Workers & Pages → web-ai-proxy → Logs');
      console.log('   - Atau jalankan: wrangler tail\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Pastikan:');
    console.log('   - Worker URL benar');
    console.log('   - Worker sudah di-deploy');
    console.log('   - Internet connection aktif\n');
  }
}

testWorker();

