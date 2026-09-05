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
      className={`inline-flex items-center gap-1.5 rounded-md font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 ${sizeClasses}`}
      title={`${points.toLocaleString()} pontos Greenfield`}
    >
      {showIcon && <Coins className="w-3.5 h-3.5 text-amber-400" />}
      {points.toLocaleString()} pts
    </span>
  );
};

export default PointsBadge;
