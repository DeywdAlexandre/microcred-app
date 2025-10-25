


import React, { useState, useEffect } from 'react';
// Fix: Add .ts extension
import { Client, Loan, Settings, loanStatusUIMap, loanTypeUIMap } from '@/types.ts';
// Fix: Add .tsx extension
import Card from './ui/Card.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
// Fix: Add .ts extension
import { exportToCSV } from '@/utils/csv.ts';
import { format } from 'date-fns';

interface SettingsViewProps {
    settings: Settings;
    onSave: (newSettings: Settings) => void;
    clients: Client[];
    loans: Loan[];
    onImportClients: () => void;
    onImportLoans: () => void;
    isGoogleConnected: boolean;
    googleUserEmail: string | null;
    googleSheetId: string | null;
    googleSheetName: string | null;
    isAutoSyncEnabled: boolean;
    lastSyncTimestamp: string | null;
    onGoogleLogout: () => Promise<void>;
    onCreateGoogleSheet: () => Promise<void>;
    onSyncToSheet: () => Promise<void>;
    onSyncFromSheet: () => Promise<void>;
    onToggleAutoSync: (enabled: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, onSave, clients, loans, onImportClients, onImportLoans,
    isGoogleConnected, googleUserEmail, googleSheetId, googleSheetName,
    isAutoSyncEnabled, lastSyncTimestamp, onGoogleLogout,
    onCreateGoogleSheet, onSyncToSheet, onSyncFromSheet, onToggleAutoSync
}) => {
    const [interestRate, setInterestRate] = useState(settings.defaultInterestRate.toString());
    const [loanTerm, setLoanTerm] = useState(settings.defaultSingleLoanTermDays.toString());
    const [lateFeeRate, setLateFeeRate] = useState(settings.lateFeeRate.toString());
    const [showSuccess, setShowSuccess] = useState(false);
    
    const [isSyncing, setIsSyncing] = useState<null | 'up' | 'down'>(null);
    const [isCreatingSheet, setIsCreatingSheet] = useState(false);


    useEffect(() => {
        setInterestRate(settings.defaultInterestRate.toString());
        setLoanTerm(settings.defaultSingleLoanTermDays.toString());
        setLateFeeRate(settings.lateFeeRate.toString());
    }, [settings]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            defaultInterestRate: parseFloat(interestRate) || 0,
            defaultSingleLoanTermDays: parseInt(loanTerm, 10) || 0,
            lateFeeRate: parseFloat(lateFeeRate) || 0,
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };
    
    const handleExportClients = () => {
        const dataToExport = clients.map(c => ({
            'ID': c.id,
            'Nome': c.name,
            'Email': c.email,
            'Telefone': c.phone,
            'Endereço': c.address,
            'Data de Cadastro': c.registrationDate ? format(c.registrationDate, 'dd/MM/yyyy') : 'N/A',
            'Score': c.score.toFixed(1),
            'Observações': c.notes,
        }));
        exportToCSV(dataToExport, `clientes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };

    const handleExportLoans = () => {
        const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        const clientMap = new Map<string, Client>(clients.map(c => [c.id, c]));
        const dataToExport = loans.map(l => ({
            'ID Empréstimo': l.id,
            'Cliente': clientMap.get(l.clientId)?.name || 'N/A',
            'Valor Principal': currencyFormatter.format(l.principal),
            'Juros (%)': l.interestRate,
            'Saldo Restante': currencyFormatter.format(l.remainingBalance),
            'Data Início': l.startDate ? format(l.startDate, 'dd/MM/yyyy') : 'N/A',
            'Data Vencimento': l.dueDate ? format(l.dueDate, 'dd/MM/yyyy') : 'N/A',
            'Status': loanStatusUIMap[l.status],
            'Tipo': loanTypeUIMap[l.type],
            'Observações': l.notes,
        }));
        exportToCSV(dataToExport, `emprestimos-todos-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };
    
    const handleFullBackup = () => {
        const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        const clientMap = new Map<string, Client>(clients.map(c => [c.id, c]));

        const loanData = loans.map(loan => {
            const client = clientMap.get(loan.clientId);
            return {
                'ID Cliente': client?.id || '',
                'Nome Cliente': client?.name || 'N/A',
                'Telefone Cliente': client?.phone || '',
                'Email Cliente': client?.email || '',
                'Score Cliente': client?.score?.toFixed(1) || '',
                'ID Empréstimo': loan.id,
                'Tipo Empréstimo': loanTypeUIMap[loan.type],
                'Status Empréstimo': loanStatusUIMap[loan.status],
                'Valor Principal': currencyFormatter.format(loan.principal),
                'Juros (%)': loan.interestRate,
                'Saldo Restante': currencyFormatter.format(loan.remainingBalance),
                'Data Início': loan.startDate ? format(loan.startDate, 'dd/MM/yyyy') : 'N/A',
                'Data Vencimento': loan.dueDate ? format(loan.dueDate, 'dd/MM/yyyy') : 'N/A',
            };
        });

        const clientsWithLoans = new Set(loans.map(l => l.clientId));
        const clientsWithoutLoans = clients
            .filter(c => !clientsWithLoans.has(c.id))
            .map(client => ({
                'ID Cliente': client.id,
                'Nome Cliente': client.name,
                'Telefone Cliente': client.phone,
                'Email Cliente': client.email,
                'Score Cliente': client.score.toFixed(1),
                'ID Empréstimo': '',
                'Tipo Empréstimo': '',
                'Status Empréstimo': '',
                'Valor Principal': '',
                'Juros (%)': '',
                'Saldo Restante': '',
                'Data Início': '',
                'Data Vencimento': '',
            }));

        const fullBackupData = [...loanData, ...clientsWithoutLoans];
        exportToCSV(fullBackupData, `backup_completo_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };

    const handleCreateSheetClick = async () => {
        setIsCreatingSheet(true);
        try {
            await onCreateGoogleSheet();
        } catch (error) {
            console.error("Create sheet failed in view");
        } finally {
            setIsCreatingSheet(false);
        }
    };
    
    const handleSyncToSheetClick = async () => {
        setIsSyncing('up');
        try {
            await onSyncToSheet();
        } catch (error) {
             console.error("Sync to sheet failed in view");
        } finally {
            setIsSyncing(null);
        }
    };
    
    const handleSyncFromSheetClick = async () => {
        setIsSyncing('down');
        try {
            await onSyncFromSheet();
        } catch (error) {
            console.error("Sync from sheet failed in view");
        } finally {
            setIsSyncing(null);
        }
    };


    const baseInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100";
    const baseLabelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Configurações</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Defina valores padrão e gerencie os dados do sistema.</p>
            </div>
            
            <Card title="Configurações Gerais">
                <form onSubmit={handleSave} className="max-w-md">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="defaultInterest" className={baseLabelStyles}>
                                Taxa de Juros Padrão (%)
                            </label>
                            <input
                                id="defaultInterest"
                                type="number"
                                step="0.1"
                                value={interestRate}
                                onChange={e => setInterestRate(e.target.value)}
                                className={baseInputStyles}
                                placeholder="Ex: 10"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Taxa de juros mensal sugerida ao criar um novo empréstimo.</p>
                        </div>
                        <div>
                            <label htmlFor="defaultTerm" className={baseLabelStyles}>
                                Prazo Padrão (dias) - Parcela Única
                            </label>
                            <input
                                id="defaultTerm"
                                type="number"
                                value={loanTerm}
                                onChange={e => setLoanTerm(e.target.value)}
                                className={baseInputStyles}
                                placeholder="Ex: 30"
                            />
                             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Prazo padrão em dias para empréstimos de parcela única.</p>
                        </div>
                         <div>
                            <label htmlFor="lateFeeRate" className={baseLabelStyles}>
                                Taxa de Multa por Atraso (%)
                            </label>
                            <input
                                id="lateFeeRate"
                                type="number"
                                step="0.1"
                                value={lateFeeRate}
                                onChange={e => setLateFeeRate(e.target.value)}
                                className={baseInputStyles}
                                placeholder="Ex: 2"
                            />
                             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Multa a ser aplicada sobre o valor restante da parcela quando ela vencer.</p>
                        </div>
                    </div>
                    <div className="mt-8 flex items-center justify-end">
                        {showSuccess && <span className="text-sm text-green-600 dark:text-green-400 mr-4">Configurações salvas!</span>}
                        <Button type="submit">
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Card>

            <Card title="Sincronização com Google Sheets">
                {isGoogleConnected ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Conectado como:</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{googleUserEmail || 'Conta Google'}</p>
                            </div>
                            <Button variant="danger" size="sm" onClick={onGoogleLogout}>Desconectar</Button>
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600">
                            {!googleSheetId ? (
                                <div>
                                    <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3">Nenhuma planilha vinculada. Crie uma para começar a sincronizar.</p>
                                    <Button onClick={handleCreateSheetClick} className="w-full justify-center" disabled={isCreatingSheet}>
                                        {isCreatingSheet ? 'Criando...' : 'Criar Nova Planilha de Backup'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Planilha Vinculada:</p>
                                        <p className="font-semibold text-brand-secondary truncate">{googleSheetName}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t dark:border-slate-600">
                                        <label htmlFor="auto-sync-toggle" className={`flex flex-col ${!googleSheetId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">Sincronização Automática</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Sincroniza ao abrir o app</span>
                                        </label>
                                        <div className="relative inline-flex items-center">
                                            <input
                                                id="auto-sync-toggle"
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isAutoSyncEnabled}
                                                onChange={(e) => onToggleAutoSync(e.target.checked)}
                                                disabled={!googleSheetId}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-brand-primary rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-brand-secondary"></div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t dark:border-slate-600">
                                         <div className="flex flex-col sm:flex-row gap-4">
                                             <Button onClick={handleSyncToSheetClick} variant="secondary" className="w-full justify-center" disabled={isAutoSyncEnabled || !!isSyncing}>
                                                 {isSyncing === 'up' ? 'Enviando...' : <>⬆️ Enviar para Planilha</>}
                                             </Button>
                                             <Button onClick={handleSyncFromSheetClick} variant="secondary" className="w-full justify-center" disabled={isAutoSyncEnabled || !!isSyncing}>
                                                 {isSyncing === 'down' ? 'Recebendo...' : <>⬇️ Receber da Planilha</>}
                                             </Button>
                                         </div>
                                         {isAutoSyncEnabled && <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">A sincronização manual está desativada.</p>}
                                         {lastSyncTimestamp && (
                                             <p className="text-xs text-center mt-3 text-gray-500 dark:text-gray-400">
                                                 Última sincronização: {format(new Date(lastSyncTimestamp), "dd/MM/yyyy 'às' HH:mm:ss")}
                                             </p>
                                         )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                         <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3">
                            Conecte sua conta Google para salvar e sincronizar seus dados com o Google Sheets, garantindo segurança e acesso de qualquer lugar.
                        </p>
                         <a
                            href={`/api/auth/google`}
                            className="inline-flex items-center justify-center w-full px-4 py-2 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-brand-secondary hover:bg-brand-primary text-white focus:ring-brand-primary"
                        >
                            <svg className="w-4 h-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.9 56.5l-63.4 61.8C330.1 99.4 292.3 84 248 84c-83.2 0-150.8 67.6-150.8 150.8s67.6 150.8 150.8 150.8c97.9 0 130.4-74.4 134.4-114.2H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                            Conectar com Google
                        </a>
                    </div>
                )}
            </Card>

            <Card title="Importação de Dados">
                <div className="space-y-4 max-w-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Importe dados existentes para o sistema. Use o template para garantir a formatação correta.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={onImportClients} variant="secondary" className="w-full justify-center">Importar Clientes (CSV)</Button>
                        <Button onClick={onImportLoans} variant="secondary" className="w-full justify-center">Importar Empréstimos (Planilha)</Button>
                    </div>
                </div>
            </Card>

            <Card title="Exportação de Dados">
                <div className="space-y-4 max-w-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Faça o download dos dados do sistema em formato CSV.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleExportClients} variant="secondary" className="w-full justify-center">Exportar Clientes</Button>
                        <Button onClick={handleExportLoans} variant="secondary" className="w-full justify-center">Exportar Empréstimos</Button>
                    </div>
                     <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <Button onClick={handleFullBackup} variant="primary" className="w-full justify-center">
                            Exportar Backup Completo (CSV Único)
                        </Button>
                        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">Gera um único arquivo com todos os clientes e seus respectivos empréstimos.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsView;