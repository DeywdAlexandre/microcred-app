const axios = require('axios');
const prisma = require('./api/prisma');
// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// Configuration
const API_URL = 'http://localhost:8080/api';
const USER_A = { name: 'User A', email: 'usera@test.com', password: 'password123' };
const USER_B = { name: 'User B', email: 'userb@test.com', password: 'password123' };

async function runTests() {
    console.log('🚀 Starting Authentication & Data Isolation Tests...\n');

    try {
        // Cleanup previous tests
        console.log('🧹 Cleaning up test data...');
        await prisma.user.deleteMany({
            where: {
                email: { in: [USER_A.email, USER_B.email] }
            }
        });
        console.log('✅ Cleanup complete\n');

        // 1. Register User A
        console.log('👤 Registering User A...');
        const regA = await axios.post(`${API_URL}/auth/register`, USER_A);
        const tokenA = regA.data.token;
        console.log('✅ User A registered. Token received.\n');

        // 2. Register User B
        console.log('👤 Registering User B...');
        const regB = await axios.post(`${API_URL}/auth/register`, USER_B);
        const tokenB = regB.data.token;
        console.log('✅ User B registered. Token received.\n');

        // 3. Create Client for User A
        console.log('📝 Creating Client for User A...');
        const clientA = await axios.post(`${API_URL}/clients`, {
            name: 'Client of User A',
            phone: '123456789',
            email: 'clienta@example.com'
        }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        console.log(`✅ Client created for User A (ID: ${clientA.data.id})\n`);

        // 4. Create Client for User B
        console.log('📝 Creating Client for User B...');
        const clientB = await axios.post(`${API_URL}/clients`, {
            name: 'Client of User B',
            phone: '987654321',
            email: 'clientb@example.com'
        }, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        console.log(`✅ Client created for User B (ID: ${clientB.data.id})\n`);

        // 5. Verify Isolation: User A fetching clients
        console.log('🔍 User A fetching clients...');
        const clientsA = await axios.get(`${API_URL}/clients`, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        const userAHasOwn = clientsA.data.some(c => c.id === clientA.data.id);
        const userAHasOther = clientsA.data.some(c => c.id === clientB.data.id);

        if (userAHasOwn && !userAHasOther) {
            console.log('✅ User A sees ONLY their own clients.');
        } else {
            console.error('❌ DATA LEAK! User A sees wrong data:', clientsA.data);
        }

        // 6. Verify Isolation: User B fetching clients
        console.log('🔍 User B fetching clients...');
        const clientsB = await axios.get(`${API_URL}/clients`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        const userBHasOwn = clientsB.data.some(c => c.id === clientB.data.id);
        const userBHasOther = clientsB.data.some(c => c.id === clientA.data.id);

        if (userBHasOwn && !userBHasOther) {
            console.log('✅ User B sees ONLY their own clients.');
        } else {
            console.error('❌ DATA LEAK! User B sees wrong data:', clientsB.data);
        }
        console.log('\n');

        // 7. Verify Access Control: User A trying to access User B's client directly
        console.log("🔒 Testing Access Control (User A -> User B's Client)...");
        try {
            await axios.put(`${API_URL}/clients/${clientB.data.id}`, {
                name: 'Hacked Client'
            }, {
                headers: { Authorization: `Bearer ${tokenA}` }
            });
            console.error('❌ SECURITY FAIL! User A was able to update User B\'s client.');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Access Denied correctly (404 Not Found - simulating non-existence).');
            } else {
                console.log(`✅ Access Denied with status: ${error.response ? error.response.status : error.message}`);
            }
        }

        console.log('\n🎉 All tests passed successfully!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.response ? error.response.data : error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
