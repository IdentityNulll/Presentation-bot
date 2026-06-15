import React, { useEffect, useState } from 'react';
import { Users, Presentation, FileDown, DollarSign, Activity, Loader2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import api from '../utils/api';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#818cf8'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const statsData = await api.getStats();
      const logsData = await api.getLogs(15);
      setStats(statsData);
      setLogs(logsData);
      setError('');
    } catch (err) {
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Formatting chart data
  const exportChartData = stats ? [
    { name: 'PowerPoint (PPTX)', value: stats.exportsByFormat.pptx },
    { name: 'PDF Document', value: stats.exportsByFormat.pdf },
    { name: 'Markdown (MD)', value: stats.exportsByFormat.markdown }
  ] : [];

  const aiChartData = stats ? [
    { name: 'AI Success', count: stats.aiUsage.success },
    { name: 'AI Fallback / Failures', count: stats.aiUsage.failure },
    { name: 'Local Mode', count: stats.aiUsage.local }
  ] : [];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">System Status</h2>
          <p className="text-sm text-slate-400">Overview of users, generation loads, and logs</p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Registered Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Total Bot users registered"
        />
        <StatCard
          title="Active Users (30d)"
          value={stats?.activeUsers || 0}
          icon={Activity}
          description="Users active in the last 30 days"
        />
        <StatCard
          title="Decks Generated"
          value={stats?.totalPresentations || 0}
          icon={Presentation}
          description="PowerPoint decks structured"
        />
        <StatCard
          title="Export Files"
          value={stats?.totalExports || 0}
          icon={FileDown}
          description="Total documents downloaded"
        />
        <StatCard
          title="Estimated Revenue"
          value={`$${stats?.revenue || 0}`}
          icon={DollarSign}
          description="Simulated subscription value"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Formats (Pie Chart) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/60">
          <h4 className="text-lg font-semibold text-white mb-4">Document Export Ratios</h4>
          <div className="h-64 flex items-center justify-center">
            {exportChartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exportChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {exportChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">No export statistics available yet.</p>
            )}
          </div>
        </div>

        {/* AI Performance (Bar Chart) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/60">
          <h4 className="text-lg font-semibold text-white mb-4">AI Generations (30d)</h4>
          <div className="h-64 flex items-center justify-center">
            {aiChartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {aiChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">No presentation generations logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Real-time System Event Logs */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/60">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">System Generation Logs</h4>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold uppercase tracking-wider">
            Live Feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 rounded-tl-xl">Event Type</th>
                <th className="py-3.5 px-4">Message / Action Detail</th>
                <th className="py-3.5 px-4">Triggered By</th>
                <th className="py-3.5 px-4 rounded-tr-xl">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length > 0 ? (
                logs.map((log) => {
                  let eventBadge = 'bg-slate-800 text-slate-300';
                  if (log.action === 'AI_GENERATION_SUCCESS') eventBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  if (log.action === 'AI_GENERATION_FAILURE') eventBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                  if (log.action === 'USER_REGISTERED') eventBadge = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-4 font-semibold text-xs">
                        <span className={`px-2.5 py-1 rounded-full border ${eventBadge}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono max-w-sm truncate" title={log.details}>
                        {log.details || 'No details provided'}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium">
                        {log.user ? (
                          <span className="text-slate-200">@{log.user.username || log.user.telegramId}</span>
                        ) : (
                          <span className="text-slate-500">System</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No system events logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
