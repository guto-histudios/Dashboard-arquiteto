import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`bg-bg-sec border border-border-subtle rounded-[10px] h-[48px] px-4 py-3.5 w-full focus:border-primary focus:outline-none transition-colors ${className}`}
      {...props}
    />
  );
};
