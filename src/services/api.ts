import { Client, Loan, Payment } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8080');
const API_URL = `${API_BASE_URL}/api`;

function deserializeDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
        // Simple ISO date check
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
            return new Date(obj);
        }
        return obj;
    }
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            return obj.map(deserializeDates);
        }
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = deserializeDates(obj[key]);
        }
        return newObj;
    }
    return obj;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    // Add Authorization header if token exists
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options?.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        // If 401, clear token and redirect to login
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    const data = await response.json();
    return deserializeDates(data) as T;
}

export const api = {
    clients: {
        list: () => fetchJson<Client[]>(`${API_URL}/clients`),
        create: (data: Partial<Client>) => fetchJson<Client>(`${API_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Partial<Client>) => fetchJson<Client>(`${API_URL}/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
    },
    loans: {
        list: () => fetchJson<Loan[]>(`${API_URL}/loans`),
        create: (data: Partial<Loan>) => fetchJson<Loan>(`${API_URL}/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Partial<Loan>) => fetchJson<Loan>(`${API_URL}/loans/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        remove: (id: string) => fetchJson<void>(`${API_URL}/loans/${id}`, { method: 'DELETE' }),
    },
    payments: {
        list: () => fetchJson<Payment[]>(`${API_URL}/payments`),
        create: (data: Partial<Payment>) => fetchJson<Payment>(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        // Process payment with business logic (updates loan, client score, etc.)
        process: (data: { loanId: string; amount: number; method: string; notes?: string; isInterestOnly?: boolean; clientId?: string }) =>
            fetchJson<{ payment: Payment; loan: Loan; client: Client }>(`${API_URL}/payments/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
    }
};
