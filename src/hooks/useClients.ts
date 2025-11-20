import { useState, useCallback } from 'react';
import { Client } from '../types';
import { api } from '../services/api';

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.clients.list();
            setClients(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load clients');
            console.error('Error loading clients:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const addClient = useCallback(async (clientData: Omit<Client, 'id'>) => {
        setLoading(true);
        setError(null);
        try {
            const created = await api.clients.create(clientData);
            setClients(prev => [...prev, created]);
        } catch (err: any) {
            setError(err.message || 'Failed to add client');
            console.error('Error adding client:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateClient = useCallback(async (updatedClient: Client) => {
        setLoading(true);
        setError(null);
        try {
            const updated = await api.clients.update(updatedClient.id, updatedClient);
            setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
        } catch (err: any) {
            setError(err.message || 'Failed to update client');
            console.error('Error updating client:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const importClients = useCallback(async (importedClients: Omit<Client, 'id' | 'registrationDate' | 'score' | 'scoreHistory'>[]) => {
        setLoading(true);
        setError(null);
        try {
            const newClients = importedClients.map(clientData => ({
                ...clientData,
                registrationDate: new Date(),
                score: 10.0,
                scoreHistory: [{ date: new Date(), reason: 'Initial Score', delta: 10, scoreBefore: 0, scoreAfter: 10 }]
            }));

            const createdClients = await Promise.all(newClients.map(client => api.clients.create(client)));
            setClients(prev => [...prev, ...createdClients]);
            return createdClients.length;
        } catch (err: any) {
            setError(err.message || 'Failed to import clients');
            console.error('Error importing clients:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        clients,
        loading,
        error,
        loadClients,
        addClient,
        updateClient,
        importClients
    };
};
