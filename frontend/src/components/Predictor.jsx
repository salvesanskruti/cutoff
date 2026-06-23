import { useState, useEffect } from 'react';
import { predictService, filterService } from '../services/api';
import PredictionForm from './PredictionForm';
import CollegeResults from './CollegeResults';

export default function Predictor() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    branches: [],
    categories: [],
    seatTypes: [],
  });
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);

  // ── Load filter options on mount ──────────────────────
  useEffect(() => {
    const loadFilters = async () => {
      setFiltersLoading(true);
      setFiltersError(null);
      try {
        const [branchRes, catRes, seatRes] = await Promise.all([
          filterService.getBranches(),
          filterService.getCategories(),
          filterService.getSeatTypes(),
        ]);

        setFilters({
          // branches: [{ id, name }]
          branches: (branchRes.data?.branches || []).map((b) => ({
            id: b.id ?? b.name,
            name: b.name,
          })),
          // categories: [{ id, name }]
          categories: catRes.data?.categories || [],
          // seatTypes: [{ id, name }]
          seatTypes: seatRes.data?.seatTypes || [],
        });
      } catch (err) {
        console.error('Failed to load filters:', err.message);
        setFiltersError(err.message);
        // Hard-coded fallback so the form is still usable
        setFilters({
          branches: [],
          categories: [
            { id: 'GOPENS', name: 'GOPENS — General Open' },
            { id: 'GOPENHS', name: 'GOPENHS — Home State Open' },
            { id: 'LOBCS', name: 'LOBCS — OBC' },
            { id: 'GSCS', name: 'GSCS — SC' },
            { id: 'GSTS', name: 'GSTS — ST' },
            { id: 'GEWS', name: 'GEWS — EWS' },
          ],
          seatTypes: [
            { id: 'State Level', name: 'State Level' },
            { id: 'Home University', name: 'Home University' },
            { id: 'Other University', name: 'Other University' },
          ],
        });
      } finally {
        setFiltersLoading(false);
      }
    };

    loadFilters();
  }, []);

  // ── Handle prediction submit ──────────────────────────
  const handlePredict = async (formData) => {
    setLoading(true);
    setError(null);
    setResults(null);

    const payload = {
      score: formData.score,
      category: formData.category,
      seatType: formData.seatType,
      branchNames: formData.branchNames,   // array of branch name strings
      includeReach: formData.includeReach,
      topN: formData.topN,
    };

    console.log('📤 Sending prediction payload:', payload);

    try {
      const response = await predictService.predictColleges(
        payload.score,
        payload.category,
        payload.seatType,
        payload.branchNames,
        payload.includeReach,
        payload.topN
      );

      console.log('📥 Prediction response:', response.data);

      if (!response.data?.colleges) {
        setError('Unexpected response from server. Check the console for details.');
        return;
      }

      setResults(response.data);
    } catch (err) {
      console.error('❌ Prediction error:', err.message);
      setError(err.message || 'Failed to get predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle college expand click ───────────────────────
  const handleCollegeClick = async (collegeId) => {
    if (!collegeId) return;
    // History fetch is fire-and-forget; CollegeResults handles its own expansion
    console.log('College clicked:', collegeId);
  };

  // ── Render ────────────────────────────────────────────
  return (
    <section className="sec" id="predictor" style={{ paddingTop: '40px' }}>
      <div className="wrap">
        <div className="s-head ru" style={{ marginBottom: '36px' }}>
          <div className="s-tag">College Predictor</div>
          <div className="s-title">Find your colleges now</div>
          <p className="s-sub">No signup. No waiting. Results in under a second.</p>
        </div>

        {/* Filter load error — non-fatal, form still works with fallback */}
        {filtersError && (
          <div
            className="errbox"
            style={{ marginBottom: '20px', fontSize: '12px' }}
          >
            ⚠️ Could not load filters from server ({filtersError}). Using defaults.
          </div>
        )}

        <div className="pcard ru">
          {filtersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
              <div className="ps" style={{ display: 'block', margin: '0 auto 12px' }}></div>
              Loading filters…
            </div>
          ) : (
            <PredictionForm
              onSubmit={handlePredict}
              loading={loading}
              filters={filters}
            />
          )}
        </div>

        {/* Prediction error */}
        {error && (
          <div className="errbox" style={{ marginTop: '24px' }}>
            ❌ {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <CollegeResults
            results={results}
            onCollegeClick={handleCollegeClick}
          />
        )}

        {/* Empty state — prediction ran but 0 results */}
        {results && results.colleges?.length === 0 && (
          <div className="empty" style={{ marginTop: '32px' }}>
            <div className="eico">🔍</div>
            <p>
              No colleges found for your score and filters.
              <br />
              Try removing branch filters or enabling "Include Reach Colleges".
            </p>
          </div>
        )}
      </div>
    </section>
  );
}