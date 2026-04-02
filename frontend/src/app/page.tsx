'use client';

import { useState } from 'react';
import { submitFeedback } from '@/lib/api';
import Link from 'next/link';

const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'] as const;

export default function HomePage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    submitterName: '',
    submitterEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.length > 120) e.title = 'Title cannot exceed 120 characters';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.length < 20) e.description = `Description must be at least 20 characters (${form.description.length}/20)`;
    if (!form.category) e.category = 'Please select a category';
    if (form.submitterEmail && !/^\S+@\S+\.\S+$/.test(form.submitterEmail)) e.submitterEmail = 'Invalid email address';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setState('loading');

    try {
      const res = await submitFeedback(form);
      if (res.success) {
        setState('success');
        setMessage(res.message);
        setForm({ title: '', description: '', category: '', submitterName: '', submitterEmail: '' });
      } else {
        setState('error');
        setMessage(res.message || 'Submission failed. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/30 ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-400'
        : 'border-slate-200 bg-white focus:border-indigo-400 hover:border-slate-300'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">FP</span>
            </div>
            <span className="font-display font-700 text-slate-900 font-semibold">FeedPulse</span>
          </div>
          <Link
            href="/dashboard/login"
            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
          >
            Admin →
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-dot"></span>
            AI-Powered Feedback Analysis
          </div>
          <h1 className="font-display text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Share your{' '}
            <span className="text-gradient">feedback</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
            Help shape the product. Our AI analyzes every submission to surface insights for the team.
          </p>
        </div>

        {/* Success State */}
        {state === 'success' && (
          <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-emerald-800 font-display">Feedback submitted!</p>
                <p className="text-emerald-700 text-sm mt-0.5">{message}</p>
                <button
                  onClick={() => setState('idle')}
                  className="mt-3 text-sm font-medium text-emerald-700 underline hover:no-underline"
                >
                  Submit another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="mb-8 p-5 rounded-2xl bg-red-50 border border-red-200 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-800 font-display">Submission failed</p>
                <p className="text-red-700 text-sm mt-0.5">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {state !== 'success' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden animate-slide-up">
            <div className="px-8 py-7 border-b border-slate-100">
              <h2 className="font-display font-semibold text-slate-900">New Feedback</h2>
              <p className="text-slate-500 text-sm mt-1">Fields marked * are required</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Brief summary of your feedback"
                  className={inputClass('title')}
                  maxLength={120}
                />
                <div className="flex justify-between mt-1">
                  {errors.title ? (
                    <p className="text-red-500 text-xs">{errors.title}</p>
                  ) : <span />}
                  <span className="text-slate-400 text-xs">{form.title.length}/120</span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                        form.category === cat
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your feedback in detail. What problem are you facing? What would you like to see improved?"
                  rows={5}
                  className={`${inputClass('description')} resize-none leading-relaxed`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-red-500 text-xs">{errors.description}</p>
                  ) : form.description.length > 0 && form.description.length < 20 ? (
                    <p className="text-amber-500 text-xs">{20 - form.description.length} more characters needed</p>
                  ) : <span />}
                  <span className={`text-xs ${form.description.length < 20 && form.description.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {form.description.length} chars
                  </span>
                </div>
              </div>

              {/* Optional fields */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Optional — Stay in the loop</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your name</label>
                    <input
                      type="text"
                      value={form.submitterName}
                      onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))}
                      placeholder="Jane Doe"
                      className={inputClass('submitterName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.submitterEmail}
                      onChange={e => setForm(f => ({ ...f, submitterEmail: e.target.value }))}
                      placeholder="jane@example.com"
                      className={inputClass('submitterEmail')}
                    />
                    {errors.submitterEmail && <p className="text-red-500 text-xs mt-1">{errors.submitterEmail}</p>}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={state === 'loading'}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-display font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-indigo-200 hover:shadow-md"
                >
                  {state === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Submitting…
                    </span>
                  ) : 'Submit Feedback'}
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Your feedback will be analyzed by AI to help prioritize improvements
                </p>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
