import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
      </div>
      <p className="text-sm text-slate-400 font-medium">{text}</p>
    </div>
  );
}
