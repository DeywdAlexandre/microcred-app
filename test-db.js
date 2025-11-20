const prisma = require('./api/prisma');

async function main() {
    try {
        console.log('Connecting to database...');
        const clients = await prisma.client.findMany();
        console.log('Connection successful!');
        console.log('Clients found:', clients.length);
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
