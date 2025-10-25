

import React, { useState, useCallback, useMemo, useEffect } from 'react';
// Fix: Add .ts extension
import { Client, Loan, Payment, AppView, LoanType, paymentMethodUIMap, Installment, LoanStatus, Settings, Notification, InstallmentStatus, ScoreHistory } from '@/types.ts';
// Fix: Add .tsx extension
import Sidebar from '@/components/Sidebar.tsx';
// Fix: Add .tsx extension
import Header from '@/components/Header.tsx';
// Fix: Add .tsx extension
import DashboardView from '@/components/DashboardView.tsx';
// Fix: Add .tsx extension
import ClientsView from '@/components/ClientsView.tsx';
// Fix: Add .tsx extension
import LoansView from '@/components/LoansView.tsx';
// Fix: Add .tsx extension
import AddClientModal from '@/components/AddClientModal.tsx';
// Fix: Add .tsx extension
import AddLoanModal from '@/components/AddLoanModal.tsx';
// Fix: Add .tsx extension
import QuickPaymentModal from '@/components/QuickPaymentModal.tsx';
// Fix: Add .tsx extension
import ClientDetailView from '@/components/ClientDetailView.tsx';
// Fix: Add .tsx extension
import EditClientModal from '@/components/EditClientModal.tsx';
// Fix: Add .tsx extension
import EditLoanModal from '@/components/EditLoanModal.tsx';
// Fix: Add .tsx extension
import ReportsView from '@/components/ReportsView.tsx';
// Fix: Add .tsx extension
import SettingsView from '@/components/SettingsView.tsx';
// Fix: Add .tsx extension
import ImportClientsModal from '@/components/ImportClientsModal.tsx';
// Fix: Add .tsx extension
import ImportLoansModal from '@/components/ImportLoansModal.tsx'; // Import the new modal
import { addDays, subDays, format, addMonths, differenceInDays, startOfDay, isBefore } from 'date-fns';
// Fix: Add .tsx extension
import NotificationsPopover from '@/components/NotificationsPopover.tsx';

// --- MOCK DATA FOR INITIAL LOAD ---
const getInitialClients = (): Client[] => [
    { id: 'c1', name: 'John Doe', phone: '555-1234', email: 'john.doe@email.com', address: '123 Main St', registrationDate: subDays(new Date(), 45), notes: '', score: 9.5, scoreHistory: [{ date: subDays(new Date(), 45), reason: 'Initial Score', delta: 10, scoreBefore: 0, scoreAfter: 10 }] },
    { id: 'c2', name: 'Jane Smith', phone: '555-5678', email: 'jane.smith@email.com', address: '456 Oak Ave', registrationDate: subDays(new Date(), 120), notes: 'Reliable payer', score: 10, scoreHistory: [{ date: subDays(new Date(), 120), reason: 'Initial Score', delta: 10, scoreBefore: 0, scoreAfter: 10 }] },
];

const { getInitialLoans, getInitialPayments } = (() => {
    const loans: Loan[] = [];
    const payments: Payment[] = [];
    const now = new Date();

    const loan1StartDate = subDays(now, 15);
    const loan1DueDate = addDays(loan1StartDate, 30);
    const loan1Principal = 1000;
    const loan1InterestRate = 10;
    const loan1Remaining = loan1Principal * (1 + loan1InterestRate / 100);
    loans.push({
        id: 'l1',
        clientId: 'c1',
        type: LoanType.SINGLE,
        principal: loan1Principal,
        interestRate: loan1InterestRate,
        startDate: loan1StartDate,
        dueDate: loan1DueDate,
        remainingBalance: loan1Remaining,
        status: 'active',
        paymentHistory: [],
        renewalHistory: [],
        notes: 'Standard 30-day loan.'
    });

    const loan2StartDate = subDays(now, 40);
    const loan2DueDate = addDays(loan2StartDate, 30);
    const loan2Principal = 500;
    const loan2InterestRate = 12;
    const loan2Remaining = loan2Principal * (1 + loan2InterestRate / 100);
    loans.push({
        id: 'l2',
        clientId: 'c2',
        type: LoanType.SINGLE,
        principal: loan2Principal,
        interestRate: loan2InterestRate,
        startDate: loan2StartDate,
        dueDate: loan2DueDate,
        remainingBalance: loan2Remaining,
        status: 'overdue',
        paymentHistory: [],
        renewalHistory: [],
        notes: 'Client has been contacted.'
    });

    const loan3Id = 'l3';
    const loan3Principal = 1200;
    const loan3InterestRate = 8;
    const loan3Installments = 3;
    const loan3StartDate = subDays(now, 100);
    
    const i = loan3InterestRate / 100;
    const pmt = loan3Principal * (i * Math.pow(1 + i, loan3Installments)) / (Math.pow(1 + i, loan3Installments) - 1);

    const loan3PaymentSchedule: Installment[] = [];
    let currentBalance = loan3Principal;
    for (let k = 1; k <= loan3Installments; k++) {
        const interestAmount = currentBalance * i;
        const principalAmount = pmt - interestAmount;
        currentBalance -= principalAmount;
        loan3PaymentSchedule.push({
            installmentNumber: k,
            dueDate: addMonths(loan3StartDate, k),
            amount: pmt,
            principalAmount: principalAmount,
            interestAmount: interestAmount,
            remainingBalanceAfterPayment: currentBalance,
            status: 'paid',
            paidAmount: pmt,
            lateFee: 0,
        });
    }

    loans.push({
        id: loan3Id,
        clientId: 'c2',
        type: LoanType.INSTALLMENTS,
        principal: loan3Principal,
        interestRate: loan3InterestRate,
        paymentSchedule: loan3PaymentSchedule,
        startDate: loan3StartDate,
        dueDate: loan3PaymentSchedule[loan3PaymentSchedule.length - 1].dueDate,
        remainingBalance: 0,
        status: 'paid',
        paymentHistory: ['p1', 'p2', 'p3'],
        renewalHistory: [],
        notes: 'Paid off successfully.'
    });
    
    payments.push({ id: 'p1', loanId: loan3Id, clientId: 'c2', date: addMonths(loan3StartDate, 1), amount: pmt, method: 'pix', notes: 'Installment 1', principalPaid: loan3PaymentSchedule[0].principalAmount, interestPaid: loan3PaymentSchedule[0].interestAmount });
    payments.push({ id: 'p2', loanId: loan3Id, clientId: 'c2', date: addMonths(loan3StartDate, 2), amount: pmt, method: 'pix', notes: 'Installment 2', principalPaid: loan3PaymentSchedule[1].principalAmount, interestPaid: loan3PaymentSchedule[1].interestAmount });
    payments.push({ id: 'p3', loanId: loan3Id, clientId: 'c2', date: addMonths(loan3StartDate, 3), amount: pmt, method: 'pix', notes: 'Installment 3', principalPaid: loan3PaymentSchedule[2].principalAmount, interestPaid: loan3PaymentSchedule[2].interestAmount });
    
    const loan4Id = 'l4';
    const loan4Principal = 750;
    const loan4InterestRate = 15;
    const loan4StartDate = subDays(now, 20);
    const loan4DueDate = addDays(loan4StartDate, 30);
    const loan4Total = loan4Principal * (1 + loan4InterestRate/100);
    loans.push({
        id: loan4Id,
        clientId: 'c1',
        type: LoanType.SINGLE,
        principal: loan4Principal,
        interestRate: loan4InterestRate,
        startDate: loan4StartDate,
        dueDate: loan4DueDate,
        remainingBalance: loan4Total - 200,
        status: 'partially-paid',
        paymentHistory: ['p4'],
        renewalHistory: [],
        notes: 'Client paid a portion upfront.'
    });
    payments.push({id: 'p4', loanId: loan4Id, clientId: 'c1', date: subDays(now, 19), amount: 200, method: 'cash', notes: 'Partial payment.'});


    return { getInitialLoans: () => loans, getInitialPayments: () => payments };
})();


const LOCAL_STORAGE_KEYS = {
    clients: 'microcred_clients',
    loans: 'microcred_loans',
    payments: 'microcred_payments',
    settings: 'microcred_settings',
    appName: 'microcred_appName',
    googleConnected: 'microcred_google_connected',
    googleEmail: 'microcred_google_email',
    googleSheetId: 'microcred_google_sheet_id',
    googleSheetName: 'microcred_google_sheet_name',
    autoSync: 'microcred_auto_sync',
    lastSync: 'microcred_last_sync',
};

function deserializeWithDates<T>(jsonString: string | null): T | null {
    if (!jsonString) return null;
    
    try {
        const data = JSON.parse(jsonString);
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

        function recurse(obj: any) {
            if (!obj || typeof obj !== 'object') return;
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    if (typeof value === 'string' && isoDateRegex.test(value)) {
                        obj[key] = new Date(value);
                    } else if (typeof value === 'object') {
                        recurse(value);
                    }
                }
            }
        }
        recurse(data);
        return data as T;
    } catch (error) {
        console.error("Failed to parse or deserialize data from localStorage", error);
        return null;
    }
}

const App: React.FC = () => {
    const [clients, setClients] = useState<Client[]>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.clients);
        return deserializeWithDates<Client[]>(saved) || getInitialClients();
    });
    const [loans, setLoans] = useState<Loan[]>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.loans);
        return deserializeWithDates<Loan[]>(saved) || getInitialLoans();
    });
    const [payments, setPayments] = useState<Payment[]>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.payments);
        return deserializeWithDates<Payment[]>(saved) || getInitialPayments();
    });
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.settings);
        return saved ? JSON.parse(saved) : { defaultInterestRate: 10, defaultSingleLoanTermDays: 30, lateFeeRate: 2 };
    });
    const [appName, setAppName] = useState<string>(() => {
        return localStorage.getItem(LOCAL_STORAGE_KEYS.appName) || "MicroCred";
    });
    
    const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.googleConnected) === 'true');
    const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.googleEmail));
    const [googleSheetId, setGoogleSheetId] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.googleSheetId));
    const [googleSheetName, setGoogleSheetName] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.googleSheetName));
    const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.autoSync) === 'true');
    const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.lastSync));

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.clients, JSON.stringify(clients));
        localStorage.setItem(LOCAL_STORAGE_KEYS.loans, JSON.stringify(loans));
        localStorage.setItem(LOCAL_STORAGE_KEYS.payments, JSON.stringify(payments));
        localStorage.setItem(LOCAL_STORAGE_KEYS.settings, JSON.stringify(settings));
        localStorage.setItem(LOCAL_STORAGE_KEYS.appName, appName);
        
        localStorage.setItem(LOCAL_STORAGE_KEYS.googleConnected, String(isGoogleConnected));
        googleUserEmail ? localStorage.setItem(LOCAL_STORAGE_KEYS.googleEmail, googleUserEmail) : localStorage.removeItem(LOCAL_STORAGE_KEYS.googleEmail);
        googleSheetId ? localStorage.setItem(LOCAL_STORAGE_KEYS.googleSheetId, googleSheetId) : localStorage.removeItem(LOCAL_STORAGE_KEYS.googleSheetId);
        googleSheetName ? localStorage.setItem(LOCAL_STORAGE_KEYS.googleSheetName, googleSheetName) : localStorage.removeItem(LOCAL_STORAGE_KEYS.googleSheetName);
        localStorage.setItem(LOCAL_STORAGE_KEYS.autoSync, String(isAutoSyncEnabled));
        lastSyncTimestamp ? localStorage.setItem(LOCAL_STORAGE_KEYS.lastSync, lastSyncTimestamp) : localStorage.removeItem(LOCAL_STORAGE_KEYS.lastSync);
    }, [clients, loans, payments, settings, appName, isGoogleConnected, googleUserEmail, googleSheetId, googleSheetName, isAutoSyncEnabled, lastSyncTimestamp]);

    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState('dark');

    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
    const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState(false);
    const [isImportClientsModalOpen, setIsImportClientsModalOpen] = useState(false);
    const [isImportLoansModalOpen, setIsImportLoansModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const loansForView = useMemo(() => loans.map(loan => {
        const now = startOfDay(new Date());
        if (loan.status === 'active' && loan.dueDate && isBefore(startOfDay(loan.dueDate), now)) {
            return { ...loan, status: 'overdue' as LoanStatus };
        }
        return loan;
    }), [loans]);
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'success') {
            setIsGoogleConnected(true);
            setGoogleUserEmail('usuario@exemplo.com'); 
            setCurrentView('settings');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('auth') === 'error') {
            alert('Falha na autenticação com o Google.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const updateSyncTimestamp = () => {
        const timestamp = new Date().toISOString();
        setLastSyncTimestamp(timestamp);
    };

    const handleGoogleLogout = useCallback(async () => {
        try {
            await fetch(`/api/logout`, { method: 'POST' });
        } catch (error) {
            console.error("Failed to logout on backend, but proceeding with frontend logout:", error);
        } finally {
            setIsGoogleConnected(false);
            setGoogleUserEmail(null);
            setGoogleSheetId(null);
            setGoogleSheetName(null);
            setIsAutoSyncEnabled(false);
            setLastSyncTimestamp(null);
        }
    }, []);

    const handleCreateGoogleSheet = useCallback(async () => {
        try {
            const response = await fetch(`/api/sheets/create`, { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create sheet');
            }
            const data = await response.json();
            setGoogleSheetId(data.sheetId);
            setGoogleSheetName(data.sheetName);
        } catch (error) {
            console.error("Failed to create Google Sheet:", error);
            alert(`Não foi possível criar a planilha: ${error.message}`);
            throw error;
        }
    }, []);

    const handleSyncToSheet = useCallback(async () => {
        if (!googleSheetId) {
            alert("Nenhuma planilha conectada. Crie uma nova primeiro.");
            return;
        }
        try {
            const response = await fetch(`/api/sheets/sync-up`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients, loans, payments, sheetId: googleSheetId })
            });
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Sync failed');
            }
            updateSyncTimestamp();
        } catch (error) {
            console.error("Failed to sync to sheet:", error);
            alert(`Falha ao enviar dados para a planilha: ${error.message}`);
            throw error;
        }
    }, [googleSheetId, clients, loans, payments]);

    const handleSyncFromSheet = useCallback(async () => {
        if (!googleSheetId) {
            alert("Nenhuma planilha conectada.");
            return;
        }
        if (!window.confirm("Isso substituirá todos os dados locais por aqueles da planilha. Deseja continuar?")) {
            return;
        }
        try {
            const response = await fetch(`/api/sheets/sync-down?sheetId=${googleSheetId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Sync failed');
            }
            const data = await response.json();

            const deserializedClients = deserializeWithDates<Client[]>(JSON.stringify(data.clients));
            const deserializedLoans = deserializeWithDates<Loan[]>(JSON.stringify(data.loans));
            const deserializedPayments = deserializeWithDates<Payment[]>(JSON.stringify(data.payments));

            setClients(deserializedClients || []);
            setLoans(deserializedLoans || []);
            setPayments(deserializedPayments || []);
            
            updateSyncTimestamp();
            alert("Dados recebidos da planilha com sucesso!");
        } catch (error) {
            console.error("Failed to sync from sheet:", error);
            alert(`Falha ao receber dados da planilha: ${error.message}`);
            throw error;
        }
    }, [googleSheetId]);

    const handleToggleAutoSync = useCallback((enabled: boolean) => {
        if (enabled && !googleSheetId) {
            return;
        }
        setIsAutoSyncEnabled(enabled);
    }, [googleSheetId]);

    useEffect(() => {
        let isMounted = true;
        const autoSync = async () => {
             if (isGoogleConnected && isAutoSyncEnabled && googleSheetId) {
                console.log("Auto-sync enabled. Fetching data from Google Sheets on app load.");
                try {
                    await handleSyncFromSheet();
                } catch (e) {
                    if (isMounted) {
                       console.error("Auto-sync failed on load.", e);
                       alert("A sincronização automática ao iniciar falhou. Verifique o console para mais detalhes.");
                    }
                }
            }
        };
        autoSync();
        return () => { isMounted = false };
    }, [isGoogleConnected, isAutoSyncEnabled, googleSheetId]);

    const handleAddClient = useCallback((clientData: Omit<Client, 'id'>) => {
        const newClient: Client = { id: `c${Date.now()}`, ...clientData };
        setClients(prev => [...prev, newClient]);
        setIsAddClientModalOpen(false);
    }, []);
    
    const handleUpdateClient = useCallback((updatedClient: Client) => {
        setClients(prevClients => prevClients.map(client => client.id === updatedClient.id ? updatedClient : client));
        setEditingClient(null);
    }, []);

    const handleImportClients = useCallback((importedClients: Omit<Client, 'id' | 'registrationDate' | 'score' | 'scoreHistory'>[]) => {
        const newClients: Client[] = importedClients.map((clientData, index) => ({
            id: `c${Date.now() + index}`,
            ...clientData,
            registrationDate: new Date(),
            score: 10.0,
            scoreHistory: [{ date: new Date(), reason: 'Initial Score', delta: 10, scoreBefore: 0, scoreAfter: 10 }]
        }));
        
        setClients(prev => [...prev, ...newClients]);
        setIsImportClientsModalOpen(false);
        alert(`${newClients.length} cliente(s) importado(s) com sucesso!`);
    }, []);

    const handleImportLoans = useCallback((importedData: Record<string, any>[]) => {
        const newClientsToCreate: Client[] = [];
        const newLoansToCreate: Loan[] = [];
        const existingClientsMap = new Map<string, Client>(clients.map(c => [c.name.trim().toLowerCase(), c]));
        
        const calculateDueDateFromDay = (dayOfMonth: number): Date => {
            const now = new Date();
            const currentDay = now.getDate();
            let dueDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
            if (dayOfMonth <= currentDay) {
                dueDate = addMonths(dueDate, 1);
            }
            return startOfDay(dueDate);
        };

        importedData.forEach((row, index) => {
            const clientName = row['nome']?.trim();
            if (!clientName) return;

            let client = existingClientsMap.get(clientName.toLowerCase());
            let clientId: string;

            if (client) {
                clientId = client.id;
            } else {
                const newClientInBatch = newClientsToCreate.find(nc => nc.name.toLowerCase() === clientName.toLowerCase());
                if (newClientInBatch) {
                    clientId = newClientInBatch.id;
                } else {
                    clientId = `c_import_${Date.now() + index}`;
                    const newClient: Client = {
                        id: clientId, name: clientName, email: '', phone: '',
                        registrationDate: new Date(), score: 10.0,
                        scoreHistory: [{ date: new Date(), reason: 'Initial Score', delta: 10, scoreBefore: 0, scoreAfter: 10 }],
                        notes: 'Cliente importado via planilha.', address: ''
                    };
                    newClientsToCreate.push(newClient);
                    existingClientsMap.set(newClient.name.toLowerCase(), newClient);
                }
            }
            
            const principalStr = (row['valor_emprestado'] || '0').replace(/[^0-9,.]/g, '').replace('.', '').replace(',', '.');
            const principal = parseFloat(principalStr);
            
            const interestRateStr = (row['taxa_juros'] || '0').replace(/[^0-9,.]/g, '').replace(',', '.');
            const interestRate = parseFloat(interestRateStr);

            const dueDayStr = (row['dia_vencimento'] || '').trim();
            const dueDay = parseInt(dueDayStr, 10);
            
            if (isNaN(principal) || principal <= 0 || isNaN(interestRate) || isNaN(dueDay)) {
                console.warn(`Skipping row for client ${clientName} due to invalid loan data.`);
                return;
            }
            
            const dueDate = calculateDueDateFromDay(dueDay);
            const remainingBalance = principal * (1 + (interestRate / 100));
            
            let status: LoanStatus = 'active';
            const statusStr = (row['status'] || '').trim().toLowerCase();
            if (statusStr === 'atrasado') {
                status = 'overdue';
            }

            const newLoan: Loan = {
                id: `l_import_${Date.now() + index}`, clientId, type: LoanType.SINGLE,
                principal, interestRate, startDate: new Date(), dueDate, remainingBalance,
                status, paymentHistory: [], renewalHistory: [],
                notes: `Importado via planilha. Vencimento original no dia ${dueDay}.`
            };
            newLoansToCreate.push(newLoan);
        });

        if (newClientsToCreate.length > 0) {
            setClients(prev => [...prev, ...newClientsToCreate]);
        }
        if (newLoansToCreate.length > 0) {
            setLoans(prev => [...prev, ...newLoansToCreate]);
        }
        setIsImportLoansModalOpen(false);
        if (newLoansToCreate.length > 0) {
            alert(`${newLoansToCreate.length} empréstimo(s) importado(s) com sucesso! ${newClientsToCreate.length} novo(s) cliente(s) criado(s).`);
        } else {
            alert('Nenhum empréstimo válido encontrado para importar.');
        }
    }, [clients]);

    const handleAddLoan = useCallback((loanData: Omit<Loan, 'id'>) => {
        const newLoan: Loan = { id: `l${Date.now()}`, ...loanData };
        setLoans(prev => [...prev, newLoan]);
        setIsAddLoanModalOpen(false);
    }, []);

    const handleUpdateLoan = useCallback((updatedLoan: Loan) => {
        setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
        setEditingLoan(null);
    }, []);

    const handleDeleteLoan = useCallback((loanId: string) => {
        const loanToDelete = loans.find(l => l.id === loanId);
        if (loanToDelete && loanToDelete.paymentHistory.length === 0) {
            setLoans(prev => prev.filter(l => l.id !== loanId));
            setEditingLoan(null);
        } else {
            alert("Não é possível excluir um empréstimo que já possui pagamentos registrados.");
        }
    }, [loans]);

    const handleRecordPayment = useCallback((paymentData: Omit<Payment, 'id'>, loanId: string, isInterestOnlyPayment: boolean) => {
        const newPayment: Payment = { id: `p${Date.now()}`, ...paymentData };
        setPayments(prev => [...prev, newPayment]);

        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;
        const client = clients.find(c => c.id === loan.clientId);
        if (!client) return;

        let updatedLoan = { ...loan };
        let updatedClient = { ...client };
        const scoreChangeReason = `Pagamento de ${newPayment.amount.toFixed(2)}`;
        let scoreDelta = 0;

        const daysDiff = loan.dueDate ? differenceInDays(startOfDay(new Date()), startOfDay(loan.dueDate)) : 0;
        if (daysDiff <= 0) scoreDelta = 0.5;
        else scoreDelta = -Math.min(1, daysDiff * 0.1);

        if (loan.type === LoanType.SINGLE && isInterestOnlyPayment) {
            const interestAmount = loan.principal * (loan.interestRate / 100);
            if (Math.abs(newPayment.amount - interestAmount) < 0.01) {
                const newDueDate = addDays(loan.dueDate!, settings.defaultSingleLoanTermDays);
                updatedLoan.status = 'renewed';
                updatedLoan.dueDate = newDueDate;
                updatedLoan.renewalHistory = [...(loan.renewalHistory || []), { date: new Date(), newDueDate }];
                newPayment.isInterestOnly = true;
                scoreDelta = 1.0;
            } else {
                alert("O valor pago não corresponde exatamente ao valor dos juros para renovação.");
                setPayments(prev => prev.filter(p => p.id !== newPayment.id));
                return;
            }
        } else {
            updatedLoan.remainingBalance -= newPayment.amount;
            if (updatedLoan.remainingBalance < 0.01) {
                updatedLoan.remainingBalance = 0;
                updatedLoan.status = 'paid';
            } else {
                updatedLoan.status = 'partially-paid';
            }
        }
        
        updatedLoan.paymentHistory = [...loan.paymentHistory, newPayment.id];
        const oldScore = updatedClient.score;
        const newScore = Math.max(0, Math.min(10, oldScore + scoreDelta));
        updatedClient.score = newScore;
        updatedClient.scoreHistory = [...(client.scoreHistory || []), { date: new Date(), reason: scoreChangeReason, delta: scoreDelta, scoreBefore: oldScore, scoreAfter: newScore }];
        
        setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
        setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
        setIsQuickPaymentModalOpen(false);
    }, [loans, clients, settings.defaultSingleLoanTermDays]);
    
    const handleDeletePayment = useCallback((paymentId: string) => {
        alert(`Estorno de pagamento (ID: ${paymentId}) ainda não implementado.`);
    }, []);

    const handleGenerateReceipt = useCallback((paymentId: string) => {
        alert(`Geração de comprovante (ID: ${paymentId}) ainda não implementado.`);
    }, []);

    const handleThemeToggle = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);
    
    const notifications = useMemo<Notification[]>(() => {
        const now = startOfDay(new Date());
        const alerts: Notification[] = [];
        loansForView.forEach(loan => {
            const client = clients.find(c => c.id === loan.clientId);
            if (!client || loan.status === 'paid' || !loan.dueDate) return;
            const daysDiff = differenceInDays(startOfDay(loan.dueDate), now);
            if (loan.status === 'overdue') {
                alerts.push({ id: `n-overdue-${loan.id}`, clientName: client.name, message: `Empréstimo vencido há ${Math.abs(daysDiff)} dia(s).`, type: 'danger' });
            } else if (daysDiff >= 0 && daysDiff <= 3) {
                alerts.push({ id: `n-due-${loan.id}`, clientName: client.name, message: `Empréstimo vence em ${daysDiff} dia(s).`, type: 'warning' });
            }
        });
        return alerts.sort((a,b) => (a.type === 'danger' ? -1 : 1));
    }, [loansForView, clients]);

    const handleViewClient = (clientId: string) => {
        setSelectedClientId(clientId);
        setCurrentView('client-detail');
    };
    
    const selectedClient = clients.find(c => c.id === selectedClientId);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView loans={loansForView} clients={clients} payments={payments} onViewLoans={(filter) => { setCurrentView('loans'); }} appName={appName} setAppName={setAppName} />;
            case 'clients':
                return <ClientsView clients={clients} onSelectClient={handleViewClient} onEditClient={setEditingClient} />;
            case 'client-detail':
                return selectedClient ? <ClientDetailView client={selectedClient} loans={loansForView.filter(l => l.clientId === selectedClient.id)} payments={payments.filter(p => p.clientId === selectedClient.id)} onRecordPayment={handleRecordPayment} onGenerateReceipt={handleGenerateReceipt} onEditClient={setEditingClient} onEditLoan={setEditingLoan} onDeletePayment={handleDeletePayment} /> : <div>Cliente não encontrado.</div>;
            case 'loans':
                return <LoansView loans={loansForView} clients={clients} onRecordPayment={handleRecordPayment} onEditLoan={setEditingLoan} />;
            case 'reports':
                return <ReportsView loans={loans} payments={payments} />;
            case 'settings':
                return <SettingsView settings={settings} onSave={setSettings} clients={clients} loans={loans} onImportClients={() => setIsImportClientsModalOpen(true)} onImportLoans={() => setIsImportLoansModalOpen(true)} isGoogleConnected={isGoogleConnected} googleUserEmail={googleUserEmail} googleSheetId={googleSheetId} googleSheetName={googleSheetName} isAutoSyncEnabled={isAutoSyncEnabled} lastSyncTimestamp={lastSyncTimestamp} onGoogleLogout={handleGoogleLogout} onCreateGoogleSheet={handleCreateGoogleSheet} onSyncToSheet={handleSyncToSheet} onSyncFromSheet={handleSyncFromSheet} onToggleAutoSync={handleToggleAutoSync} />;
            default:
                return <div>Página não encontrada</div>;
        }
    };

    return (
        <div className={`flex h-screen font-sans ${theme}`}>
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    onAddClientClick={() => setIsAddClientModalOpen(true)} 
                    onAddLoanClick={() => setIsAddLoanModalOpen(true)}
                    onQuickPaymentClick={() => setIsQuickPaymentModalOpen(true)}
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    theme={theme}
                    onThemeToggle={handleThemeToggle}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-6">
                    {renderView()}
                </main>
            </div>
            {isAddClientModalOpen && <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onAddClient={handleAddClient} />}
            {isAddLoanModalOpen && <AddLoanModal isOpen={isAddLoanModalOpen} onClose={() => setIsAddLoanModalOpen(false)} onAddLoan={handleAddLoan} clients={clients} settings={settings} />}
            {isQuickPaymentModalOpen && <QuickPaymentModal isOpen={isQuickPaymentModalOpen} onClose={() => setIsQuickPaymentModalOpen(false)} onRecordPayment={handleRecordPayment} clients={clients} loans={loans} />}
            {editingClient && <EditClientModal isOpen={!!editingClient} onClose={() => setEditingClient(null)} client={editingClient} onUpdateClient={handleUpdateClient} />}
            {editingLoan && <EditLoanModal isOpen={!!editingLoan} onClose={() => setEditingLoan(null)} loan={editingLoan} onUpdateLoan={handleUpdateLoan} onDeleteLoan={handleDeleteLoan} />}
            {isImportClientsModalOpen && <ImportClientsModal isOpen={isImportClientsModalOpen} onClose={() => setIsImportClientsModalOpen(false)} onImport={handleImportClients} />}
            {isImportLoansModalOpen && <ImportLoansModal isOpen={isImportLoansModalOpen} onClose={() => setIsImportLoansModalOpen(false)} onImport={handleImportLoans} />}
            {isNotificationsOpen && <NotificationsPopover notifications={notifications} onClose={() => setIsNotificationsOpen(false)} />}
        </div>
    );
};

export default App;