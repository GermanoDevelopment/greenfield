import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'muted';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80',
    highlight: 'bg-gradient-to-b from-slate-900 to-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50',
    muted: 'bg-slate-950/60 border-slate-850',
  }[variant];

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-200 backdrop-blur-sm ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
