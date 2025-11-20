
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./prisma');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();

// Allow requests from the frontend development server
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// ... (rest of the file)



// Auth routes (public)
app.use('/api/auth', authRoutes);

// --- Database Routes (Protected) ---

// Clients
app.get('/api/clients', authMiddleware, async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            where: { userId: req.user.id },
            include: {
                scoreHistory: true
            }
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
    }
});

app.post('/api/clients', authMiddleware, async (req, res) => {
    try {
        const { scoreHistory, ...clientData } = req.body;
        const data = {
            ...clientData,
            userId: req.user.id,
            registrationDate: clientData.registrationDate ? new Date(clientData.registrationDate) : new Date(),
            scoreHistory: scoreHistory && scoreHistory.length > 0 ? {
                create: scoreHistory.map(sh => ({
                    ...sh,
                    date: sh.date ? new Date(sh.date) : new Date()
                }))
            } : undefined
        };

        const client = await prisma.client.create({
            data,
            include: { scoreHistory: true }
        });
        res.json(client);
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: 'Failed to create client', details: error.message });
    }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership
        const existing = await prisma.client.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const { scoreHistory, ...clientData } = req.body;

        // Delete existing score history
        await prisma.scoreHistory.deleteMany({ where: { clientId: id } });

        const data = {
            ...clientData,
            registrationDate: clientData.registrationDate ? new Date(clientData.registrationDate) : undefined,
            scoreHistory: scoreHistory && scoreHistory.length > 0 ? {
                create: scoreHistory.map(sh => ({
                    ...sh,
                    date: sh.date ? new Date(sh.date) : new Date()
                }))
            } : undefined
        };

        const client = await prisma.client.update({
            where: { id },
            data,
            include: { scoreHistory: true }
        });
        res.json(client);
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ error: 'Failed to update client', details: error.message });
    }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership before deleting
        const existing = await prisma.client.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Client not found' });
        }
        await prisma.client.delete({ where: { id } });
        res.json({ message: 'Client deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete client', details: error.message });
    }
});

// Loans
app.get('/api/loans', authMiddleware, async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            where: { userId: req.user.id },
            include: {
                paymentSchedule: true,
                renewalHistory: true
            }
        });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loans', details: error.message });
    }
});

app.post('/api/loans', authMiddleware, async (req, res) => {
    try {
        const { paymentSchedule, renewalHistory, paymentHistory, ...loanData } = req.body;
        const data = {
            ...loanData,
            userId: req.user.id,
            startDate: loanData.startDate ? new Date(loanData.startDate) : new Date(),
            dueDate: loanData.dueDate ? new Date(loanData.dueDate) : null,
            paymentSchedule: paymentSchedule && paymentSchedule.length > 0 ? {
                create: paymentSchedule.map(p => ({
                    ...p,
                    dueDate: p.dueDate ? new Date(p.dueDate) : new Date()
                }))
            } : undefined,
        };

        const loan = await prisma.loan.create({
            data
        });
        res.json(loan);
    } catch (error) {
        console.error("Error creating loan:", error);
        res.status(500).json({ error: 'Failed to create loan', details: error.message });
    }
});

app.put('/api/loans/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership
        const existing = await prisma.loan.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        const { paymentSchedule, renewalHistory, paymentHistory, ...loanData } = req.body;

        const data = {
            ...loanData,
            startDate: loanData.startDate ? new Date(loanData.startDate) : undefined,
            dueDate: loanData.dueDate ? new Date(loanData.dueDate) : null,
        };

        const loan = await prisma.loan.update({
            where: { id },
            data
        });
        res.json(loan);
    } catch (error) {
        console.error("Error updating loan:", error);
        res.status(500).json({ error: 'Failed to update loan', details: error.message });
    }
});

app.delete('/api/loans/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership
        const existing = await prisma.loan.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Loan not found' });
        }
        await prisma.loan.delete({ where: { id } });
        res.json({ message: 'Loan deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete loan', details: error.message });
    }
});

// Payments
app.get('/api/payments', authMiddleware, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            where: { userId: req.user.id }
        });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
    }
});

app.post('/api/payments', authMiddleware, async (req, res) => {
    try {
        const { date, ...paymentData } = req.body;
        const data = {
            ...paymentData,
            userId: req.user.id,
            date: date ? new Date(date) : new Date()
        };
        const payment = await prisma.payment.create({
            data
        });
        res.json(payment);
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({ error: 'Failed to create payment', details: error.message });
    }
});

// Process Payment with Business Logic (calculates balance, updates loan status, updates client score)
app.post('/api/payments/process', authMiddleware, async (req, res) => {
    try {
        const { loanId, amount, method, notes, isInterestOnly, clientId } = req.body;

        // 1. Get Loan and Client (verify ownership)
        const loan = await prisma.loan.findFirst({
            where: { id: loanId, userId: req.user.id }
        });
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        const client = await prisma.client.findFirst({
            where: { id: clientId || loan.clientId, userId: req.user.id },
            include: { scoreHistory: true }
        });
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // 2. Create Payment
        const payment = await prisma.payment.create({
            data: {
                loanId,
                clientId: client.id,
                userId: req.user.id,
                date: new Date(),
                amount: parseFloat(amount),
                method,
                notes: notes || '',
                isInterestOnly: isInterestOnly || false
            }
        });

        // 3. Calculate new loan balance and status
        let newBalance = loan.remainingBalance;
        let newStatus = loan.status;
        let scoreDelta = 0;
        let scoreReason = '';

        if (isInterestOnly) {
            // Interest-only payment (renewal)
            const expectedInterest = loan.principal * (loan.interestRate / 100);
            if (Math.abs(payment.amount - expectedInterest) < 0.01) {
                // Extend due date by default term (30 days)
                const newDueDate = new Date(loan.dueDate);
                newDueDate.setDate(newDueDate.getDate() + 30);

                await prisma.renewalHistory.create({
                    data: {
                        loanId: loan.id,
                        date: new Date(),
                        newDueDate
                    }
                });

                newStatus = 'renewed';
                scoreDelta = 1.0;
                scoreReason = 'Loan renewed on time';

                await prisma.loan.update({
                    where: { id: loanId },
                    data: {
                        status: newStatus,
                        dueDate: newDueDate
                    }
                });
            }
        } else {
            // Regular payment
            newBalance -= payment.amount;

            if (newBalance < 0.01) {
                newBalance = 0;
                newStatus = 'paid';
                scoreDelta = 2.0;
                scoreReason = 'Loan paid in full';
            } else {
                newStatus = 'partially-paid';
                scoreDelta = 0.5;
                scoreReason = 'Partial payment made';
            }

            await prisma.loan.update({
                where: { id: loanId },
                data: {
                    remainingBalance: newBalance,
                    status: newStatus
                }
            });
        }

        // 4. Update Client Score
        const oldScore = client.score;
        const newScore = Math.max(0, Math.min(10, oldScore + scoreDelta));

        await prisma.client.update({
            where: { id: client.id },
            data: { score: newScore }
        });

        await prisma.scoreHistory.create({
            data: {
                clientId: client.id,
                date: new Date(),
                reason: scoreReason,
                delta: scoreDelta,
                scoreBefore: oldScore,
                scoreAfter: newScore
            }
        });

        // 5. Return updated data
        const updatedLoan = await prisma.loan.findUnique({ where: { id: loanId } });
        const updatedClient = await prisma.client.findUnique({
            where: { id: client.id },
            include: { scoreHistory: true }
        });

        res.json({
            payment,
            loan: updatedLoan,
            client: updatedClient
        });
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ error: 'Failed to process payment', details: error.message });
    }
});

app.delete('/api/payments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.payment.delete({ where: { id } });
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete payment', details: error.message });
    }
});

module.exports = app;

// Start the server if run directly (e.g. node api/index.js)
if (require.main === module) {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        console.log(`✅ Backend server is running on http://localhost:${port}`);
    });
}
