import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateBadgeProps {
  className?: string;
}

export const DateBadge: React.FC<DateBadgeProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setCurrentDate(`${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`);
    };
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold shadow-2xs shrink-0 ${className}`}
      title="Current System Date (UTC)"
    >
      <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      <span>{currentDate}</span>
      <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
        UTC
      </span>
    </div>
  );
};
