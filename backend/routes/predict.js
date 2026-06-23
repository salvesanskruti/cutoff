/**
 * Predict Routes
 * POST /api/predict/colleges - Get college predictions
 * POST /api/predict/chances  - Check chances for specific college
 */

import express from 'express';
import axios from 'axios';
import { Prediction, College } from '../models/index.js';

const router = express.Router();

/**
 * POST /api/predict/colleges
 * Get ranked list of colleges for user's score
 */
router.post('/colleges', async (req, res) => {
  try {
    const { score, category, seatType, branchNames = [], includeReach = true, topN = 50 } = req.body;

    // Validate input
    if (!score || !category || !seatType) {
      return res.status(400).json({
        error: 'Missing required fields: score, category, seatType'
      });
    }

    // Query predictions from MongoDB
    let query = {
      category,
      seatType
    };

    // Filter by branches if provided
    if (branchNames.length > 0) {
      query.branchName = { $in: branchNames };
    }

    const predictions = await Prediction.find(query).lean();

    // Classify chances for each prediction
    const resultsWithChances = predictions.map(pred => {
      const gap = score - pred.predictedCutoff;
      let chance;
      if (gap >= 5) {
        chance = { label: 'safe', color: '#10b981', desc: 'Very likely to get admission' };
      } else if (gap >= 0) {
        chance = { label: 'moderate', color: '#f59e0b', desc: 'Good chance of getting admission' };
      } else if (gap >= -3) {
        chance = { label: 'reach', color: '#3b82f6', desc: 'Below cutoff - small chance' };
      } else {
        chance = { label: 'unlikely', color: '#ef4444', desc: 'Well below cutoff' };
      }

      return {
        collegeId: pred.collegeId,
        collegeName: pred.collegeName,
        branchId: pred.branchId,
        branchName: pred.branchName,
        predictedCutoff: pred.predictedCutoff,
        chance: chance.label,
        gap: gap.toFixed(2),
        description: chance.desc,
        color: chance.color
      };
    });

    // Filter by reach if requested
    let filtered = resultsWithChances;
    if (!includeReach) {
      filtered = resultsWithChances.filter(r => r.chance !== 'reach' && r.chance !== 'unlikely');
    }

    // Sort by chance priority, then by gap (descending)
    const chancePriority = { safe: 0, moderate: 1, reach: 2, unlikely: 3 };
    const sorted = filtered.sort((a, b) => {
      if (chancePriority[a.chance] !== chancePriority[b.chance]) {
        return chancePriority[a.chance] - chancePriority[b.chance];
      }
      return parseFloat(b.gap) - parseFloat(a.gap);
    });

    res.json({
      total: sorted.length,
      userScore: score,
      category,
      seatType,
      colleges: sorted.slice(0, topN)
    });

  } catch (error) {
    console.error('Error in /colleges:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/predict/chances
 * Check admission chances for specific college + branch
 */
router.post('/chances', async (req, res) => {
  try {
    const { collegeId, branchId, category, seatType, score } = req.body;

    if (!collegeId || !branchId || !category || !seatType || !score) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Find specific prediction
    const prediction = await Prediction.findOne({
      collegeId,
      branchId,
      category,
      seatType
    }).populate('collegeId', 'collegeName');

    if (!prediction) {
      return res.status(404).json({
        error: `No prediction found for college ${collegeId}, branch ${branchId}`
      });
    }

    const chance = classifyChance(score, prediction.predictedCutoff);

    res.json({
      collegeName: prediction.collegeName || 'Unknown',
      branchName: branchId,
      predictedCutoff: prediction.predictedCutoff,
      userScore: score,
      chance: chance.label,
      margin: (score - prediction.predictedCutoff).toFixed(2),
      description: chance.desc,
      color: chance.color
    });

  } catch (error) {
    console.error('Error in /chances:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Classify admission chance based on score vs cutoff
 */
function classifyChance(userScore, predictedCutoff) {
  const margin = userScore - predictedCutoff;

  if (margin >= 3) {
    return { label: 'safe', color: 'green', desc: 'Your score is well above cutoff' };
  } else if (margin >= -3) {
    return { label: 'moderate', color: 'yellow', desc: 'Your score is close to cutoff' };
  } else if (margin >= -8) {
    return { label: 'reach', color: 'orange', desc: 'Your score is slightly below cutoff' };
  } else {
    return { label: 'unlikely', color: 'red', desc: 'Your score is significantly below cutoff' };
  }
}

export default router;
