const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

async function check() {
    console.log('🔍 Checking remote database connection...');

    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
        return;
    }

    const adapter = new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const prisma = new PrismaClient({ adapter });

    try {
        console.log('⏳ Connecting...');
        // Try to count users. If table doesn't exist, this will fail.
        const count = await prisma.user.count();
        console.log(`✅ Connection successful! Found ${count} users.`);
        console.log('✅ Schema appears to be up to date.');
    } catch (error) {
        console.error('❌ Connection or Query failed:', error.message);
        if (error.message.includes('no such table')) {
            console.error('⚠️  DIAGNOSIS: The database schema has not been pushed to Turso yet.');
            console.error('   You need to run the migration script.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

check();
