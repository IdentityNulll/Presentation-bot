import React, { useEffect, useState } from 'react';
import { Search, ShieldAlert, Trash2, Ban, Eye, Loader2, X, AlertOctagon, HelpCircle } from 'lucide-react';
import api from '../utils/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [loading, setLoading] = useState(true);
  
  // Activity Modal State
  const [activeUser, setActiveUser] = useState(null);
  const [activity, setActivity] = useState({ presentations: [], exports: [] });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(search, filter, page);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleBanToggle = async (userId, currentBanStatus) => {
    const confirmation = window.confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`);
    if (!confirmation) return;

    try {
      await api.banUser(userId, !currentBanStatus);
      fetchUsers();
    } catch (err) {
      alert('Failed to update ban status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmation = window.confirm('WARNING: Deleting a user will permanently remove all their presentations, logs, and files. Proceed?');
    if (!confirmation) return;

    try {
      await api.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const handleOpenActivity = async (user) => {
    setActiveUser(user);
    setShowModal(true);
    setLoadingActivity(true);
    try {
      const activityData = await api.getUserActivity(user.id);
      setActivity(activityData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivity(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">User Accounts</h2>
        <p className="text-sm text-slate-400">Search and manage Telegram accounts registered on SlidePaw</p>
      </div>

      {/* Control Panel (Search, Filter) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800/40">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search username, name, or Telegram ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input pl-11 py-2 text-sm"
          />
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          {['all', 'premium', 'banned'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                filter === f
                  ? 'bg-blue-600/15 border-blue-500/30 text-blue-400'
                  : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Telegram ID</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Decks</th>
                  <th className="py-4 px-6 text-center">Exports</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.length > 0 ? (
                  users.map((user) => {
                    let statusBadge = 'bg-slate-800/80 text-slate-400 border border-slate-700/50';
                    if (user.subscription === 'PREMIUM') statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
                    if (user.subscription === 'LIFETIME') statusBadge = 'bg-purple-500/10 text-purple-400 border border-purple-500/25';
                    if (user.isBanned) statusBadge = 'bg-red-500/15 text-red-400 border border-red-500/25';

                    return (
                      <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-200">
                            {user.firstName || ''} {user.lastName || ''}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.username ? `@${user.username}` : 'No username'}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          {user.telegramId}
                        </td>
                        <td className="py-4 px-6 text-xs font-medium">
                          <span className={`px-2.5 py-1 rounded-full ${statusBadge}`}>
                            {user.isBanned ? 'BANNED' : user.subscription}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-200">
                          {user._count.presentations}
                        </td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-200">
                          {user._count.exports}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenActivity(user)}
                              className="p-2 bg-slate-800/60 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-100 border border-slate-800 transition-all active:scale-95"
                              title="View Activity"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleBanToggle(user.id, user.isBanned)}
                              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                                user.isBanned 
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                              }`}
                              title={user.isBanned ? 'Unban User' : 'Ban User'}
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/20 transition-all active:scale-95"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No user accounts found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/30 p-4 rounded-xl border border-slate-800/40">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400 font-semibold">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
            disabled={page === pagination.pages}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            Next
          </button>
        </div>
      )}

      {/* Activity Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel rounded-2xl border border-slate-800/80 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">User Activity History</h3>
                <p className="text-xs text-slate-400">
                  {activeUser?.firstName} {activeUser?.lastName} (@{activeUser?.username || 'no_uname'})
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingActivity ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Presentations */}
                  <div>
                    <h5 className="font-semibold text-white mb-3 text-sm flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Recent Presentations ({activity.presentations.length})
                    </h5>
                    {activity.presentations.length > 0 ? (
                      <div className="space-y-2.5">
                        {activity.presentations.map((p) => (
                          <div key={p.id} className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">{p.title}</p>
                              <p className="text-xs text-slate-500">Topic: {p.topic}</p>
                            </div>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                              {p.style}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs italic pl-4">No presentations generated.</p>
                    )}
                  </div>

                  {/* Exports */}
                  <div>
                    <h5 className="font-semibold text-white mb-3 text-sm flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Recent File Downloads ({activity.exports.length})
                    </h5>
                    {activity.exports.length > 0 ? (
                      <div className="space-y-2.5">
                        {activity.exports.map((e) => (
                          <div key={e.id} className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">
                                {e.presentation?.title || 'Unknown Presentation'}
                              </p>
                              <p className="text-xs text-slate-500">Format: {e.format}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(e.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs italic pl-4">No exports generated.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900/30 border-t border-slate-800/80 flex justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary py-1.5 px-4 text-xs">
                Close Activity Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
