import { useState, useCallback } from 'react';
import { Payment, Loan, Client } from '../types';
import { api } from '../services/api';

interface ProcessPaymentData {
    loanId: string;
    amount: number;
    method: string;
    notes?: string;
    isInterestOnly?: boolean;
    clientId?: string;
}

interface ProcessPaymentResult {
    payment: Payment;
    loan: Loan;
    client: Client;
}

export const usePayments = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.payments.list();
            setPayments(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load payments');
            console.error('Error loading payments:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const processPayment = useCallback(async (data: ProcessPaymentData): Promise<ProcessPaymentResult> => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.payments.process(data);
            setPayments(prev => [...prev, result.payment]);
            return result;
        } catch (err: any) {
            setError(err.message || 'Failed to process payment');
            console.error('Error processing payment:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        payments,
        loading,
        error,
        loadPayments,
        processPayment
    };
};
