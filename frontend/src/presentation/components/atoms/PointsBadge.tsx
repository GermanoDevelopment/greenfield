import React from 'react';
import { Coins } from 'lucide-react';

interface PointsBadgeProps {
  points: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PointsBadge: React.FC<PointsBadgeProps> = ({
  points,
  showIcon = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base font-bold px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-sm ${sizeClasses}`}
      title={`${points.toLocaleString()} pontos Greenfield`}
    >
      {showIcon && <Coins className="w-3.5 h-3.5 text-amber-600" />}
      {points.toLocaleString()} pts
    </span>
  );
};

export default PointsBadge;
