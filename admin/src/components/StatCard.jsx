import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, trendType = 'up', description }) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between min-h-[140px] hover:translate-y-[-2px] transition-all">
      <div className="flex items-start justify-between">
        {/* Metric Info */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-white tracking-tight">
            {value}
          </h3>
        </div>

        {/* Icon Wrapper */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-blue-500">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Footer Meta / Trend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/40">
        <p className="text-[11px] text-slate-500 font-medium">
          {description}
        </p>
        
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendType === 'up' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {trendType === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
