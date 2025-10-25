


import React, { useState, useCallback } from 'react';
// Fix: Add .ts extension
import { Client } from '@/types.ts';
// Fix: Add .tsx extension
import Modal from './ui/Modal.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
// Fix: Add .ts extension
import { parseCSV } from '@/utils/csv.ts';

interface ImportClientsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (clients: Omit<Client, 'id' | 'registrationDate' | 'score' | 'scoreHistory'>[]) => void;
}

const REQUIRED_HEADERS = ['name', 'email', 'phone'];
const TEMPLATE_CSV = '"name","email","phone","address","notes"\n"Exemplo Nome","exemplo@email.com","555-0001","Rua Exemplo, 123","Cliente antigo"';


const ImportClientsModal: React.FC<ImportClientsModalProps> = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
    const [error, setError] = useState<string>('');

    const resetState = () => {
        setFile(null);
        setParsedData([]);
        setError('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        resetState();
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv') {
                setError('Por favor, selecione um arquivo no formato CSV.');
                return;
            }
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };
    
    const parseFile = (fileToParse: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const data = parseCSV(text);
                
                if (data.length === 0) {
                    setError('O arquivo está vazio ou em um formato inválido.');
                    return;
                }
                
                const headers = Object.keys(data[0]);
                const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    setError(`O arquivo não contém as colunas obrigatórias: ${missingHeaders.join(', ')}.`);
                    return;
                }
                
                setParsedData(data);
            } catch (err) {
                setError('Ocorreu um erro ao processar o arquivo. Verifique o formato.');
                console.error(err);
            }
        };
        reader.onerror = () => setError('Não foi possível ler o arquivo.');
        reader.readAsText(fileToParse);
    };

    const handleSubmit = () => {
        if (parsedData.length > 0 && !error) {
            const clientsToImport = parsedData.map(row => ({
                name: row.name,
                email: row.email,
                phone: row.phone,
                address: row.address || '',
                notes: row.notes || '',
            }));
            onImport(clientsToImport);
            handleClose();
        }
    };
    
    const handleDownloadTemplate = () => {
        const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_clientes.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Clientes de CSV">
            <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-slate-700/50 rounded-lg border border-blue-200 dark:border-slate-600">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Instruções</h4>
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>O arquivo deve estar no formato CSV.</li>
                        <li>A primeira linha deve ser o cabeçalho.</li>
                        <li>Colunas obrigatórias: <code className="bg-gray-200 dark:bg-slate-600 p-1 rounded">name</code>, <code className="bg-gray-200 dark:bg-slate-600 p-1 rounded">email</code>, <code className="bg-gray-200 dark:bg-slate-600 p-1 rounded">phone</code>.</li>
                        <li>Colunas opcionais: <code className="bg-gray-200 dark:bg-slate-600 p-1 rounded">address</code>, <code className="bg-gray-200 dark:bg-slate-600 p-1 rounded">notes</code>.</li>
                    </ul>
                    <div className="mt-3">
                         <Button type="button" variant="secondary" size="sm" onClick={handleDownloadTemplate}>
                            Baixar Template
                        </Button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione o arquivo CSV</label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-blue-200"
                    />
                </div>
                
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                {parsedData.length > 0 && !error && (
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">Pré-visualização ({parsedData.length} registros encontrados)</h4>
                        <div className="overflow-x-auto border border-gray-200 dark:border-slate-600 rounded-lg max-h-48">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        {Object.keys(parsedData[0]).map(header => (
                                            <th key={header} className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {parsedData.slice(0, 3).map((row, index) => (
                                        <tr key={index}>
                                            {Object.values(row).map((value, i) => (
                                                <td key={i} className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-400 truncate max-w-xs">{String(value)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {parsedData.length > 3 && <p className="text-xs text-center text-gray-500 mt-1">... e mais {parsedData.length - 3} linha(s).</p>}
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
                <Button type="button" onClick={handleSubmit} disabled={parsedData.length === 0 || !!error}>
                    Importar {parsedData.length > 0 ? parsedData.length : ''} Clientes
                </Button>
            </div>
        </Modal>
    );
};

export default ImportClientsModal;