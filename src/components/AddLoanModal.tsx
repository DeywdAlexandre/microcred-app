


import React, { useState, useEffect, useMemo } from 'react';
// Fix: Add .ts extension
import { Client, Loan, LoanType, Installment, Settings } from '@/types.ts';
// Fix: Add .tsx extension
import Modal from './ui/Modal.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
import { addDays, addMonths } from 'date-fns';

interface AddLoanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddLoan: (loan: Omit<Loan, 'id'>) => void;
    clients: Client[];
    settings: Settings;
}

const AddLoanModal: React.FC<AddLoanModalProps> = ({ isOpen, onClose, onAddLoan, clients, settings }) => {
    const [clientId, setClientId] = useState('');
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [type, setType] = useState<LoanType>(LoanType.SINGLE);
    const [installments, setInstallments] = useState('');
    const [notes, setNotes] = useState('');
    const [termDays, setTermDays] = useState(''); 

    const initializeForm = () => {
        setClientId(clients.length > 0 ? clients[0].id : '');
        setPrincipal('');
        setInterestRate(settings.defaultInterestRate.toString());
        setTermDays(settings.defaultSingleLoanTermDays.toString());
        setType(LoanType.SINGLE);
        setInstallments('');
        setNotes('');
    };

    useEffect(() => {
        if (isOpen) {
            initializeForm();
        }
    }, [isOpen, settings, clients]);

    const projection = useMemo(() => {
        const p = parseFloat(principal);
        const r = parseFloat(interestRate) / 100; 
        const n = parseInt(installments, 10);

        if (type !== LoanType.INSTALLMENTS || !p || p <= 0 || !r || r < 0 || !n || n < 1) {
            return null;
        }

        const monthlyRate = r;

        if (monthlyRate === 0) { 
            const monthlyPayment = p / n;
            return { monthlyPayment, totalPayable: p, totalInterest: 0 };
        }

        const numerator = monthlyRate * Math.pow(1 + monthlyRate, n);
        const denominator = Math.pow(1 + monthlyRate, n) - 1;
        
        if (denominator === 0) return null;

        const monthlyPayment = p * (numerator / denominator);
        const totalPayable = monthlyPayment * n;
        const totalInterest = totalPayable - p;

        return {
            monthlyPayment,
            totalPayable,
            totalInterest,
        };
    }, [principal, interestRate, installments, type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericPrincipal = parseFloat(principal);
        const numericInterest = parseFloat(interestRate);
        const numericInstallments = parseInt(installments, 10);
        const numericTermDays = parseInt(termDays, 10);

        if (!clientId || !numericPrincipal || numericPrincipal <= 0 || numericInterest < 0) {
            alert('Por favor, preencha todos os campos obrigatórios com valores válidos.');
            return;
        }

        const startDate = new Date();
        let dueDate: Date;
        let remainingBalance: number;
        let paymentSchedule: Installment[] | undefined = undefined;

        if (type === LoanType.SINGLE) {
            if (!numericTermDays || numericTermDays <= 0) {
                 alert('Por favor, insira um prazo em dias válido.');
                 return;
            }
            dueDate = addDays(startDate, numericTermDays);
            remainingBalance = numericPrincipal * (1 + (numericInterest / 100));
        } else {
             if (!numericInstallments || numericInstallments < 1) {
                 alert('Por favor, insira um número de parcelas válido.');
                 return;
            }
            if (!projection) {
                 alert('Não foi possível calcular a projeção do empréstimo parcelado. Verifique os valores inseridos.');
                 return;
            }
            
            paymentSchedule = [];
            let currentBalance = numericPrincipal;
            const monthlyRate = numericInterest / 100;

            for (let i = 1; i <= numericInstallments; i++) {
                const interestForMonth = currentBalance * monthlyRate;
                const principalForMonth = projection.monthlyPayment - interestForMonth;
                currentBalance -= principalForMonth;

                paymentSchedule.push({
                    installmentNumber: i,
                    dueDate: addMonths(startDate, i),
                    amount: projection.monthlyPayment,
                    principalAmount: principalForMonth,
                    interestAmount: interestForMonth,
                    remainingBalanceAfterPayment: currentBalance < 0.01 ? 0 : currentBalance,
                    status: 'pending',
                    paidAmount: 0,
                    lateFee: 0,
                });
            }
            
            const nextPending = paymentSchedule.find(p => p.status === 'pending');
            dueDate = nextPending ? nextPending.dueDate! : paymentSchedule[paymentSchedule.length - 1].dueDate!;
            remainingBalance = projection.totalPayable;
        }

        onAddLoan({
            clientId,
            principal: numericPrincipal,
            interestRate: numericInterest,
            type,
            paymentSchedule: paymentSchedule,
            startDate,
            dueDate,
            remainingBalance,
            status: 'active',
            paymentHistory: [],
            renewalHistory: [],
            notes,
        });
        onClose();
    };
    
    const baseInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100";
    const baseLabelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Empréstimo">
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className={baseLabelStyles}>Cliente *</label>
                        <select value={clientId} onChange={e => setClientId(e.target.value)} required className={`${baseInputStyles} bg-white dark:bg-slate-700`}>
                           <option value="" disabled>Selecione um cliente</option>
                           {clients.map(client => (
                               <option key={client.id} value={client.id}>{client.name}</option>
                           ))}
                        </select>
                    </div>
                     <div>
                        <label className={baseLabelStyles}>Valor Principal *</label>
                        <input type="number" step="0.01" placeholder="0,00" value={principal} onChange={e => setPrincipal(e.target.value)} required className={baseInputStyles} />
                    </div>
                     <div>
                        <label className={baseLabelStyles}>Juros Mensais (%) *</label>
                        <input type="number" step="0.1" placeholder="0.0" value={interestRate} onChange={e => setInterestRate(e.target.value)} required className={baseInputStyles} />
                    </div>
                     <div>
                        <label className={baseLabelStyles}>Tipo de Empréstimo</label>
                         <select value={type} onChange={e => setType(e.target.value as LoanType)} className={`${baseInputStyles} bg-white dark:bg-slate-700`}>
                            <option value={LoanType.SINGLE}>Parcela Única</option>
                            <option value={LoanType.INSTALLMENTS}>Parcelado</option>
                        </select>
                    </div>

                    {type === LoanType.SINGLE && (
                         <div>
                            <label className={baseLabelStyles}>Prazo (dias) *</label>
                            <input type="number" value={termDays} onChange={e => setTermDays(e.target.value)} required min="1" className={baseInputStyles} />
                        </div>
                    )}

                    {type === LoanType.INSTALLMENTS && (
                        <div>
                            <label className={baseLabelStyles}>Número de Parcelas *</label>
                            <input type="number" placeholder="Ex: 12" value={installments} onChange={e => setInstallments(e.target.value)} required min="1" className={baseInputStyles} />
                        </div>
                    )}

                    {type === LoanType.INSTALLMENTS && projection && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg border border-blue-200 dark:border-slate-600">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Projeção do Empréstimo</h4>
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Valor da Parcela:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{currencyFormatter.format(projection.monthlyPayment)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total de Juros:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{currencyFormatter.format(projection.totalInterest)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total a Pagar:</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{currencyFormatter.format(projection.totalPayable)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className={baseLabelStyles}>Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={baseInputStyles} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Adicionar Empréstimo</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddLoanModal;