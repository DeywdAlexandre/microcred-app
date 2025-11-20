


import React, { useState, useMemo, useEffect } from 'react';
// Fix: Add .ts extension
import { Client, Loan, LoanStatus, loanStatusUIMap, LoanType, loanTypeUIMap } from '@/types.ts';
// Fix: Add .tsx extension
import Card from './ui/Card.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
import { format, isBefore, startOfDay } from 'date-fns';
import { getPaymentReminderMessage, openWhatsApp } from '@/utils/whatsapp';
// Fix: Add .tsx extension
import RecordPaymentModal from './RecordPaymentModal.tsx';

interface LoansViewProps {
    loans: Loan[];
    clients: Client[];
    // Fix: Add .ts extension to inline import() type
    onRecordPayment: (payment: Omit<import('@/types.ts').Payment, 'id'>, loanId: string, isInterestOnly: boolean) => void;
    onEditLoan: (loan: Loan) => void;
    isEmbedded?: boolean;
    initialFilter?: LoanStatus | 'all';
}

const statusColors: Record<LoanStatus, string> = {
    active: 'bg-status-active/20 text-status-active',
    paid: 'bg-status-paid/20 text-status-paid',
    renewed: 'bg-status-renewed/20 text-status-renewed',
    overdue: 'bg-status-overdue/20 text-status-overdue',
    'partially-paid': 'bg-sky-500/20 text-sky-600',
};

const LoansView: React.FC<LoansViewProps> = ({ loans, clients, onRecordPayment, onEditLoan, isEmbedded = false, initialFilter = 'all' }) => {
    const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
    const [filter, setFilter] = useState<LoanStatus | 'all'>(initialFilter);

    useEffect(() => {
        setFilter(initialFilter);
    }, [initialFilter]);

    const clientMap = useMemo(() => {
        return clients.reduce((acc, client) => {
            acc[client.id] = client;
            return acc;
        }, {} as Record<string, Client>);
    }, [clients]);

    const filteredLoans = useMemo(() => {
        if (filter === 'all') return loans;
        return loans.filter(loan => loan.status === filter);
    }, [loans, filter]);

    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    // Fix: Add .ts extension to inline import() type
    const handleRecordPaymentSubmit = (payment: Omit<import('@/types.ts').Payment, 'id'>, loanId: string, isInterestOnly: boolean) => {
        onRecordPayment(payment, loanId, isInterestOnly);
        setSelectedLoanForPayment(null);
    }

    return (
        <Card>
            <div className="flex justify-between items-start mb-6">
                {!isEmbedded && (
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Empréstimos</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Acompanhe todos os empréstimos do sistema.</p>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {(['all', ...Object.keys(loanStatusUIMap)] as ('all' | LoanStatus)[]).map(statusKey => (
                    <button
                        key={statusKey}
                        onClick={() => setFilter(statusKey)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === statusKey ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300'}`}
                    >
                        {statusKey === 'all' ? 'Todos' : loanStatusUIMap[statusKey as LoanStatus]}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            {!isEmbedded && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Principal</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saldo Restante</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vencimento</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredLoans.length > 0 ? (
                            filteredLoans.map(loan => {
                                let dueDateContent;
                                if (loan.status === 'paid') {
                                    dueDateContent = <span className="text-gray-400">-</span>;
                                } else if (loan.type === LoanType.INSTALLMENTS && loan.paymentSchedule && loan.dueDate) {
                                    const nextInstallment = loan.paymentSchedule.find(p => p.status === 'pending' || p.status === 'partially-paid');
                                    const totalCount = loan.paymentSchedule.length;
                                    dueDateContent = (
                                        <div>
                                            <div className="font-medium text-gray-700 dark:text-gray-300">{format(loan.dueDate, 'dd/MM/yyyy')}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {`Parcela ${nextInstallment?.installmentNumber || totalCount}/${totalCount}`}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    dueDateContent = loan.dueDate ? format(loan.dueDate, 'dd/MM/yyyy') : 'N/A';
                                }
                                const client = clientMap[loan.clientId];

                                return (
                                    <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        {!isEmbedded && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {clientMap[loan.clientId]?.name || 'N/A'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{currencyFormatter.format(loan.principal)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-100">{currencyFormatter.format(loan.remainingBalance)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dueDateContent}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[loan.status]}`}>
                                                {loanStatusUIMap[loan.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            <div className="flex gap-2">
                                                <button onClick={() => onEditLoan(loan)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Editar</button>
                                                <button onClick={() => setSelectedLoanForPayment(loan)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" disabled={loan.status === 'paid'}>Pagar</button>
                                                {client && client.phone && (
                                                    <button
                                                        onClick={() => openWhatsApp(client.phone, getPaymentReminderMessage(client, loan))}
                                                        className="text-green-500 hover:text-green-700"
                                                        title="Enviar WhatsApp"
                                                    >
                                                        WhatsApp
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={isEmbedded ? 5 : 6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Nenhum empréstimo encontrado para este filtro.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLoanForPayment && (
                <RecordPaymentModal
                    isOpen={!!selectedLoanForPayment}
                    onClose={() => setSelectedLoanForPayment(null)}
                    loan={selectedLoanForPayment}
                    client={clientMap[selectedLoanForPayment.clientId]}
                    onRecordPayment={handleRecordPaymentSubmit}
                />
            )}
        </Card>
    );
};

export default LoansView;