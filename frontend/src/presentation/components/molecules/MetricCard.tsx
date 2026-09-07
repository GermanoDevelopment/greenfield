import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight';
  isAlert?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  isAlert = false,
}) => {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 transition-all duration-200 interactive-card flex flex-col justify-between ${
        isAlert
          ? 'border-amber-400 bg-amber-50/20 shadow-card ring-1 ring-amber-400/30'
          : 'border-[#EEF2F6] shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isAlert ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
            </div>
          )}
          <span className="text-xs font-medium text-slate-500 tracking-wide">
            {label}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[2rem] font-bold tracking-tight text-slate-900 leading-none font-sans">
          {value}
        </div>
        {subtext && <p className="mt-1.5 text-xs text-slate-500">{subtext}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
