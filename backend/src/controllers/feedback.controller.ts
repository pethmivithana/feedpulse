import { Request, Response } from 'express';
import { Feedback, IFeedback } from '../models/feedback.model';
import { analyzeWithGemini, generateWeeklySummary } from '../services/gemini.service';

const sanitizeString = (str: unknown): string => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/<[^>]*>/g, '').substring(0, 5000);
};

// POST /api/feedback
export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;

    // Input sanitization
    const sanitized = {
      title: sanitizeString(title),
      description: sanitizeString(description),
      category: sanitizeString(category),
      submitterName: submitterName ? sanitizeString(submitterName) : undefined,
      submitterEmail: submitterEmail ? sanitizeString(submitterEmail) : undefined,
    };

    if (!sanitized.title || sanitized.title.length < 1) {
      res.status(400).json({ success: false, error: 'Validation Error', message: 'Title is required' });
      return;
    }

    if (!sanitized.description || sanitized.description.length < 20) {
      res.status(400).json({ success: false, error: 'Validation Error', message: 'Description must be at least 20 characters' });
      return;
    }

    const validCategories = ['Bug', 'Feature Request', 'Improvement', 'Other'];
    if (!validCategories.includes(sanitized.category)) {
      res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid category' });
      return;
    }

    // Create feedback document
    const feedback = await Feedback.create(sanitized);

    // Run AI analysis asynchronously — don't block response
    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully! AI analysis is in progress.',
    });

    // Run Gemini in background after response
    try {
      const analysis = await analyzeWithGemini(feedback.title, feedback.description);
      if (analysis) {
        await Feedback.findByIdAndUpdate(feedback._id, {
          ai_category: analysis.category,
          ai_sentiment: analysis.sentiment,
          ai_priority: analysis.priority_score,
          ai_summary: analysis.summary,
          ai_tags: analysis.tags,
          ai_processed: true,
        });
        console.log(`✅ AI analysis complete for feedback: ${feedback._id}`);
      } else {
        console.warn(`⚠️  AI analysis failed for feedback: ${feedback._id} — saved without AI data`);
      }
    } catch (aiError) {
      console.error('AI analysis error (non-critical):', aiError);
      // Feedback is already saved — AI failure is non-blocking
    }

  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; errors?: Record<string, { message: string }> };
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map((e) => e.message).join(', ');
      res.status(400).json({ success: false, error: 'Validation Error', message: messages });
    } else {
      res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to create feedback' });
    }
  }
};

// GET /api/feedback
export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ai_summary: { $regex: search, $options: 'i' } },
      ];
    }

    const validSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      priority: 'ai_priority',
      sentiment: 'ai_sentiment',
    };
    const sortField = validSortFields[sortBy as string] || 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Feedback.find(filter).sort({ [sortField]: order }).skip(skip).limit(limitNum).lean(),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      message: 'Feedback retrieved successfully',
    });
  } catch {
    res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to retrieve feedback' });
  }
};

// GET /api/feedback/summary
export const getAISummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentFeedback = await Feedback.find({ createdAt: { $gte: sevenDaysAgo } }).lean();

    if (recentFeedback.length === 0) {
      res.json({
        success: true,
        data: { summary: 'No feedback received in the last 7 days.' },
        message: 'No recent feedback to summarize',
      });
      return;
    }

    const summary = await generateWeeklySummary(recentFeedback);

    res.json({
      success: true,
      data: { summary, feedbackCount: recentFeedback.length },
      message: 'Summary generated successfully',
    });
  } catch {
    res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to generate summary' });
  }
};

// GET /api/feedback/stats
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, openItems, avgPriorityResult, tagResult] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: { $in: ['New', 'In Review'] } }),
      Feedback.aggregate([
        { $match: { ai_priority: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$ai_priority' } } },
      ]),
      Feedback.aggregate([
        { $unwind: '$ai_tags' },
        { $group: { _id: '$ai_tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total,
        openItems,
        avgPriority: avgPriorityResult[0]?.avg ? Math.round(avgPriorityResult[0].avg * 10) / 10 : 0,
        topTag: tagResult[0]?._id || 'N/A',
      },
      message: 'Stats retrieved successfully',
    });
  } catch {
    res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to retrieve stats' });
  }
};

// GET /api/feedback/:id
export const getFeedbackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findById(req.params.id).lean();
    if (!feedback) {
      res.status(404).json({ success: false, error: 'Not Found', message: 'Feedback not found' });
      return;
    }
    res.json({ success: true, data: feedback, message: 'Feedback retrieved successfully' });
  } catch {
    res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to retrieve feedback' });
  }
};

// PATCH /api/feedback/:id
export const updateFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'In Review', 'Resolved'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid status value' });
      return;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!feedback) {
      res.status(404).json({ success: false, error: 'Not Found', message: 'Feedback not found' });
      return;
    }

    res.json({ success: true, data: feedback, message: 'Status updated successfully' });
  } catch {
    res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to update feedback' });
  }
};

// POST /api/feedback/:id/reanalyze
export const reanalyze = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      res.status(404).json({ success: false, error: 'Not Found', message: 'Feedback not found' });
      return;
    }

    const analysis = await analyzeWithGemini(feedback.title, feedback.description);
    if (!analysis) {
      res.status(500).json({ success: false, error: 'AI Error', message: 'Gemini analysis failed' });
      return;
    }

    const updated = await Feedback.findByIdAndUpdate(
      feedback._id,
      {
        ai_category: analysis.category,
        ai_sentiment: analysis.sentiment,
        ai_priority: analysis.priority_score,
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_processed: true,
      },
      { new: true }
    ).lean();

    res.json({ success: true, data: updated, message: 'Re-analysis complete' });
  } catch {
    res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to re-analyze feedback' });
  }
};

// DELETE /api/feedback/:id
export const deleteFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id).lean();
    if (!feedback) {
      res.status(404).json({ success: false, error: 'Not Found', message: 'Feedback not found' });
      return;
    }
    res.json({ success: true, data: null, message: 'Feedback deleted successfully' });
  } catch {
    res.status(500).json({ success: false, error: 'Server Error', message: 'Failed to delete feedback' });
  }
};
