import { Client, Loan, Payment } from '@/types';
import { format } from 'date-fns';

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const getPaymentReminderMessage = (client: Client, loan: Loan): string => {
    const dueDate = loan.dueDate ? format(new Date(loan.dueDate), 'dd/MM/yyyy') : 'Data desconhecida';
    const amount = formatCurrency(loan.remainingBalance);
    
    return `Olá *${client.name}*, lembramos que seu empréstimo no valor de *${amount}* venceu em *${dueDate}*. Por favor, entre em contato para regularizar.`;
};

export const getReceiptMessage = (client: Client, payment: Payment): string => {
    const date = payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : 'Data desconhecida';
    const amount = formatCurrency(payment.amount);
    
    return `Olá *${client.name}*, confirmamos o recebimento do pagamento de *${amount}* em *${date}*. Obrigado!`;
};

export const openWhatsApp = (phone: string, message: string) => {
    if (!phone) {
        alert('Cliente sem telefone cadastrado.');
        return;
    }
    
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming BR +55)
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${fullPhone}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
};
