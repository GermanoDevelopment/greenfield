import React from 'react';
import Card from '../atoms/Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
}) => {
  return (
    <Card variant={variant} className="flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {icon && <div className="text-emerald-400 p-2 rounded-lg bg-slate-800/80">{icon}</div>}
      </div>
      <div className="mt-4">
        <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
          {value}
        </div>
        {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
      </div>
    </Card>
  );
};

export default MetricCard;
