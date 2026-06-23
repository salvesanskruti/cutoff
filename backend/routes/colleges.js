/**
 * College Routes
 * GET /api/colleges                    - Get all colleges
 * GET /api/colleges/compare            - Compare multiple colleges by IDs
 * GET /api/colleges/:collegeId         - Get full college detail/profile
 * GET /api/colleges/:collegeId/history - Get cutoff history
 */

import express from 'express';
import { College, CutoffHistory, Prediction } from '../models/index.js';

const router = express.Router();

/**
 * GET /api/colleges
 * Get all colleges with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const colleges = await College.find({})
      .select('collegeId collegeName state type nirf_rank fees_per_year avg_placement_package')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await College.countDocuments();

    res.json({ page, limit, total, pages: Math.ceil(total / limit), colleges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/colleges/compare?ids=id1,id2,id3
 * Returns full details for 2–4 colleges for side-by-side comparison.
 * Also includes recent cutoff history for each college.
 */
router.get('/compare', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'ids query param is required' });

    const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
    if (idList.length < 2) return res.status(400).json({ error: 'At least 2 college IDs required' });
    if (idList.length > 4) return res.status(400).json({ error: 'Maximum 4 colleges can be compared' });

    const colleges = await College.find({ collegeId: { $in: idList } }).lean();

    if (!colleges.length) return res.status(404).json({ error: 'No colleges found for given IDs' });

    // Preserve the requested order
    const orderedColleges = idList
      .map(id => colleges.find(c => c.collegeId === id))
      .filter(Boolean);

    // Fetch 2025 predictions for each college (all branches)
    const predictions = await Prediction.find({ collegeId: { $in: idList } })
      .sort({ predictedCutoff: -1 })
      .lean();

    // Attach predictions to each college
    const result = orderedColleges.map(college => {
      const collegePreds = predictions.filter(p => p.collegeId === college.collegeId);
      // Aggregate cutoff stats
      const cutoffs = collegePreds.map(p => p.predictedCutoff).filter(Boolean);
      return {
        ...college,
        predictions: collegePreds.slice(0, 10), // top 10 branch predictions
        topCutoff: cutoffs.length ? Math.max(...cutoffs) : null,
        avgCutoff: cutoffs.length
          ? parseFloat((cutoffs.reduce((a, b) => a + b, 0) / cutoffs.length).toFixed(2))
          : null,
        branchCount: [...new Set(collegePreds.map(p => p.branchId))].length
      };
    });

    res.json({ count: result.length, colleges: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/colleges/:collegeId
 * Full college profile including placements, infrastructure, etc.
 */
router.get('/:collegeId', async (req, res) => {
  try {
    const college = await College.findOne({ collegeId: req.params.collegeId }).lean();
    if (!college) return res.status(404).json({ error: 'College not found' });

    // Get cutoff history (last 3 years, grouped)
    const history = await CutoffHistory.find({ collegeId: req.params.collegeId })
      .sort({ year: 1 })
      .lean();

    const grouped = {};
    history.forEach(h => {
      const key = `${h.branchId}_${h.category}_${h.seatType}`;
      if (!grouped[key]) {
        grouped[key] = { branchId: h.branchId, category: h.category, seatType: h.seatType, years: [] };
      }
      grouped[key].years.push({ year: h.year, cutoff: h.cutoff });
    });

    // Get 2025 predictions for this college
    const predictions = await Prediction.find({ collegeId: req.params.collegeId })
      .sort({ predictedCutoff: -1 })
      .lean();

    res.json({
      ...college,
      cutoffHistory: Object.values(grouped),
      predictions2025: predictions,
      totalBranches: [...new Set(predictions.map(p => p.branchId))].length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/colleges/:collegeId/history
 * Get cutoff history for specific college (2022–2024)
 */
router.get('/:collegeId/history', async (req, res) => {
  try {
    const history = await CutoffHistory.find({ collegeId: req.params.collegeId })
      .sort({ year: 1 })
      .lean();

    if (!history.length) return res.status(404).json({ error: 'No history found for this college' });

    const grouped = {};
    history.forEach(h => {
      const key = `${h.branchId}_${h.category}_${h.seatType}`;
      if (!grouped[key]) {
        grouped[key] = { branchId: h.branchId, category: h.category, seatType: h.seatType, years: [] };
      }
      grouped[key].years.push({ year: h.year, cutoff: h.cutoff });
    });

    res.json({ collegeId: req.params.collegeId, history: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;