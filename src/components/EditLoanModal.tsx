import React, { useState, useEffect } from 'react';
// Fix: Add .ts extension
import { Loan, LoanType } from '@/types.ts';
// Fix: Add .tsx extension
import Modal from './ui/Modal.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
import { format, parseISO } from 'date-fns';

interface EditLoanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateLoan: (loan: Loan) => void;
    onDeleteLoan: (loanId: string) => void;
    loan: Loan;
}

const EditLoanModal: React.FC<EditLoanModalProps> = ({ isOpen, onClose, onUpdateLoan, loan, onDeleteLoan }) => {
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        if (loan) {
            setNotes(loan.notes || '');
            if (loan.type === LoanType.SINGLE && loan.dueDate) {
                setDueDate(format(loan.dueDate, 'yyyy-MM-dd'));
            }
        }
    }, [loan]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let updatedLoan = { ...loan, notes };
        
        if (loan.type === LoanType.SINGLE && dueDate) {
            const newDueDate = parseISO(dueDate);
            updatedLoan.dueDate = newDueDate;
        }

        onUpdateLoan(updatedLoan);
    };

    const handleDelete = () => {
        const firstConfirm = window.confirm("Tem certeza que deseja excluir este empréstimo?");
        if (firstConfirm) {
            const secondConfirm = window.confirm("CONFIRMAÇÃO FINAL: Este empréstimo será permanentemente removido. Esta ação não pode ser desfeita.");
            if (secondConfirm) {
                onDeleteLoan(loan.id);
            }
        }
    };

    const baseInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100 disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-600";
    const baseLabelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Empréstimo ID: ${loan.id}`}>
             <div className="mb-4 bg-blue-50 dark:bg-slate-700 p-4 rounded-md text-sm text-gray-800 dark:text-gray-200">
                <p><strong>Valor Principal:</strong> {currencyFormatter.format(loan.principal)}</p>
                <p><strong>Juros:</strong> {loan.interestRate}%</p>
                <p><strong>Tipo:</strong> {loan.type === LoanType.SINGLE ? 'Parcela Única' : 'Parcelado'}</p>
             </div>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                     {loan.type === LoanType.SINGLE && (
                        <div>
                             <label className={baseLabelStyles}>Data de Vencimento</label>
                             <input 
                                type="date" 
                                value={dueDate} 
                                onChange={e => setDueDate(e.target.value)} 
                                required 
                                className={baseInputStyles} 
                             />
                        </div>
                    )}
                    {loan.type === LoanType.INSTALLMENTS && (
                         <div>
                            <label className={baseLabelStyles}>Data de Vencimento</label>
                            <input 
                                type="text" 
                                value="Vencimento das parcelas não pode ser alterado aqui." 
                                disabled
                                className={baseInputStyles} 
                             />
                         </div>
                    )}
                     <div>
                        <label className={baseLabelStyles}>Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={baseInputStyles} />
                    </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                    <div>
                        {loan.paymentHistory.length === 0 && (
                            <Button type="button" variant="danger" onClick={handleDelete}>
                                Excluir Empréstimo
                            </Button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Salvar Alterações</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default EditLoanModal;