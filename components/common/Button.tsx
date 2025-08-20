
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95';
  
  const variantClasses = {
    primary: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 shadow hover:shadow-md text-white',
    secondary: 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm hover:shadow',
    danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow hover:shadow-md text-white',
  };

  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button className={finalClassName} {...props}>
      {children}
    </button>
  );
};

export default Button;
