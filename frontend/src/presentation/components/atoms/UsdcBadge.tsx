import React from 'react';

interface UsdcBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
}

export const UsdcBadge: React.FC<UsdcBadgeProps> = ({ amount, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base font-bold px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm ${sizeClasses}`}
      title={`${amount} USDC`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDC
    </span>
  );
};

export default UsdcBadge;
