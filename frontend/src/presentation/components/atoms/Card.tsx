import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'alert' | 'muted';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border-[#EEF2F6] shadow-card text-ink-heading hover:shadow-hover',
    highlight: 'bg-white border-blue-200 shadow-card text-ink-heading hover:border-blue-400 hover:shadow-hover',
    alert: 'bg-amber-50/40 border-amber-300 shadow-card text-ink-heading',
    muted: 'bg-slate-50 border-slate-200 text-ink-body',
  }[variant];

  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-200 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
