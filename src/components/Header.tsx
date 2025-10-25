import React from 'react';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';
// Fix: Add .ts extension
import { AppView } from '@/types.ts';

interface HeaderProps {
    onAddClientClick: () => void;
    onAddLoanClick: () => void;
    onQuickPaymentClick: () => void;
    onMenuClick: () => void;
    theme: string;
    onThemeToggle: () => void;
    currentView: AppView;
    setCurrentView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddClientClick, onAddLoanClick, onQuickPaymentClick, onMenuClick, theme, onThemeToggle, currentView, setCurrentView }) => {
    
    return (
        <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm z-10 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2">
                    <button onClick={onMenuClick} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 -ml-2 md:hidden" aria-label="Open menu">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    {currentView !== 'dashboard' && (
                        <button onClick={() => setCurrentView('dashboard')} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-slate-800" aria-label="Ir para a Visão Geral">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </button>
                    )}
                     <div className="hidden md:block text-xl font-bold text-brand-primary dark:text-brand-light">
                        MicroCred
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                     <button onClick={onThemeToggle} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:focus:ring-offset-slate-800" aria-label="Toggle theme">
                        {theme === 'light' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )}
                    </button>
                    
                    <Button onClick={onAddClientClick} size="sm" variant="secondary" className="!px-2 sm:!px-3">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        <span className="hidden sm:inline">Novo Cliente</span>
                        <span className="sm:hidden">Cliente</span>
                    </Button>
                    <Button onClick={onAddLoanClick} size="sm" className="!px-2 sm:!px-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <span className="hidden sm:inline">Novo Empréstimo</span>
                         <span className="sm:hidden">Emprést.</span>
                    </Button>
                    <Button onClick={onQuickPaymentClick} size="sm" className="!px-2 sm:!px-3">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                        <span className="hidden sm:inline">Receber</span>
                        <span className="sm:hidden">Receber</span>
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;