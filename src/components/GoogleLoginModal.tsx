

import React from 'react';
import Modal from './ui/Modal';

interface GoogleLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAccount: (email: string) => void;
}

const GoogleAccountRow: React.FC<{ email: string; name: string; onClick: () => void }> = ({ email, name, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
    >
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {name.charAt(0)}
        </div>
        <div className="ml-4">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
        </div>
    </button>
);

const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({ isOpen, onClose, onSelectAccount }) => {

    const handleSelect = (email: string) => {
        onSelectAccount(email);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Escolha uma conta">
            <div className="space-y-2">
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                    Para continuar, o Google compartilhará seu nome, endereço de e-mail e foto do perfil com o MicroCred.
                </p>
                <GoogleAccountRow
                    name="Usuário de Exemplo"
                    email="usuario@gmail.com"
                    onClick={() => handleSelect('usuario@gmail.com')}
                />
                 <GoogleAccountRow
                    name="Jane Doe"
                    email="jane.doe@example.com"
                    onClick={() => handleSelect('jane.doe@example.com')}
                />
                 <div className="pt-4 mt-2 border-t dark:border-slate-600">
                    <button
                        onClick={onClose}
                        className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <div className="ml-4">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">Usar outra conta</p>
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GoogleLoginModal;
