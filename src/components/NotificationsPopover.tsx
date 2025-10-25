import React, { useEffect, useRef } from 'react';
// Fix: Add .ts extension
import { Notification } from '@/types.ts';

interface NotificationsPopoverProps {
    notifications: Notification[];
    onClose: () => void;
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ notifications, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const typeClasses = {
        warning: {
            icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            color: 'text-amber-500'
        },
        danger: {
            icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'text-rose-500'
        }
    };

    return (
        <div ref={popoverRef} className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-50">
            <div className="p-3 border-b dark:border-slate-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notificações</h3>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                        {notifications.map(notification => (
                            <li key={notification.id} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-md">
                                <div className="flex items-start gap-3">
                                    <div className={`flex-shrink-0 mt-0.5 ${typeClasses[notification.type].color}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeClasses[notification.type].icon} />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.clientName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">Nenhuma notificação no momento.</p>
                )}
            </div>
        </div>
    );
};

export default NotificationsPopover;