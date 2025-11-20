


import React from 'react';
// Fix: Add .ts extension
import { Client, Loan, LoanType, Payment, paymentMethodUIMap } from '@/types.ts';
// Fix: Add .tsx extension
import Card from './ui/Card.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
import { format } from 'date-fns';
import { getPaymentReminderMessage, getReceiptMessage, openWhatsApp } from '@/utils/whatsapp';
// Fix: Add .tsx extension
import RecordPaymentModal from './RecordPaymentModal.tsx';
// Fix: Add .tsx extension
import InstallmentSchedule from './InstallmentSchedule.tsx';

interface ClientDetailViewProps {
    client: Client;
    loans: Loan[];
    payments: Payment[];
    onRecordPayment: (payment: Omit<Payment, 'id'>, loanId: string, isInterestOnly: boolean) => void;
    onGenerateReceipt: (paymentId: string) => void;
    onEditClient: (client: Client) => void;
    onEditLoan: (loan: Loan) => void;
    onDeletePayment: (paymentId: string) => void;
}

const LoanCard: React.FC<{
    loan: Loan;
    onRecordPayment: (payment: Omit<Payment, 'id'>, loanId: string, isInterestOnly: boolean) => void;
    onEditLoan: (loan: Loan) => void;
    client: Client;
}> = ({ loan, onRecordPayment, onEditLoan, client }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    const statusClasses: Record<string, string> = {
        active: 'border-l-4 border-status-active',
        paid: 'border-l-4 border-status-paid',
        renewed: 'border-l-4 border-status-renewed',
        overdue: 'border-l-4 border-status-overdue',
        'partially-paid': 'border-l-4 border-sky-500',
    };

    return (
        <Card className={`mb-4 ${statusClasses[loan.status] || 'border-l-4 border-gray-400'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg">{loan.type === LoanType.SINGLE ? 'Empréstimo - Parcela Única' : 'Empréstimo - Parcelado'}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Início em: {loan.startDate ? format(loan.startDate, 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setIsPaymentModalOpen(true)} disabled={loan.status === 'paid'}>
                        Receber
                    </Button>
                    <button onClick={() => onEditLoan(loan)} className="p-2 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-slate-700" aria-label="Editar Empréstimo">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                        onClick={() => openWhatsApp(client.phone, getPaymentReminderMessage(client, loan))}
                        className="p-2 text-green-600 hover:text-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-700"
                        title="Cobrar no WhatsApp"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                    </button>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <span className="block text-gray-500 dark:text-gray-400">Valor Principal</span>
                    <span className="font-semibold">{currencyFormatter.format(loan.principal)}</span>
                </div>
                <div>
                    <span className="block text-gray-500 dark:text-gray-400">Juros</span>
                    <span className="font-semibold">{loan.interestRate}%</span>
                </div>
                <div>
                    <span className="block text-gray-500 dark:text-gray-400">Saldo Devedor</span>
                    <span className="font-semibold">{currencyFormatter.format(loan.remainingBalance)}</span>
                </div>
                <div>
                    <span className="block text-gray-500 dark:text-gray-400">Vencimento</span>
                    <span className="font-semibold">{loan.dueDate ? format(loan.dueDate, 'dd/MM/yyyy') : 'N/A'}</span>
                </div>
            </div>

            {loan.type === LoanType.INSTALLMENTS && loan.paymentSchedule && (
                <InstallmentSchedule loan={loan} currencyFormatter={currencyFormatter} />
            )}

            {isPaymentModalOpen && (
                <RecordPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    loan={loan}
                    client={client}
                    onRecordPayment={(payment, loanId, isInterestOnly) => {
                        onRecordPayment(payment, loanId, isInterestOnly);
                        setIsPaymentModalOpen(false);
                    }}
                />
            )}
        </Card>
    );
};

const ClientDetailView: React.FC<ClientDetailViewProps> = ({ client, loans, payments, onRecordPayment, onGenerateReceipt, onEditClient, onEditLoan, onDeletePayment }) => {
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleWhatsAppClick = () => {
        const phoneNumber = client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phoneNumber}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{client.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cliente desde {client.registrationDate ? format(client.registrationDate, 'dd/MM/yyyy') : 'N/A'}</p>
                        </div>
                        <div className="text-sm dark:text-gray-300 space-y-1">
                            <p><strong>Email:</strong> {client.email}</p>
                            <div className="flex items-center gap-2">
                                <p><strong>Telefone:</strong> {client.phone}</p>
                                <button onClick={handleWhatsAppClick} title="Iniciar conversa no WhatsApp" className="text-green-500 hover:text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                </button>
                            </div>
                            {client.address && <p><strong>Endereço:</strong> {client.address}</p>}
                        </div>
                        <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                            <div className="text-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score de Confiança</span>
                                <p className={`text-4xl font-bold ${client.score >= 8 ? 'text-green-600' : client.score >= 6 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {client.score.toFixed(1)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => onEditClient(client)}>Editar Cliente</Button>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => openWhatsApp(client.phone, `Olá ${client.name}, tudo bem?`)}
                        >
                            WhatsApp
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <Card title="Empréstimos Ativos e Histórico">
                        {loans.length > 0 ? (
                            loans.map(loan => (
                                <LoanCard key={loan.id} loan={loan} onRecordPayment={onRecordPayment} onEditLoan={onEditLoan} client={client} />
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum empréstimo para este cliente.</p>
                        )}
                    </Card>

                    <Card title="Histórico de Pagamentos">
                        {payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Pago</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Método</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {payments.map(payment => (
                                            <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{payment.date ? format(payment.date, 'dd/MM/yyyy HH:mm') : 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-100">{currencyFormatter.format(payment.amount)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{paymentMethodUIMap[payment.method]}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <Button size="sm" variant="secondary" onClick={() => onGenerateReceipt(payment.id)}>
                                                        Comprovante
                                                    </Button>
                                                    <Button size="sm" variant="danger" onClick={() => onDeletePayment(payment.id)}>
                                                        Estornar
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum pagamento registrado para este cliente.</p>
                        )}
                    </Card>
                </div>

                <Card title="Histórico do Score">
                    <div className="overflow-y-auto max-h-96">
                        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                            {client.scoreHistory.slice().reverse().map((entry, index) => (
                                <li key={index} className="py-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{entry.reason}</p>
                                        <span className={`font-bold ${entry.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {entry.delta > 0 ? '+' : ''}{entry.delta.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                                        <span>{entry.date ? format(entry.date, 'dd/MM/yyyy HH:mm') : 'N/A'}</span>
                                        <span>{entry.scoreBefore.toFixed(1)} → {entry.scoreAfter.toFixed(1)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ClientDetailView;