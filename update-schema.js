// Script to update Turso database schema with User model and userId columns
require('dotenv').config();
const prisma = require('./api/prisma');

async function updateSchema() {
    try {
        console.log('🔄 Updating Turso database schema...');

        // 1. Create User table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ User table created');

        // 2. Drop existing tables (since we're adding required foreign keys)
        console.log('⚠️  Dropping existing tables to add userId columns...');
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Payment";`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Installment";`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "RenewalHistory";`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ScoreHistory";`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Loan";`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Client";`);

        // 3. Recreate Client table with userId
        await prisma.$executeRawUnsafe(`
      CREATE TABLE "Client" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "email" TEXT,
        "address" TEXT,
        "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "notes" TEXT,
        "score" REAL NOT NULL DEFAULT 10.0,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);
        console.log('✅ Client table recreated with userId');

        // 4. Recreate Loan table with userId
        await prisma.$executeRawUnsafe(`
      CREATE TABLE "Loan" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "principal" REAL NOT NULL,
        "interestRate" REAL NOT NULL,
        "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" DATETIME,
        "remainingBalance" REAL NOT NULL,
        "status" TEXT NOT NULL,
        "notes" TEXT,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("clientId") REFERENCES "Client"("id")
      );
    `);
        console.log('✅ Loan table recreated with userId');

        // 5. Recreate Payment table with userId
        await prisma.$executeRawUnsafe(`
      CREATE TABLE "Payment" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "loanId" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "amount" REAL NOT NULL,
        "method" TEXT NOT NULL,
        "notes" TEXT,
        "isInterestOnly" INTEGER NOT NULL DEFAULT 0,
        "principalPaid" REAL,
        "interestPaid" REAL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("loanId") REFERENCES "Loan"("id"),
        FOREIGN KEY ("clientId") REFERENCES "Client"("id")
      );
    `);
        console.log('✅ Payment table recreated with userId');

        // 6. Recreate other tables
        await prisma.$executeRawUnsafe(`
      CREATE TABLE "ScoreHistory" (
        "id" TEXT PRIMARY KEY,
        "clientId" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reason" TEXT NOT NULL,
        "delta" REAL NOT NULL,
        "scoreBefore" REAL NOT NULL,
        "scoreAfter" REAL NOT NULL,
        FOREIGN KEY ("clientId") REFERENCES "Client"("id")
      );
    `);

        await prisma.$executeRawUnsafe(`
      CREATE TABLE "RenewalHistory" (
        "id" TEXT PRIMARY KEY,
        "loanId" TEXT NOT NULL,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "newDueDate" DATETIME NOT NULL,
        FOREIGN KEY ("loanId") REFERENCES "Loan"("id")
      );
    `);

        await prisma.$executeRawUnsafe(`
      CREATE TABLE "Installment" (
        "id" TEXT PRIMARY KEY,
        "loanId" TEXT NOT NULL,
        "installmentNumber" INTEGER NOT NULL,
        "dueDate" DATETIME NOT NULL,
        "amount" REAL NOT NULL,
        "principalAmount" REAL NOT NULL,
        "interestAmount" REAL NOT NULL,
        "remainingBalanceAfterPayment" REAL NOT NULL,
        "status" TEXT NOT NULL,
        "paidAmount" REAL NOT NULL DEFAULT 0,
        "lateFee" REAL NOT NULL DEFAULT 0,
        FOREIGN KEY ("loanId") REFERENCES "Loan"("id")
      );
    `);

        console.log('✅ All supporting tables recreated');

        // Verify tables
        const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `;
        console.log('\n📊 Tables in database:');
        tables.forEach(table => console.log('  -', table.name));

        console.log('\n✅ Schema update completed successfully!');

    } catch (error) {
        console.error('❌ Failed to update schema:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateSchema();
