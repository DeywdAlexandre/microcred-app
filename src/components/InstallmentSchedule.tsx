


import React from 'react';
// Fix: Add .ts extension
import { Loan } from '@/types.ts';
import { format } from 'date-fns';

interface InstallmentScheduleProps {
    loan: Loan;
    currencyFormatter: Intl.NumberFormat;
}

const InstallmentSchedule: React.FC<InstallmentScheduleProps> = ({ loan, currencyFormatter }) => {
    if (!loan.paymentSchedule) return null;

    const statusClasses: Record<string, string> = {
        paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'partially-paid': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        pending: 'bg-gray-100 text-gray-800 dark:bg-slate-600 dark:text-gray-300',
    };
    
    return (
        <div className="mt-6">
            <h5 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Plano de Pagamento</h5>
            <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vencimento</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor Total</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Principal</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Juros</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saldo Devedor</th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                        {loan.paymentSchedule.map(inst => (
                            <tr key={inst.installmentNumber} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{inst.installmentNumber}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{inst.dueDate ? format(inst.dueDate, 'dd/MM/yyyy') : 'N/A'}</td>
                                <td className="px-4 py-2 whitespace-nowrap font-semibold">{currencyFormatter.format(inst.amount)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{currencyFormatter.format(inst.principalAmount)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{currencyFormatter.format(inst.interestAmount)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{currencyFormatter.format(inst.remainingBalanceAfterPayment)}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[inst.status]}`}>
                                        {inst.status === 'paid' ? 'Pago' : inst.status === 'partially-paid' ? 'Parcial' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstallmentSchedule;