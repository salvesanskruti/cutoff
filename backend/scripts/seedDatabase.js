/**
 * Seed MongoDB from CSV files
 * Usage: node scripts/seedDatabase.js
 * 
 * This script reads from the Python backend's data/processed directory
 * and populates MongoDB collections
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import {
  College,
  Prediction,
  CutoffHistory,
  Branch,
  Category,
  SeatType,
  LookupData
} from '../models/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_predictor';
const DATA_DIR = path.join(process.cwd(), '..', 'data', 'processed');

const seedDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    // Clear existing data
    console.log('🗑️  Clearing existing collections...');
    await Promise.all([
      College.deleteMany({}),
      Prediction.deleteMany({}),
      CutoffHistory.deleteMany({}),
      Branch.deleteMany({}),
      Category.deleteMany({}),
      SeatType.deleteMany({}),
      LookupData.deleteMany({})
    ]);

    // Seed predictions (2025)
    console.log('📥 Seeding predictions_2025.csv...');
    await seedPredictions(path.join(DATA_DIR, 'predictions_2025.csv'));

    // Seed historical data
    console.log('📥 Seeding merged_clean.csv (historical data)...');
    await seedCutoffHistory(path.join(DATA_DIR, 'merged_clean.csv'));

    // Create lookup data
    console.log('📥 Creating lookup data...');
    await createLookupData();

    console.log('✅ Database seeding complete!');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

async function seedPredictions(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return resolve();
    }

    const predictions = [];
    const colleges = new Set();
    const branches = new Set();
    const categories = new Set();
    const seatTypes = new Set();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Parse the predicted cutoff, skip if NaN
        const predictedCutoff = parseFloat(row['predicted_2025']);
        if (isNaN(predictedCutoff)) {
          return; // Skip rows with invalid predicted values
        }

        const collegeId = row['College ID'];
        const collegeName = row['College Name'];
        const branchId = row['Branch ID'];
        const branchName = row['Branch Name'];
        const category = row['Category'];
        const seatType = row['Seat Type'];

        // Only add if all required fields exist
        if (collegeId && branchId && category && seatType && collegeName && branchName) {
          predictions.push({
            collegeId: String(collegeId),
            collegeName: collegeName,
            branchId: String(branchId),
            branchName: branchName,
            category: category.trim(),
            seatType: seatType.trim(),
            predictedCutoff: predictedCutoff,
            confidence: 0.98,
            year: 2025
          });

          colleges.add(collegeName);
          branches.add(branchName);  // Use branchName instead of branchId
          categories.add(category.trim());
          seatTypes.add(seatType.trim());
        }
      })
      .on('end', async () => {
        await Prediction.insertMany(predictions);
        
        // Create Branch documents
        const branchDocs = Array.from(branches).map(b => ({
          branchId: b,
          branchName: b
        }));
        await Branch.insertMany(branchDocs);

        // Create Category documents
        const categoryDocs = Array.from(categories).map(c => ({
          categoryType: c,
          displayName: c
        }));
        await Category.insertMany(categoryDocs);

        // Create SeatType documents
        const seatTypeDocs = Array.from(seatTypes).map(s => ({
          seatTypeId: s,
          displayName: s
        }));
        await SeatType.insertMany(seatTypeDocs);

        // Create College documents
        const collegeDocs = Array.from(colleges).map(c => ({
          collegeId: c.toLowerCase().replace(/\s+/g, '_'),
          collegeName: c
        }));
        await College.insertMany(collegeDocs);

        console.log(`  ✓ Seeded ${predictions.length} predictions`);
        resolve();
      })
      .on('error', reject);
  });
}

async function seedCutoffHistory(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return resolve();
    }

    const history = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const year = parseInt(row['Year']);
        const cutoff = parseFloat(row['Score / Percentile']);

        // Only process if year is in range and cutoff is valid
        if (year >= 2022 && year <= 2024 && !isNaN(cutoff)) {
          const collegeId = row['College ID'];
          const branchId = row['Branch ID'];
          const category = row['Category'];
          const seatType = row['Seat Type'];

          // Only add if all required fields exist
          if (collegeId && branchId && category && seatType) {
            history.push({
              collegeId: String(collegeId),
              branchId: String(branchId),
              category: category.trim(),
              seatType: seatType.trim(),
              year,
              cutoff: cutoff
            });
          }
        }
      })
      .on('end', async () => {
        if (history.length > 0) {
          await CutoffHistory.insertMany(history);
          console.log(`  ✓ Seeded ${history.length} historical records`);
        }
        resolve();
      })
      .on('error', reject);
  });
}

async function createLookupData() {
  const branches = await Branch.find({}, 'branchId').lean();
  const categories = await Category.find({}, 'categoryType').lean();
  const seatTypes = await SeatType.find({}, 'seatTypeId').lean();
  const colleges = await College.find({}, 'collegeName').lean();

  await LookupData.create({
    branches: branches.map(b => b.branchId),
    categories: categories.map(c => c.categoryType),
    seatTypes: seatTypes.map(s => s.seatTypeId),
    collegeNames: colleges.map(c => c.collegeName)
  });

  console.log(`  ✓ Created lookup data`);
}

seedDatabase();
