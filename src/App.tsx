
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// Fix: Add .ts extension
import { Client, Loan, Payment, AppView, LoanType, LoanStatus, Settings, Notification } from '@/types.ts';
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
import { addMonths, differenceInDays, startOfDay, isBefore } from 'date-fns';
import { useClients } from './hooks/useClients';
import { useLoans } from './hooks/useLoans';
import { usePayments } from './hooks/usePayments';
// Fix: Add .tsx extension
import NotificationsPopover from '@/components/NotificationsPopover.tsx';

// Mock data removed - now using database via API

const LOCAL_STORAGE_KEYS = {
    settings: 'microcred_settings',
    appName: 'microcred_appName',
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const MainApp: React.FC = () => {
    const { logout } = useAuth();
    // Use custom hooks for data management
    const { clients, loadClients, addClient, updateClient, importClients } = useClients();
    const { loans, loadLoans, addLoan, updateLoan, deleteLoan, importLoans } = useLoans();
    const { payments, loadPayments, processPayment } = usePayments();
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.settings);
        return saved ? JSON.parse(saved) : {
            defaultInterestRate: 10,
            defaultSingleLoanTermDays: 30,
            lateFeeRate: 5
        };
    });
    const [appName, setAppName] = useState<string>(() => {
        return localStorage.getItem(LOCAL_STORAGE_KEYS.appName) || "MicroCred";
    });



    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            await Promise.all([
                loadClients(),
                loadLoans(),
                loadPayments()
            ]);
        } catch (error: any) {
            console.error("Failed to load data", error);
        }
    };

    // Save settings to localStorage (keep settings local for now or move to DB later)
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.settings, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.appName, appName);
    }, [appName]);



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





    const handleAddClient = async (clientData: Omit<Client, 'id'>) => {
        try {
            await addClient(clientData);
            setIsAddClientModalOpen(false);
        } catch (error: any) {
            alert("Erro ao criar cliente");
        }
    };

    const handleUpdateClient = async (updatedClient: Client) => {
        try {
            await updateClient(updatedClient);
            setEditingClient(null);
        } catch (error: any) {
            alert("Erro ao atualizar cliente");
        }
    };

    const handleImportClients = useCallback(async (importedClientsData: Omit<Client, 'id' | 'registrationDate' | 'score' | 'scoreHistory'>[]) => {
        try {
            const count = await importClients(importedClientsData);
            setIsImportClientsModalOpen(false);
            alert(`${count} cliente(s) importado(s) com sucesso!`);
        } catch (error: any) {
            alert("Erro ao importar clientes.");
        }
    }, [importClients]);

    const handleImportLoans = useCallback(async (importedData: Record<string, any>[]) => {
        const newClientsToCreate: any[] = [];
        const newLoansToCreate: Omit<Loan, 'id'>[] = [];
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
                    clientId = newClientInBatch.id; // Use temporary ID for batch
                } else {
                    clientId = `c_import_${Date.now() + index}`; // Temporary ID
                    const newClient: Omit<Client, 'id'> = {
                        name: clientName, email: '', phone: '',
                        registrationDate: new Date(), score: 10.0,
                        scoreHistory: [{ date: new Date(), reason: 'Initial Score', delta: 10, scoreBefore: 0, scoreAfter: 10 }],
                        notes: 'Cliente importado via planilha.', address: ''
                    };
                    newClientsToCreate.push(newClient);
                    existingClientsMap.set(newClient.name.toLowerCase(), { ...newClient, id: clientId }); // Add to map with temp ID
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

            const newLoan: Omit<Loan, 'id'> = {
                clientId, type: LoanType.SINGLE,
                principal, interestRate, startDate: new Date(), dueDate, remainingBalance,
                status, paymentHistory: [], renewalHistory: [],
                notes: `Importado via planilha. Vencimento original no dia ${dueDay}.`
            };
            newLoansToCreate.push(newLoan);
        });

        try {
            if (newClientsToCreate.length > 0) {
                await Promise.all(newClientsToCreate.map(client => addClient(client)));
            }

            // Map temporary client IDs to actual IDs for loans
            const finalLoansToCreate = newLoansToCreate.map(loan => {
                const tempClientId = loan.clientId;
                const actualClient = clients.find(c => c.id === tempClientId);
                return { ...loan, clientId: actualClient ? actualClient.id : tempClientId };
            });

            if (finalLoansToCreate.length > 0) {
                await Promise.all(finalLoansToCreate.map(loan => addLoan(loan)));
            }

            setIsImportLoansModalOpen(false);
            if (finalLoansToCreate.length > 0) {
                alert(`${finalLoansToCreate.length} empréstimo(s) importado(s) com sucesso! ${newClientsToCreate.length} novo(s) cliente(s) criado(s).`);
            } else {
                alert('Nenhum empréstimo válido encontrado para importar.');
            }
        } catch (error: any) {
            console.error("Error importing loans", error);
            alert("Erro ao importar empréstimos.");
        }
    }, [clients, addClient, addLoan]);

    const handleAddLoan = async (loanData: Omit<Loan, 'id'>) => {
        try {
            await addLoan(loanData);
            setIsAddLoanModalOpen(false);
        } catch (error: any) {
            alert("Erro ao criar empréstimo");
        }
    };

    const handleUpdateLoan = async (updatedLoan: Loan) => {
        try {
            await updateLoan(updatedLoan);
            setEditingLoan(null);
        } catch (error: any) {
            alert("Erro ao atualizar empréstimo");
        }
    };

    const handleDeleteLoan = useCallback(async (loanId: string) => {
        try {
            await deleteLoan(loanId);
        } catch (error: any) {
            alert("Erro ao deletar empréstimo");
        }
    }, [deleteLoan]);

    const handleRecordPayment = async (paymentData: Omit<Payment, 'id'>, loanId: string, isInterestOnlyPayment: boolean) => {
        try {
            const result = await processPayment({
                loanId,
                amount: paymentData.amount,
                method: paymentData.method,
                notes: paymentData.notes,
                isInterestOnly: isInterestOnlyPayment,
                clientId: paymentData.clientId
            });

            // Update loans and clients with results from backend
            await Promise.all([
                updateLoan(result.loan),
                updateClient(result.client)
            ]);

            setIsQuickPaymentModalOpen(false);
        } catch (error: any) {
            console.error("Error recording payment", error);
            alert("Erro ao registrar pagamento");
        }
    };

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
        return alerts.sort((a) => (a.type === 'danger' ? -1 : 1));
    }, [loansForView, clients]);

    const handleViewClient = (clientId: string) => {
        setSelectedClientId(clientId);
        setCurrentView('client-detail');
    };

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView loans={loansForView} clients={clients} payments={payments} onViewLoans={() => { setCurrentView('loans'); }} appName={appName} setAppName={setAppName} />;
            case 'clients':
                return <ClientsView clients={clients} onSelectClient={handleViewClient} onEditClient={setEditingClient} />;
            case 'client-detail':
                return selectedClient ? <ClientDetailView client={selectedClient} loans={loansForView.filter(l => l.clientId === selectedClient.id)} payments={payments.filter(p => p.clientId === selectedClient.id)} onRecordPayment={handleRecordPayment} onGenerateReceipt={handleGenerateReceipt} onEditClient={setEditingClient} onEditLoan={setEditingLoan} onDeletePayment={handleDeletePayment} /> : <div>Cliente não encontrado.</div>;
            case 'loans':
                return <LoansView loans={loansForView} clients={clients} onRecordPayment={handleRecordPayment} onEditLoan={setEditingLoan} />;
            case 'reports':
                return <ReportsView loans={loans} payments={payments} />;
            case 'settings':
                return <SettingsView settings={settings} onSave={setSettings} clients={clients} loans={loans} onImportClients={() => setIsImportClientsModalOpen(true)} onImportLoans={() => setIsImportLoansModalOpen(true)} />;
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
                    onLogout={logout}
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

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <MainApp />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;