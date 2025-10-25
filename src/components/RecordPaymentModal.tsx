import React, { useState, useEffect, useMemo } from 'react';
// Fix: Add .ts extension
import { Client, Loan, LoanType, Payment, PaymentMethod, paymentMethodUIMap } from '@/types.ts';
// Fix: Add .tsx extension
import Modal from './ui/Modal.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
import { format } from 'date-fns';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    loan: Loan;
    client: Client;
    onRecordPayment: (payment: Omit<Payment, 'id'>, loanId: string, isInterestOnly: boolean) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, loan, client, onRecordPayment }) => {
    const [amount, setAmount] = useState<string>('');
    const [method, setMethod] = useState<PaymentMethod>('pix');
    const [notes, setNotes] = useState('');
    const [isInterestOnly, setIsInterestOnly] = useState(false);

    const nextInstallment = useMemo(() => {
        if (loan.type !== LoanType.INSTALLMENTS || !loan.paymentSchedule) return null;
        return loan.paymentSchedule.find(p => p.status === 'pending' || p.status === 'partially-paid') || null;
    }, [loan]);

    useEffect(() => {
        if (isOpen) {
            setMethod('pix');
            setNotes('');
            setIsInterestOnly(false);
            if (nextInstallment) {
                const remainingAmount = (nextInstallment.amount + nextInstallment.lateFee) - nextInstallment.paidAmount;
                setAmount(remainingAmount.toFixed(2));
            } else {
                setAmount('');
            }
        }
    }, [isOpen, nextInstallment]);

    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const interestAmount = loan.principal * (loan.interestRate / 100);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert("Por favor, insira um valor de pagamento válido.");
            return;
        }
        onRecordPayment({
            clientId: client.id,
            loanId: loan.id,
            date: new Date(),
            amount: numericAmount,
            method,
            notes,
        }, loan.id, isInterestOnly);
    };
    
    const baseInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100";
    const baseLabelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300";


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Recebimento para ${client.name}`}>
            <div className="mb-4 bg-blue-50 dark:bg-slate-700 p-4 rounded-md text-sm text-gray-800 dark:text-gray-200">
                <p><strong>Empréstimo:</strong> {currencyFormatter.format(loan.principal)} @ {loan.interestRate}%</p>
                <p><strong>Saldo Devedor Total:</strong> <span className="font-bold">{currencyFormatter.format(loan.remainingBalance)}</span></p>
                 {nextInstallment ? (
                    <div className="mt-2 border-t pt-2 border-blue-200 dark:border-slate-600">
                        <p><strong>Próxima Parcela ({nextInstallment.installmentNumber}/{loan.paymentSchedule?.length}):</strong> {currencyFormatter.format(nextInstallment.amount)}</p>
                        <p><strong>Vencimento:</strong> {nextInstallment.dueDate ? format(nextInstallment.dueDate, 'dd/MM/yyyy') : 'N/A'}</p>
                         {nextInstallment.lateFee > 0 && <p className="text-red-600 dark:text-red-400"><strong>Multa por Atraso:</strong> {currencyFormatter.format(nextInstallment.lateFee)}</p>}
                        {nextInstallment.paidAmount > 0 && <p className="text-green-600 dark:text-green-400"><strong>Valor já Pago:</strong> {currencyFormatter.format(nextInstallment.paidAmount)}</p>}
                    </div>
                ) : (
                     <p><strong>Vencimento:</strong> {loan.dueDate ? format(loan.dueDate, 'dd/MM/yyyy') : 'N/A'}</p>
                )}
                {loan.type === LoanType.SINGLE && <p><strong>Juros do período:</strong> {currencyFormatter.format(interestAmount)}</p>}
            </div>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className={baseLabelStyles}>Valor Recebido *</label>
                        <input type="number" step="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required className={baseInputStyles} />
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
                    {loan.type === LoanType.SINGLE && (
                         <div className="flex items-center">
                            <input
                                id="interestOnly"
                                name="interestOnly"
                                type="checkbox"
                                checked={isInterestOnly}
                                onChange={(e) => setIsInterestOnly(e.target.checked)}
                                className="h-4 w-4 text-brand-secondary focus:ring-brand-primary border-gray-300 dark:border-slate-500 rounded bg-gray-100 dark:bg-slate-600"
                            />
                            <label htmlFor="interestOnly" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Recebimento apenas dos juros (renovar empréstimo)
                            </label>
                        </div>
                    )}
                     <div>
                        <label className={baseLabelStyles}>Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={baseInputStyles} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Registrar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default RecordPaymentModal;