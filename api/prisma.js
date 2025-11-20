const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

// Create Prisma client with LibSQL adapter for Turso
const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL || 'file:./prisma/dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
