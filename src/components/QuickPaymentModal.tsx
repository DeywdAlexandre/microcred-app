


import React, { useState, useMemo, useEffect } from 'react';
// Fix: Add .ts extension
import { Client, Loan, LoanType, Payment, PaymentMethod, paymentMethodUIMap } from '@/types.ts';
// Fix: Add .tsx extension
import Modal from './ui/Modal.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
import { format } from 'date-fns';

interface QuickPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRecordPayment: (payment: Omit<Payment, 'id'>, loanId: string, isInterestOnly: boolean) => void;
    clients: Client[];
    loans: Loan[];
}

const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({ isOpen, onClose, onRecordPayment, clients, loans }) => {
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedLoanId, setSelectedLoanId] = useState<string>('');
    
    const [amount, setAmount] = useState<number>(0);
    const [method, setMethod] = useState<PaymentMethod>('pix');
    const [notes, setNotes] = useState('');
    const [isInterestOnly, setIsInterestOnly] = useState(false);

    const clientLoans = useMemo(() => {
        if (!selectedClientId) return [];
        return loans.filter(l => l.clientId === selectedClientId && (l.status === 'active' || l.status === 'overdue' || l.status === 'renewed'));
    }, [loans, selectedClientId]);

    const selectedLoan = useMemo(() => {
        return loans.find(l => l.id === selectedLoanId) || null;
    }, [loans, selectedLoanId]);
    
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    const resetForm = () => {
        setSelectedClientId('');
        setSelectedLoanId('');
        setAmount(0);
        setMethod('pix');
        setNotes('');
        setIsInterestOnly(false);
    };
    
    useEffect(() => {
        if (!isOpen) {
           setTimeout(resetForm, 300); 
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan) return;
        onRecordPayment({
            clientId: selectedLoan.clientId,
            loanId: selectedLoan.id,
            date: new Date(),
            amount,
            method,
            notes,
        }, selectedLoan.id, isInterestOnly);
    };
    
    const baseInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100";
    const baseLabelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    const renderContent = () => {
        if (!selectedClientId) {
            return (
                <div>
                    <label htmlFor="client-select" className={baseLabelStyles}>Passo 1: Selecione o Cliente</label>
                    <select
                        id="client-select"
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className={`${baseInputStyles} bg-white dark:bg-slate-700`}
                    >
                        <option value="" disabled>Selecione...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if (!selectedLoanId) {
            return (
                <div>
                     <label htmlFor="loan-select" className={baseLabelStyles}>Passo 2: Selecione o Empréstimo</label>
                    <select
                        id="loan-select"
                        value={selectedLoanId}
                        onChange={e => setSelectedLoanId(e.target.value)}
                         className={`${baseInputStyles} bg-white dark:bg-slate-700`}
                    >
                        <option value="" disabled>Selecione...</option>
                        {clientLoans.length > 0 ? (
                           clientLoans.map(loan => (
                                <option key={loan.id} value={loan.id}>
                                    {`Saldo: ${currencyFormatter.format(loan.remainingBalance)} - Venc: ${loan.dueDate ? format(loan.dueDate, 'dd/MM/yy') : 'N/A'}`}
                                </option>
                            ))
                        ) : (
                            <option disabled>Nenhum empréstimo ativo para este cliente.</option>
                        )}
                    </select>
                     <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedClientId('')} className="mt-4">Voltar</Button>
                </div>
            );
        }
        
        if (selectedLoan) {
            const interestAmount = selectedLoan.principal * (selectedLoan.interestRate / 100);

            return (
                <form onSubmit={handleSubmit}>
                     <div className="mb-4 bg-blue-50 dark:bg-slate-700 p-4 rounded-md border border-blue-200 dark:border-slate-600 text-sm text-gray-800 dark:text-gray-200">
                        <p><strong>Saldo Restante:</strong> <span className="font-bold">{currencyFormatter.format(selectedLoan.remainingBalance)}</span></p>
                        <p><strong>Vencimento:</strong> {selectedLoan.dueDate ? format(selectedLoan.dueDate, 'dd/MM/yyyy') : 'N/A'}</p>
                     </div>
                    <div className="space-y-4">
                        <div>
                            <label className={baseLabelStyles}>Valor Recebido *</label>
                            <input type="number" step="0.01" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} required className={baseInputStyles} />
                        </div>
                        <div>
                            <label className={baseLabelStyles}>Método de Recebimento</label>
                            <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className={`${baseInputStyles} bg-white dark:bg-slate-700`}>
                                {/* Fix: Use Object.keys with type assertion for type-safe iteration */}
                                {(Object.keys(paymentMethodUIMap) as PaymentMethod[]).map((key) => (
                                    <option key={key} value={key}>{paymentMethodUIMap[key]}</option>
                                ))}
                            </select>
                        </div>
                        {selectedLoan.type === LoanType.SINGLE && (
                             <div className="flex items-center">
                                <input id="interestOnlyQuick" type="checkbox" checked={isInterestOnly} onChange={(e) => setIsInterestOnly(e.target.checked)} className="h-4 w-4 text-brand-secondary focus:ring-brand-primary border-gray-300 dark:border-slate-500 rounded bg-gray-100 dark:bg-slate-600" />
                                <label htmlFor="interestOnlyQuick" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Recebimento apenas dos juros ({currencyFormatter.format(interestAmount)})</label>
                            </div>
                        )}
                        <div>
                            <label className={baseLabelStyles}>Observações</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={baseInputStyles} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                         <Button type="button" variant="secondary" onClick={() => setSelectedLoanId('')}>Voltar</Button>
                        <div className="space-x-3">
                            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Registrar</Button>
                        </div>
                    </div>
                </form>
            );
        }
        
        return null;
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Recebimento Rápido">
           {renderContent()}
        </Modal>
    );
};

export default QuickPaymentModal;