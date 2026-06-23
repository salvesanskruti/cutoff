/**
 * Filter Routes
 * GET /api/filters/branches
 * GET /api/filters/categories
 * GET /api/filters/seat-types
 * GET /api/filters/college-names
 */

import express from 'express';
import { LookupData, Branch, Category, SeatType } from '../models/index.js';

const router = express.Router();

/**
 * GET /api/filters/branches
 */
router.get('/branches', async (req, res) => {
  try {
    const branches = await Branch.find({}, 'branchName -_id').lean();
    res.json({ branches: branches.map(b => ({ id: b.branchName, name: b.branchName })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/filters/categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({}, 'categoryType displayName -_id').lean();
    res.json({ categories: categories.map(c => ({ id: c.categoryType, name: c.displayName })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/filters/seat-types
 */
router.get('/seat-types', async (req, res) => {
  try {
    const seatTypes = await SeatType.find({}, 'seatTypeId displayName -_id').lean();
    res.json({ seatTypes: seatTypes.map(s => ({ id: s.seatTypeId, name: s.displayName })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/filters/college-names
 */
router.get('/college-names', async (req, res) => {
  try {
    const lookup = await LookupData.findOne({}, 'collegeNames -_id').lean();
    res.json({ collegeNames: lookup?.collegeNames || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
