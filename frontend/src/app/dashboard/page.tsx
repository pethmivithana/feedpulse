'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getFeedback,
  getStats,
  getAISummary,
  updateFeedbackStatus,
  deleteFeedbackItem,
  reanalyzeFeedback,
  FeedbackItem,
  StatsData,
} from '@/lib/api';
import Link from 'next/link';

const SENTIMENT_CONFIG = {
  Positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  Neutral: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  Negative: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
};

const STATUS_CONFIG = {
  New: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'In Review': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const PRIORITY_COLOR = (score: number) => {
  if (score >= 8) return 'text-red-600 bg-red-50';
  if (score >= 5) return 'text-amber-600 bg-amber-50';
  return 'text-slate-500 bg-slate-50';
};

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [page, setPage] = useState(1);
  const [activeDetail, setActiveDetail] = useState<FeedbackItem | null>(null);
  const [updatingId, setUpdatingId] = useState('');

  const loadData = useCallback(async (tok: string) => {
    setLoading(true);
    try {
      const [feedRes, statsRes] = await Promise.all([
        getFeedback(tok, { ...filters, page, limit: 10 }),
        getStats(tok),
      ]);
      if (feedRes.success) {
        setItems(feedRes.data.items);
        setPagination(feedRes.data.pagination);
      }
      if (statsRes.success) setStats(statsRes.data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const tok = localStorage.getItem('fp_token');
    const email = localStorage.getItem('fp_email');
    if (!tok) { router.push('/dashboard/login'); return; }
    setToken(tok);
    setAdminEmail(email || '');
    loadData(tok);
  }, [router, loadData]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    const res = await updateFeedbackStatus(token, id, status);
    if (res.success) {
      setItems(prev => prev.map(i => i._id === id ? { ...i, status } : i));
      if (activeDetail?._id === id) setActiveDetail(prev => prev ? { ...prev, status } : prev);
    }
    setUpdatingId('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback item?')) return;
    const res = await deleteFeedbackItem(token, id);
    if (res.success) {
      setItems(prev => prev.filter(i => i._id !== id));
      if (activeDetail?._id === id) setActiveDetail(null);
      if (stats) setStats({ ...stats, total: stats.total - 1 });
    }
  };

  const handleReanalyze = async (id: string) => {
    setUpdatingId(id);
    const res = await reanalyzeFeedback(token, id);
    if (res.success) {
      setItems(prev => prev.map(i => i._id === id ? res.data : i));
      if (activeDetail?._id === id) setActiveDetail(res.data);
    }
    setUpdatingId('');
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    const res = await getAISummary(token);
    if (res.success) setSummary(res.data.summary);
    setSummaryLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('fp_token');
    localStorage.removeItem('fp_email');
    router.push('/dashboard/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">FP</span>
            </div>
            <span className="font-display font-semibold text-slate-900">FeedPulse</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              ← Submit Form
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                {adminEmail[0]?.toUpperCase()}
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors text-xs">Sign out</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Feedback', value: stats.total, icon: '📝', color: 'text-slate-700' },
              { label: 'Open Items', value: stats.openItems, icon: '🔓', color: 'text-blue-600' },
              { label: 'Avg Priority', value: stats.avgPriority || '—', icon: '⚡', color: 'text-amber-600' },
              { label: 'Top Tag', value: stats.topTag, icon: '🏷️', color: 'text-indigo-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-medium">{s.label}</span>
                  <span className="text-base">{s.icon}</span>
                </div>
                <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Summary */}
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🤖</span>
              <h3 className="font-display font-semibold text-slate-800 text-sm">AI Weekly Summary</h3>
            </div>
            <button
              onClick={loadSummary}
              disabled={summaryLoading}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {summaryLoading ? 'Generating…' : 'Generate'}
            </button>
          </div>
          {summary ? (
            <p className="text-slate-600 text-sm leading-relaxed">{summary}</p>
          ) : (
            <p className="text-slate-400 text-sm">Click &quot;Generate&quot; to get AI insights from the last 7 days of feedback.</p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search by title or summary…"
              value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-64"
            />
            <select
              value={filters.category}
              onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Categories</option>
              {['Bug', 'Feature Request', 'Improvement', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Statuses</option>
              {['New', 'In Review', 'Resolved'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filters.sortBy}
              onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="createdAt">Sort: Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="sentiment">Sort: Sentiment</option>
            </select>
            <button
              onClick={() => setFilters(f => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {filters.sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>

        {/* Main content: table + detail panel */}
        <div className="flex gap-4">
          {/* Feedback list */}
          <div className={`${activeDetail ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="py-24 text-center text-slate-400">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Loading feedback…
                </div>
              ) : items.length === 0 ? (
                <div className="py-24 text-center text-slate-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="font-medium">No feedback found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map(item => {
                    const sentConf = item.ai_sentiment ? SENTIMENT_CONFIG[item.ai_sentiment] : null;
                    const statConf = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
                    return (
                      <div
                        key={item._id}
                        onClick={() => setActiveDetail(activeDetail?._id === item._id ? null : item)}
                        className={`px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${activeDetail?._id === item._id ? 'bg-indigo-50/50 border-l-2 border-indigo-500' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs text-slate-400 font-mono">{item.category}</span>
                              {sentConf && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${sentConf.bg} ${sentConf.text} ${sentConf.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sentConf.dot}`}></span>
                                  {item.ai_sentiment}
                                </span>
                              )}
                              {item.ai_priority && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${PRIORITY_COLOR(item.ai_priority)}`}>
                                  P{item.ai_priority}
                                </span>
                              )}
                            </div>
                            <h3 className="font-display font-semibold text-slate-800 text-sm truncate">{item.title}</h3>
                            {item.ai_summary && (
                              <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{item.ai_summary}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${statConf.bg} ${statConf.text} ${statConf.border}`}>
                              {item.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {item.ai_tags && item.ai_tags.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {item.ai_tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {pagination.total} total · Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {activeDetail && (
            <div className="w-1/2 animate-slide-up">
              <div className="bg-white rounded-xl border border-slate-200 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <h2 className="font-display font-bold text-slate-900 text-base leading-snug">{activeDetail.title}</h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-400">{activeDetail.category}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{new Date(activeDetail.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveDetail(null)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* AI Analysis card */}
                  {activeDetail.ai_processed ? (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1">
                          <span>🤖</span> AI Analysis
                        </span>
                        <button
                          onClick={() => handleReanalyze(activeDetail._id)}
                          disabled={updatingId === activeDetail._id}
                          className="text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {updatingId === activeDetail._id ? 'Running…' : '↺ Re-analyze'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Sentiment</p>
                          {activeDetail.ai_sentiment && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${SENTIMENT_CONFIG[activeDetail.ai_sentiment].bg} ${SENTIMENT_CONFIG[activeDetail.ai_sentiment].text} ${SENTIMENT_CONFIG[activeDetail.ai_sentiment].border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${SENTIMENT_CONFIG[activeDetail.ai_sentiment].dot}`}></span>
                              {activeDetail.ai_sentiment}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Priority Score</p>
                          <span className={`px-2.5 py-1 rounded-full text-sm font-bold font-mono ${activeDetail.ai_priority ? PRIORITY_COLOR(activeDetail.ai_priority) : 'text-slate-400'}`}>
                            {activeDetail.ai_priority}/10
                          </span>
                        </div>
                      </div>
                      {activeDetail.ai_summary && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-400 mb-0.5">Summary</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{activeDetail.ai_summary}</p>
                        </div>
                      )}
                      {activeDetail.ai_tags && activeDetail.ai_tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {activeDetail.ai_tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 text-indigo-600 text-xs font-medium">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <p className="text-slate-400 text-sm">AI analysis pending…</p>
                      <button
                        onClick={() => handleReanalyze(activeDetail._id)}
                        disabled={updatingId === activeDetail._id}
                        className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-50"
                      >
                        {updatingId === activeDetail._id ? 'Analyzing…' : 'Trigger Analysis'}
                      </button>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{activeDetail.description}</p>
                  </div>

                  {/* Submitter */}
                  {(activeDetail.submitterName || activeDetail.submitterEmail) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Submitted by</p>
                      <p className="text-sm text-slate-700">{activeDetail.submitterName || '—'}</p>
                      {activeDetail.submitterEmail && (
                        <a href={`mailto:${activeDetail.submitterEmail}`} className="text-sm text-indigo-600 hover:underline">{activeDetail.submitterEmail}</a>
                      )}
                    </div>
                  )}

                  {/* Status update */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Update Status</p>
                    <div className="flex gap-2">
                      {['New', 'In Review', 'Resolved'].map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(activeDetail._id, s)}
                          disabled={updatingId === activeDetail._id}
                          className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                            activeDetail.status === s
                              ? `${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].bg} ${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].text} ${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].border} shadow-sm`
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          } disabled:opacity-50`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(activeDetail._id)}
                    className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete Feedback
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
