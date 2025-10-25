import React from 'react';
// Fix: Add .ts extension
import { AppView } from '@/types.ts';

interface SidebarProps {
    currentView: AppView;
    setCurrentView: (view: AppView) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const SidebarIcon: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <title>{text}</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
    </svg>
);

const NavItem: React.FC<{
    view: AppView;
    currentView: AppView;
    setCurrentView: (view: AppView) => void;
    icon: string;
    text: string;
    onClick?: () => void;
}> = ({ view, currentView, setCurrentView, icon, text, onClick }) => {
    const isActive = currentView === view;
    return (
        <li>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    setCurrentView(view);
                    if (onClick) onClick();
                }}
                className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
                    isActive
                        ? 'bg-brand-primary text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-brand-light dark:hover:bg-slate-700 hover:text-brand-primary dark:hover:text-brand-light'
                }`}
            >
                <SidebarIcon icon={icon} text={text} />
                <span className="ml-3 font-medium">{text}</span>
            </a>
        </li>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
    const navItems: { view: AppView; icon: string; text: string }[] = [
        { view: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', text: 'Dashboard' },
        { view: 'clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197', text: 'Clientes' },
        { view: 'loans', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', text: 'Empréstimos' },
        { view: 'reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', text: 'Relatórios' },
        { view: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', text: 'Configurações' },
    ];
    
    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            ></div>

            <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 p-4 flex flex-col z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-lg ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-8 p-3">
                    MicroCred
                </div>
                <nav>
                    <ul>
                        {navItems.map(item => (
                            <NavItem key={item.view} {...item} currentView={currentView} setCurrentView={setCurrentView} onClick={() => setIsOpen(false)} />
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;