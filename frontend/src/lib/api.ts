const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message: string;
}

export interface FeedbackItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListData {
  items: FeedbackItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StatsData {
  total: number;
  openItems: number;
  avgPriority: number;
  topTag: string;
}

export async function submitFeedback(data: {
  title: string;
  description: string;
  category: string;
  submitterName?: string;
  submitterEmail?: string;
}): Promise<ApiResponse<FeedbackItem>> {
  const res = await fetch(`${API_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(email: string, password: string): Promise<ApiResponse<{ token: string; email: string }>> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getFeedback(
  token: string,
  params: {
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ApiResponse<FeedbackListData>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.set(k, String(v)); });

  const res = await fetch(`${API_URL}/api/feedback?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateFeedbackStatus(
  token: string,
  id: string,
  status: string
): Promise<ApiResponse<FeedbackItem>> {
  const res = await fetch(`${API_URL}/api/feedback/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function deleteFeedbackItem(token: string, id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${API_URL}/api/feedback/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getStats(token: string): Promise<ApiResponse<StatsData>> {
  const res = await fetch(`${API_URL}/api/feedback/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getAISummary(token: string): Promise<ApiResponse<{ summary: string; feedbackCount: number }>> {
  const res = await fetch(`${API_URL}/api/feedback/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function reanalyzeFeedback(token: string, id: string): Promise<ApiResponse<FeedbackItem>> {
  const res = await fetch(`${API_URL}/api/feedback/${id}/reanalyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
