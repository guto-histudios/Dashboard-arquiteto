import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`bg-bg-sec border border-border-subtle rounded-[10px] min-h-[120px] px-4 py-3.5 w-full focus:border-primary focus:outline-none transition-colors ${className}`}
      {...props}
    />
  );
};
