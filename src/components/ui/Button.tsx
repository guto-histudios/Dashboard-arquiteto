import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'rounded-[10px] px-5 py-3 font-medium transition-opacity duration-200';
  const variants = {
    primary: 'bg-theme-primary text-white hover:opacity-90',
    secondary: 'bg-transparent border border-border-subtle text-text-main hover:bg-bg-card',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
