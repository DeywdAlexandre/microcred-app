const { execSync } = require('child_process');
const fs = require('fs');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');

const envVars = {};
lines.forEach(line => {
    if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            envVars[key.trim()] = value;
        }
    }
});

console.log('Environment variables found:');
console.log('- TURSO_DATABASE_URL:', envVars.TURSO_DATABASE_URL ? 'Found' : 'Missing');
console.log('- TURSO_AUTH_TOKEN:', envVars.TURSO_AUTH_TOKEN ? 'Found' : 'Missing');
console.log('- JWT_SECRET:', envVars.JWT_SECRET ? 'Found' : 'Missing');

// Save to temporary files for Vercel CLI
if (envVars.TURSO_DATABASE_URL) {
    fs.writeFileSync('temp_db_url.txt', envVars.TURSO_DATABASE_URL);
    console.log('\nSaved TURSO_DATABASE_URL to temp_db_url.txt');
}

if (envVars.TURSO_AUTH_TOKEN) {
    fs.writeFileSync('temp_auth_token.txt', envVars.TURSO_AUTH_TOKEN);
    console.log('Saved TURSO_AUTH_TOKEN to temp_auth_token.txt');
}

if (envVars.JWT_SECRET) {
    fs.writeFileSync('temp_jwt_secret.txt', envVars.JWT_SECRET);
    console.log('Saved JWT_SECRET to temp_jwt_secret.txt');
}

console.log('\nNow run these commands manually:');
console.log('vercel env rm TURSO_DATABASE_URL production');
console.log('vercel env add TURSO_DATABASE_URL production < temp_db_url.txt');
console.log('');
console.log('vercel env rm TURSO_AUTH_TOKEN production');
console.log('vercel env add TURSO_AUTH_TOKEN production < temp_auth_token.txt');
console.log('');
console.log('vercel env rm JWT_SECRET production');
console.log('vercel env add JWT_SECRET production < temp_jwt_secret.txt');
