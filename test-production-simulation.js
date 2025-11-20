const app = require('./api/index.js');
const http = require('http');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Force production env simulation
process.env.NODE_ENV = 'production';

// Check if Turso keys are present
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
    process.exit(1);
}

console.log('🔄 Starting server in production simulation mode...');

const port = 8081; // Use a different port to avoid conflict
const server = app.listen(port, async () => {
    console.log(`✅ Server listening on port ${port}`);

    try {
        // Test 1: Check if server returns JSON for 404 (API route)
        console.log('🧪 Test 1: Checking API 404 response...');
        const res404 = await fetch(`http://localhost:${port}/api/nonexistent`);
        const contentType = res404.headers.get('content-type');
        console.log('   Content-Type:', contentType);

        if (contentType && contentType.includes('application/json')) {
            const json404 = await res404.json();
            console.log('   ✅ Passed: API returns JSON', json404);
        } else {
            const text = await res404.text();
            console.log('   ⚠️ Warning: API returned non-JSON for 404:', text.substring(0, 100));
        }

        // Test 2: Check Database Connection (via Auth Route)
        console.log('🧪 Test 2: Checking Database Connection (Login attempt)...');
        const resLogin = await fetch(`http://localhost:${port}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
        });

        // If DB is connected, it should return 401 (Invalid credentials) or 404 (User not found)
        // If DB is NOT connected, it will return 500
        const status = resLogin.status;
        console.log(`   Status: ${status}`);

        if (status === 401 || status === 404 || status === 400) {
            console.log('   ✅ Passed: Database is reachable (Logic executed)');
        } else if (status === 500) {
            const error = await resLogin.json();
            console.error('   ❌ Failed: Server Error (likely DB connection)', error);
        } else {
            console.warn('   ⚠️ Unexpected status:', status);
        }

    } catch (error) {
        console.error('❌ Test failed with exception:', error);
    } finally {
        server.close();
        console.log('🛑 Server stopped');
        process.exit(0);
    }
});
