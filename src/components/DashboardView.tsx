import React, { useState, useEffect } from 'react';
// Fix: Add .ts extension
import { Loan, Client, Payment, LoanStatus } from '@/types';
// Fix: Add .tsx extension
import Card from './ui/Card.tsx';
import { format, isSameMonth, isSameYear, differenceInDays, isBefore, startOfDay, addDays } from 'date-fns';
import { getPaymentReminderMessage, openWhatsApp } from '@/utils/whatsapp';

interface DashboardViewProps {
    loans: Loan[];
    clients: Client[];
    payments: Payment[];
    onViewLoans: (filter: LoanStatus) => void;
    appName: string;
    setAppName: (name: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`p-5 rounded-xl shadow-lg flex items-center justify-between text-white ${color}`}>
        <div>
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
        </div>
    </div>
);


const DashboardView: React.FC<DashboardViewProps> = ({ loans, clients, payments, onViewLoans, appName, setAppName }) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(appName);

    useEffect(() => {
        setCurrentTitle(appName);
    }, [appName]);

    const handleTitleBlur = () => {
        setAppName(currentTitle || "MicroCred");
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleTitleBlur();
        } else if (e.key === 'Escape') {
            setCurrentTitle(appName);
            setIsEditingTitle(false);
        }
    };

    const totalLoaned = loans.reduce((sum, loan) => sum + loan.principal, 0);

    const totalLoanedThisMonth = loans
        .filter(loan => loan.startDate && isSameMonth(loan.startDate, new Date()) && isSameYear(loan.startDate, new Date()))
        .reduce((sum, loan) => sum + loan.principal, 0);

    const expectedInterest = loans
        .filter(l => l.status !== 'paid')
        .reduce((sum, loan) => sum + (loan.principal * (loan.interestRate / 100)), 0);

    const totalInterestReceived = payments
        .filter(p => p.isInterestOnly)
        .reduce((sum, payment) => sum + payment.amount, 0);

    const interestReceivedThisMonth = payments
        .filter(p => {
            const now = new Date();
            return p.isInterestOnly && p.date && isSameMonth(p.date, now) && isSameYear(p.date, now);
        })
        .reduce((sum, payment) => sum + payment.amount, 0);


    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    const now = startOfDay(new Date());

    const upcomingLoans = loans.filter(loan => {
        if (loan.status === 'paid' || !loan.dueDate) return false;
        const dueDate = startOfDay(loan.dueDate);
        const daysUntilDue = differenceInDays(dueDate, now);
        return daysUntilDue >= 0 && daysUntilDue <= 3;
    });

    const overdueLoans = loans.filter(loan => {
        if (loan.status === 'paid' || !loan.dueDate) return false;
        const dueDate = startOfDay(loan.dueDate);
        return isBefore(dueDate, now);
    }).map(loan => ({
        ...loan,
        daysOverdue: loan.dueDate ? differenceInDays(now, startOfDay(loan.dueDate)) : 0
    })).sort((a, b) => b.daysOverdue - a.daysOverdue);


    return (
        <div>
            <div className="flex justify-center items-center mb-6 group relative">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="text-3xl font-bold bg-transparent text-center border-b-2 border-brand-secondary focus:outline-none dark:text-gray-100 p-0"
                        autoFocus
                    />
                ) : (
                    <h1 onClick={() => setIsEditingTitle(true)} className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center cursor-pointer py-1">
                        {appName}
                    </h1>
                )}
                {!isEditingTitle && (
                    <button onClick={() => setIsEditingTitle(true)} className="ml-2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-full" aria-label="Editar nome da aplicação">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <StatCard title="Total Emprestado (Geral)" value={currencyFormatter.format(totalLoaned)} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="bg-stat-indigo" />
                <StatCard title="Juros Recebidos (Geral)" value={currencyFormatter.format(totalInterestReceived)} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="bg-stat-violet" />
                <StatCard title="Total Emprestado (Mês)" value={currencyFormatter.format(totalLoanedThisMonth)} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="bg-stat-emerald" />
                <StatCard title="Juros Recebidos (Mês)" value={currencyFormatter.format(interestReceivedThisMonth)} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" color="bg-stat-sky" />
                <StatCard title="Juro Esperado (Projeção)" value={currencyFormatter.format(expectedInterest)} icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" color="bg-stat-amber" />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div onClick={() => onViewLoans('active')} className="cursor-pointer hover:shadow-lg transition-shadow duration-200 rounded-xl">
                    <Card title="Próximos Vencimentos (3 dias)">
                        {upcomingLoans.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                                {upcomingLoans.map(loan => {
                                    const client = clients.find(c => c.id === loan.clientId);
                                    return (
                                        <li key={loan.id} className="py-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">{client?.name || 'Cliente Desconhecido'}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Vence em: {loan.dueDate ? format(new Date(loan.dueDate), 'dd/MM/yyyy') : 'N/A'}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="font-bold text-red-600 dark:text-red-400">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loan.remainingBalance)}
                                                    </span>
                                                    {client && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent Card onClick from firing
                                                                openWhatsApp(client.phone, getPaymentReminderMessage(client, loan));
                                                            }}
                                                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                                            title="Enviar cobrança via WhatsApp"
                                                        >
                                                            <span>WhatsApp</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>    </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum vencimento para os próximos 3 dias. Bom trabalho!</p>
                        )}
                    </Card>
                </div>

                <div onClick={() => onViewLoans('overdue')} className="cursor-pointer hover:shadow-lg transition-shadow duration-200 rounded-xl">
                    <Card title="Empréstimos em Atraso">
                        {overdueLoans.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                                {overdueLoans.map(loan => {
                                    const client = clients.find(c => c.id === loan.clientId);
                                    return (
                                        <li key={loan.id} className="py-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">{client?.name || 'N/A'}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{currencyFormatter.format(loan.remainingBalance)}</p>
                                                    <p className="text-xs text-red-500 dark:text-red-400 font-semibold">
                                                        {loan.daysOverdue} {loan.daysOverdue === 1 ? 'dia atrasado' : 'dias atrasado'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Venceu: {loan.dueDate ? format(new Date(loan.dueDate), 'dd/MM/yyyy') : 'N/A'}
                                                    </span>
                                                    {client && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openWhatsApp(client.phone, getPaymentReminderMessage(client, loan));
                                                            }}
                                                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                                            title="Cobrar via WhatsApp"
                                                        >
                                                            <span>Cobrar</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Todos os empréstimos estão em dia. Ótimo!</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;