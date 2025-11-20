const fs = require('fs');

// Read .env file
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');

let tursoUrl = null;
lines.forEach(line => {
    if (line.startsWith('TURSO_DATABASE_URL')) {
        tursoUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
    }
});

console.log('TURSO_DATABASE_URL from .env:');
console.log('Value:', tursoUrl);
console.log('Length:', tursoUrl ? tursoUrl.length : 0);
console.log('Starts with libsql://:', tursoUrl ? tursoUrl.startsWith('libsql://') : false);
console.log('Contains spaces:', tursoUrl ? tursoUrl.includes(' ') : false);
console.log('Contains newlines:', tursoUrl ? tursoUrl.includes('\n') || tursoUrl.includes('\r') : false);

// Check for hidden characters
if (tursoUrl) {
    console.log('\nCharacter codes:');
    for (let i = 0; i < Math.min(tursoUrl.length, 100); i++) {
        const char = tursoUrl[i];
        const code = tursoUrl.charCodeAt(i);
        if (code < 32 || code > 126) {
            console.log(`  Position ${i}: char='${char}' code=${code} (NON-PRINTABLE)`);
        }
    }
}

// Try to create a URL object
try {
    const url = new URL(tursoUrl);
    console.log('\n✅ URL is valid!');
    console.log('Protocol:', url.protocol);
    console.log('Hostname:', url.hostname);
} catch (error) {
    console.log('\n❌ URL is INVALID!');
    console.log('Error:', error.message);
}
