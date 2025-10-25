


import React, { useState } from 'react';
// Fix: Add .ts extension
import { Client } from '@/types.ts';
// Fix: Add .tsx extension
import Modal from './ui/Modal.tsx';
// Fix: Add .tsx extension
import Button from './ui/Button.tsx';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddClient: (client: Omit<Client, 'id'>) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onAddClient }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddClient({
            name,
            email,
            phone,
            address,
            notes,
            registrationDate: new Date(),
            score: 10.0,
            scoreHistory: [{ date: new Date(), reason: 'Initial Score', delta: 10, scoreBefore: 0, scoreAfter: 10 }]
        });
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setNotes('');
    };

    const baseInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-100";
    const baseLabelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Novo Cliente">
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className={baseLabelStyles}>Nome Completo *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={baseInputStyles} />
                    </div>
                    <div>
                        <label className={baseLabelStyles}>Email *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={baseInputStyles} />
                    </div>
                     <div>
                        <label className={baseLabelStyles}>Telefone *</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className={baseInputStyles} />
                    </div>
                    <div>
                        <label className={baseLabelStyles}>Endereço</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={baseInputStyles} />
                    </div>
                     <div>
                        <label className={baseLabelStyles}>Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={baseInputStyles} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Adicionar Cliente</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddClientModal;