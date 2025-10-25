


import React, { useState, useMemo } from 'react';
// Fix: Add .ts extension
import { Loan, Payment, LoanType } from '@/types.ts';
// Fix: Add .tsx extension
import Card from './ui/Card.tsx';
import { getYear, getMonth, isSameYear, isSameMonth } from 'date-fns';

interface ReportsViewProps {
    loans: Loan[];
    payments: Payment[];
}

const StatCard: React.FC<{ title: string; value: string; description: string; }> = ({ title, value, description }) => (
    <Card className="text-center">
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="mt-2 text-4xl font-bold text-brand-primary dark:text-brand-secondary">{value}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </Card>
);

const ReportsView: React.FC<ReportsViewProps> = ({ loans, payments }) => {
    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        loans.forEach(l => l.startDate && years.add(getYear(l.startDate)));
        payments.forEach(p => p.date && years.add(getYear(p.date)));
        if (!years.has(currentYear)) {
            years.add(currentYear);
        }
        return Array.from(years).sort((a, b) => b - a);
    }, [loans, payments, currentYear]);

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const filteredData = useMemo(() => {
        const selectedDate = new Date(selectedYear, selectedMonth);
        const filteredLoans = loans.filter(l =>
            l.startDate &&
            isSameYear(l.startDate, selectedDate) &&
            isSameMonth(l.startDate, selectedDate)
        );
        const filteredPayments = payments.filter(p =>
            p.date &&
            isSameYear(p.date, selectedDate) &&
            isSameMonth(p.date, selectedDate)
        );
        return { filteredLoans, filteredPayments };
    }, [loans, payments, selectedYear, selectedMonth]);

    const reportMetrics = useMemo(() => {
        const income = filteredData.filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const outcome = filteredData.filteredLoans.reduce((sum, l) => sum + l.principal, 0);

        const profit = filteredData.filteredPayments.reduce((sum, payment) => {
            return sum + (payment.interestPaid || 0);
        }, 0);

        return { income, outcome, profit };
    }, [filteredData]);
    
    const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Relatórios</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Analise a saúde financeira do seu negócio.</p>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex-1">
                        <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ano</label>
                        <select
                            id="year-select"
                            value={selectedYear}
                            onChange={e => setSelectedYear(parseInt(e.target.value))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100"
                        >
                            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                     <div className="flex-1">
                        <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mês</label>
                        <select
                            id="month-select"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(parseInt(e.target.value))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100"
                        >
                            {months.map((month, index) => <option key={index} value={index}>{month}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Entradas"
                        value={currencyFormatter.format(reportMetrics.income)}
                        description="Total de pagamentos recebidos no período."
                    />
                    <StatCard 
                        title="Saídas"
                        value={currencyFormatter.format(reportMetrics.outcome)}
                        description="Total de novos empréstimos concedidos no período."
                    />
                     <StatCard 
                        title="Lucro (Juros Realizados)"
                        value={currencyFormatter.format(reportMetrics.profit)}
                        description="Juros efetivamente recebidos no período."
                    />
                </div>
            </Card>
        </div>
    );
};

export default ReportsView;