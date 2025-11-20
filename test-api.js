// const fetch = require('node-fetch'); // Using native fetch

async function testCreateClient() {
    try {
        const response = await fetch('http://localhost:8080/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Teste Script",
                phone: "11999999999",
                email: "teste@script.com",
                registrationDate: new Date().toISOString(),
                score: 10,
                scoreHistory: [],
                notes: "Criado via script de teste"
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to create client:', error);
            process.exit(1);
        }

        const data = await response.json();
        console.log('Client created successfully:', data);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testCreateClient();
