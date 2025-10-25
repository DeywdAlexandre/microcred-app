export interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    address?: string;
    registrationDate: Date | null;
    notes: string;
    score: number;
    scoreHistory: ScoreHistory[];
}

export type InstallmentStatus = 'pending' | 'paid' | 'partially-paid';

export interface Installment {
    installmentNumber: number;
    dueDate: Date | null;
    amount: number; // Total payment (Principal + Interest)
    principalAmount: number;
    interestAmount: number;
    remainingBalanceAfterPayment: number;
    status: InstallmentStatus;
    paidAmount: number;
    lateFee: number;
}

export interface Loan {
    id: string;
    clientId: string;
    type: LoanType;
    principal: number;
    interestRate: number; // Percentage
    paymentSchedule?: Installment[]; // For installment loans
    startDate: Date | null;
    dueDate: Date | null; // For single loans, it's the final due date. For installment loans, it's the NEXT installment due date.
    remainingBalance: number;
    status: LoanStatus;
    paymentHistory: string[]; // Array of Payment IDs
    renewalHistory: RenewalHistory[];
    notes: string;
}

export interface Payment {
    id: string;
    loanId: string;
    clientId: string;
    date: Date | null;
    amount: number;
    method: PaymentMethod;
    notes: string;
    isInterestOnly?: boolean;
    principalPaid?: number;
    interestPaid?: number;
}

export interface ScoreHistory {
    date: Date | null;
    reason: string;
    delta: number;
    scoreBefore: number;
    scoreAfter: number;
}

export interface RenewalHistory {
    date: Date | null;
    newDueDate: Date | null;
}

export interface Settings {
    defaultInterestRate: number;
    defaultSingleLoanTermDays: number;
    lateFeeRate: number; // Percentage
}

export interface Notification {
    id: string;
    clientName: string;
    message: string;
    type: 'warning' | 'danger';
}

export enum LoanType {
    SINGLE = 'parcela_unica',
    INSTALLMENTS = 'parcelado',
}

export type LoanStatus = 'active' | 'paid' | 'renewed' | 'overdue' | 'partially-paid';

export type PaymentMethod = 'cash' | 'pix' | 'card';

export type AppView = 'dashboard' | 'clients' | 'client-detail' | 'loans' | 'reports' | 'settings';

export const loanTypeUIMap: Record<LoanType, string> = {
    [LoanType.SINGLE]: 'Parcela Única',
    [LoanType.INSTALLMENTS]: 'Parcelado',
};

export const loanStatusUIMap: Record<LoanStatus, string> = {
    active: 'Ativo',
    paid: 'Pago',
    renewed: 'Renovado',
    overdue: 'Inadimplente',
    'partially-paid': 'Pago Parcialmente',
};

export const paymentMethodUIMap: Record<PaymentMethod, string> = {
    cash: 'Dinheiro',
    pix: 'Pix',
    card: 'Cartão',
};
