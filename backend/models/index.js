/**
 * MongoDB Schemas for College Predictor
 */

import mongoose from 'mongoose';

// ── College Schema ──────────────────────────────────
const collegeSchema = new mongoose.Schema({
  collegeId: { type: String, required: true, unique: true },
  collegeName: { type: String, required: true },
  state: String,
  city: String,
  type: String, // 'Govt' / 'Private' / 'Deemed'
  branches: [String],
  // New fields for detail page
  nirf_rank: { type: Number, default: null },
  fees_per_year: { type: Number, default: null },         // Annual fees in INR
  avg_placement_package: { type: Number, default: null }, // Average LPA
  highest_placement_package: { type: Number, default: null },
  placement_rate: { type: Number, default: null },        // % placed
  established_year: { type: Number, default: null },
  website: String,
  description: String,
  facilities: [String],
  accreditations: [String],
  location_coordinates: {
    lat: Number,
    lng: Number
  },
  alumni_notable: [String],
  campus_area_acres: Number,
  hostel_available: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ── Prediction Schema (2025 Predictions) ────────────
const predictionSchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  collegeName: { type: String, required: true },
  branchId: { type: String, required: true },
  branchName: { type: String, required: true },
  category: { type: String, required: true },
  seatType: { type: String, required: true },
  predictedCutoff: { type: Number, required: true },
  confidence: { type: Number, default: 0.98 },
  year: { type: Number, default: 2025 },
  createdAt: { type: Date, default: Date.now }
}, { index: { collegeId: 1, branchId: 1, category: 1, seatType: 1 } });

// ── Historical Cutoff Schema (2022-2024) ────────────
const cutoffHistorySchema = new mongoose.Schema({
  collegeId: { type: String, required: true },
  branchId: { type: String, required: true },
  category: { type: String, required: true },
  seatType: { type: String, required: true },
  year: { type: Number, required: true },
  cutoff: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ── Branch Schema ───────────────────────────────────
const branchSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true },
  branchName: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

// ── Category Schema ─────────────────────────────────
const categorySchema = new mongoose.Schema({
  categoryType: { type: String, required: true, unique: true },
  displayName: String,
  createdAt: { type: Date, default: Date.now }
});

// ── Seat Type Schema ────────────────────────────────
const seatTypeSchema = new mongoose.Schema({
  seatTypeId: { type: String, required: true, unique: true },
  displayName: String,
  createdAt: { type: Date, default: Date.now }
});

// ── Lookup Data Schema ─────────────────────────────
const lookupDataSchema = new mongoose.Schema({
  branches: [String],
  categories: [String],
  seatTypes: [String],
  collegeNames: [String],
  lastUpdated: { type: Date, default: Date.now }
});

export const College = mongoose.model('College', collegeSchema);
export const Prediction = mongoose.model('Prediction', predictionSchema);
export const CutoffHistory = mongoose.model('CutoffHistory', cutoffHistorySchema);
export const Branch = mongoose.model('Branch', branchSchema);
export const Category = mongoose.model('Category', categorySchema);
export const SeatType = mongoose.model('SeatType', seatTypeSchema);
export const LookupData = mongoose.model('LookupData', lookupDataSchema);