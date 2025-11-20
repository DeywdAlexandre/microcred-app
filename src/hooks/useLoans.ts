import { useState, useCallback } from 'react';
import { Loan } from '../types';
import { api } from '../services/api';

export const useLoans = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLoans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.loans.list();
            setLoans(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load loans');
            console.error('Error loading loans:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const addLoan = useCallback(async (loanData: Omit<Loan, 'id'>) => {
        setLoading(true);
        setError(null);
        try {
            const created = await api.loans.create(loanData);
            setLoans(prev => [...prev, created]);
        } catch (err: any) {
            setError(err.message || 'Failed to add loan');
            console.error('Error adding loan:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateLoan = useCallback(async (updatedLoan: Loan) => {
        setLoading(true);
        setError(null);
        try {
            const updated = await api.loans.update(updatedLoan.id, updatedLoan);
            setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
        } catch (err: any) {
            setError(err.message || 'Failed to update loan');
            console.error('Error updating loan:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteLoan = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.loans.remove(id);
            setLoans(prev => prev.filter(l => l.id !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete loan');
            console.error('Error deleting loan:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const importLoans = useCallback(async (importedData: Record<string, any>[]) => {
        setLoading(true);
        setError(null);
        try {
            const createdLoans = await Promise.all(importedData.map(data => api.loans.create(data)));
            setLoans(prev => [...prev, ...createdLoans]);
            return createdLoans.length;
        } catch (err: any) {
            setError(err.message || 'Failed to import loans');
            console.error('Error importing loans:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loans,
        loading,
        error,
        loadLoans,
        addLoan,
        updateLoan,
        deleteLoan,
        importLoans
    };
};
