


import React, { useState, useMemo } from 'react';
// Fix: Add .ts extension
import { Client } from '@/types.ts';
// Fix: Add .tsx extension
import Card from './ui/Card.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
import { format } from 'date-fns';

interface ClientsViewProps {
    clients: Client[];
    onSelectClient: (clientId: string) => void;
    onEditClient: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, onSelectClient, onEditClient }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.phone.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Clientes</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gerencie sua lista de clientes, seus scores e históricos de empréstimos.</p>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary bg-white dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400"
                        aria-label="Search clients"
                    />
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contato</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredClients.length > 0 ? (
                                filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100">{client.email}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${client.score >= 8 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : client.score >= 6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                {client.score.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                            <button onClick={() => onSelectClient(client.id)} className="text-brand-secondary hover:text-brand-primary">Ver Detalhes</button>
                                            <button onClick={() => onEditClient(client)} className="text-blue-600 hover:text-blue-800">Editar</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {searchTerm ? 'Nenhum cliente corresponde à busca.' : 'Nenhum cliente cadastrado.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ClientsView;