const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

// Validate environment variables
const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
    throw new Error('TURSO_DATABASE_URL is not defined');
}

if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is not defined');
}

// Log for debugging (will appear in Vercel logs)
console.log('Prisma initialization:');
console.log('- DB URL length:', dbUrl.length);
console.log('- DB URL starts with:', dbUrl.substring(0, 20));
console.log('- Auth token length:', authToken.length);

// Create Prisma client with LibSQL adapter for Turso
let adapter;
try {
    adapter = new PrismaLibSql({
        url: dbUrl,
        authToken: authToken,
    });
    console.log('✅ PrismaLibSql adapter created successfully');
} catch (error) {
    console.error('❌ Failed to create PrismaLibSql adapter:', error);
    throw error;
}

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
