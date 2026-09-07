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
    default: 'bg-[#182017] border-[#252E24] shadow-card text-[#D2DFD1] hover:border-[#28B110]/40 hover:shadow-hover',
    highlight: 'bg-[#182017] border-[#28B110]/50 shadow-card text-[#D2DFD1] hover:border-[#28B110] hover:shadow-hover',
    alert: 'bg-amber-950/30 border-amber-800/60 shadow-card text-amber-200',
    muted: 'bg-[#131A12] border-[#252E24] text-[#889887]',
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
