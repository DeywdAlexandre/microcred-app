
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-brand-secondary hover:bg-brand-primary text-white focus:ring-brand-primary',
        secondary: 'bg-brand-light text-brand-primary hover:bg-blue-200 focus:ring-brand-secondary',
        danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
        success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
