
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const { format, parse } = require('date-fns');

dotenv.config();

const app = express();

let tokens = null;

// Allow requests from the frontend development server and the deployed frontend
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'];
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

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/spreadsheets'
];

app.get('/api/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens: newTokens } = await oauth2Client.getToken(code);
    tokens = newTokens;
    oauth2Client.setCredentials(tokens);
    console.log('Successfully authenticated with Google!');
    // Redirect to the settings page on the Vite dev server or production URL
    const frontendUrl = req.headers.host.includes('localhost') ? 'http://localhost:5173' : process.env.FRONTEND_URL;
    res.redirect(`${frontendUrl}/?auth=success`);
  } catch (error) {
    console.error('Error getting tokens from Google:', error);
    const frontendUrl = req.headers.host.includes('localhost') ? 'http://localhost:5173' : process.env.FRONTEND_URL;
    res.redirect(`${frontendUrl}/?auth=error`);
  }
});

app.post('/api/logout', (req, res) => {
  console.log('Logging out, clearing tokens.');
  tokens = null;
  res.status(200).json({ message: 'Logged out successfully' });
});

const isAuthenticated = (req, res, next) => {
  if (!tokens) {
    return res.status(401).json({ error: 'User is not authenticated. Please login again.' });
  }
  oauth2Client.setCredentials(tokens);
  next();
};

app.post('/api/sheets/create', isAuthenticated, async (req, res) => {
    console.log('Request to create a Google Sheet.');
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const sheetTitle = `Backup MicroCred - ${format(new Date(), 'dd-MM-yyyy')}`;

    try {
        const spreadsheet = await sheets.spreadsheets.create({
            resource: {
                properties: { title: sheetTitle },
                sheets: [
                    { properties: { title: 'Clientes' } },
                    { properties: { title: 'Empréstimos' } },
                    { properties: { title: 'Pagamentos' } },
                ]
            },
            fields: 'spreadsheetId,properties.title',
        });
        
        const sheetId = spreadsheet.data.spreadsheetId;
        console.log(`Created new spreadsheet with ID: ${sheetId}`);

        const headers = {
            Clientes: [['ID', 'Nome', 'Telefone', 'Email', 'Endereço', 'Data Cadastro', 'Notas', 'Score']],
            Empréstimos: [['ID Empréstimo', 'ID Cliente', 'Tipo', 'Principal', 'Juros (%)', 'Data Início', 'Data Vencimento', 'Saldo Restante', 'Status', 'Notas']],
            Pagamentos: [['ID Pagamento', 'ID Empréstimo', 'ID Cliente', 'Data', 'Valor', 'Método', 'Notas']]
        };

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId,
            resource: {
                valueInputOption: 'USER_ENTERED',
                data: [
                    { range: 'Clientes!A1', values: headers.Clientes },
                    { range: 'Empréstimos!A1', values: headers.Empréstimos },
                    { range: 'Pagamentos!A1', values: headers.Pagamentos },
                ]
            }
        });

        console.log('Headers added to all sheets.');

        res.status(201).json({
            sheetId: sheetId,
            sheetName: spreadsheet.data.properties.title
        });

    } catch (error) {
        console.error('Error creating spreadsheet:', error);
        res.status(500).json({ error: 'Failed to create spreadsheet', details: error.message });
    }
});

const safeFormatDate = (date, formatString) => {
    if (!date) return '';
    try {
        return format(new Date(date), formatString);
    } catch (e) {
        return '';
    }
};

app.post('/api/sheets/sync-up', isAuthenticated, async (req, res) => {
    const { clients, loans, payments, sheetId } = req.body;
    console.log(`Syncing up to Sheet ID: ${sheetId}`);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    try {
        await sheets.spreadsheets.values.batchClear({
            spreadsheetId: sheetId,
            resource: { ranges: ['Clientes!A2:Z', 'Empréstimos!A2:Z', 'Pagamentos!A2:Z'] }
        });
        console.log('Cleared existing data from sheets.');

        const clientRows = clients.map(c => [c.id, c.name, c.phone, c.email, c.address, safeFormatDate(c.registrationDate, 'dd/MM/yyyy'), c.notes, c.score]);
        const loanRows = loans.map(l => [l.id, l.clientId, l.type, l.principal, l.interestRate, safeFormatDate(l.startDate, 'dd/MM/yyyy'), safeFormatDate(l.dueDate, 'dd/MM/yyyy'), l.remainingBalance, l.status, l.notes]);
        const paymentRows = payments.map(p => [p.id, p.loanId, p.clientId, safeFormatDate(p.date, 'dd/MM/yyyy HH:mm'), p.amount, p.method, p.notes]);

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId,
            resource: {
                valueInputOption: 'USER_ENTERED',
                data: [
                    { range: 'Clientes!A2', values: clientRows.length ? clientRows : [[]] },
                    { range: 'Empréstimos!A2', values: loanRows.length ? loanRows : [[]] },
                    { range: 'Pagamentos!A2', values: paymentRows.length ? paymentRows : [[]] },
                ]
            }
        });
        console.log('Successfully synced data to Google Sheet.');
        res.status(200).json({ message: 'Sync to sheet successful' });

    } catch (error) {
        console.error('Error syncing to spreadsheet:', error);
        res.status(500).json({ error: 'Failed to sync to spreadsheet', details: error.message });
    }
});

const safeParseDate = (dateString, formatString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    try {
        const parsed = parse(dateString.trim(), formatString, new Date());
        if (isNaN(parsed.getTime())) {
            console.warn(`Invalid date encountered: "${dateString}" with format "${formatString}"`);
            return null;
        }
        return parsed;
    } catch (e) {
        console.error(`Error parsing date: "${dateString}"`, e);
        return null;
    }
};

app.get('/api/sheets/sync-down', isAuthenticated, async (req, res) => {
    const { sheetId } = req.query;
    console.log(`Syncing down from Sheet ID: ${sheetId}`);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    try {
        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: sheetId,
            ranges: ['Clientes!A2:H', 'Empréstimos!A2:J', 'Pagamentos!A2:G']
        });

        if (!response.data.valueRanges) {
           return res.status(200).json({ clients: [], loans: [], payments: [] });
        }

        const [clientValues, loanValues, paymentValues] = response.data.valueRanges;

        const clients = (clientValues.values || []).map(row => ({
            id: row[0], name: row[1], phone: row[2], email: row[3], address: row[4],
            registrationDate: safeParseDate(row[5], 'dd/MM/yyyy'),
            notes: row[6], score: parseFloat(row[7]), scoreHistory: []
        }));
        
        const loans = (loanValues.values || []).map(row => ({
            id: row[0], clientId: row[1], type: row[2], principal: parseFloat(row[3]),
            interestRate: parseFloat(row[4]),
            startDate: safeParseDate(row[5], 'dd/MM/yyyy'),
            dueDate: safeParseDate(row[6], 'dd/MM/yyyy'),
            remainingBalance: parseFloat(row[7]), status: row[8], notes: row[9],
            paymentHistory: [], renewalHistory: [], paymentSchedule: undefined
        }));

        const payments = (paymentValues.values || []).map(row => ({
            id: row[0], loanId: row[1], clientId: row[2],
            date: safeParseDate(row[3], 'dd/MM/yyyy HH:mm'),
            amount: parseFloat(row[4]), method: row[5], notes: row[6]
        }));
        
        payments.forEach(p => {
            const loan = loans.find(l => l.id === p.loanId);
            if(loan) {
                loan.paymentHistory.push(p.id);
            }
        });
        
        console.log(`Read ${clients.length} clients, ${loans.length} loans from sheet.`);
        res.status(200).json({ clients, loans, payments });

    } catch (error) {
        console.error('Error syncing from spreadsheet:', error);
        res.status(500).json({ error: 'Failed to sync from spreadsheet', details: error.message });
    }
});

module.exports = app;
