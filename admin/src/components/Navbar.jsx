import React from 'react';
import { User, Bell, Calendar } from 'lucide-react';

export default function Navbar() {
  const adminUser = JSON.parse(localStorage.getItem('slidepaw_admin_user') || '{"username":"Admin"}');
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="glass-panel border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
      {/* Search / Page Title Context */}
      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
        <Calendar className="h-4 w-4 text-blue-500" />
        <span>{currentDate}</span>
      </div>

      {/* Admin Panel Details */}
      <div className="flex items-center gap-4">
        {/* Notifications (decorative) */}
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-all">
          <Bell className="h-5 w-5" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800/60">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{adminUser.username}</p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">System Admin</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/15">
            {adminUser.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
