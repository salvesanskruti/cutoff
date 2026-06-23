import { useState, useRef } from 'react';

export default function PredictionForm({ onSubmit, loading, filters }) {
  const [formData, setFormData] = useState({
    score: '',
    category: '',
    seatType: '',
    branchNames: [],   // stores branch *names* (strings) — matches what backend queries
    includeReach: true,
    topN: 50,
  });

  const [branchSearch, setBranchSearch] = useState('');
  const [showBranchPool, setShowBranchPool] = useState(false);
  const [formError, setFormError] = useState('');

  // Track whether pointer is inside the dropdown so blur doesn't close it prematurely
  const poolMouseDown = useRef(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormError('');
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle by branch *name* (what the backend expects in branchName: { $in: [...] })
  const handleBranchToggle = (branchName) => {
    setFormData((prev) => ({
      ...prev,
      branchNames: prev.branchNames.includes(branchName)
        ? prev.branchNames.filter((b) => b !== branchName)
        : [...prev.branchNames, branchName],
    }));
  };

  const handleRemoveBranch = (branchName) => {
    setFormData((prev) => ({
      ...prev,
      branchNames: prev.branchNames.filter((b) => b !== branchName),
    }));
  };

  const handleToggleChange = (e) => {
    setFormData((prev) => ({ ...prev, includeReach: e.target.checked }));
  };

  const handleRangeChange = (e) => {
    setFormData((prev) => ({ ...prev, topN: parseInt(e.target.value) }));
  };

  const filteredBranches = (filters.branches || [])
    .filter((b) => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
    .slice(0, 30);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.score || !formData.category || !formData.seatType) {
      setFormError('Please fill in score, category, and seat type.');
      return;
    }

    const numericScore = parseFloat(formData.score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      setFormError('Score must be between 0 and 100.');
      return;
    }

    onSubmit({ ...formData, score: numericScore });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Top row: Score / Category / Seat Type ── */}
      <div className="f3">
        <div>
          <label className="flbl">Your Percentile Score</label>
          <div className="sf">
            <input
              type="number"
              name="score"
              value={formData.score}
              onChange={handleInputChange}
              placeholder="95"
              min="0"
              max="100"
              step="0.01"
              required
            />
            <span className="su">%ile</span>
          </div>
        </div>

        <div>
          <label className="flbl">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category...</option>
            {(filters.categories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flbl">Seat Type</label>
          <select
            name="seatType"
            value={formData.seatType}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Seat Type...</option>
            {(filters.seatTypes || []).map((seat) => (
              <option key={seat.id} value={seat.id}>
                {seat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Branch Filter ── */}
      <div className="bwrap">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '7px',
          }}
        >
          <label className="flbl" style={{ marginBottom: 0 }}>
            Branch / Program
            <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: '6px' }}>
              (optional — {filters.branches?.length ?? 0} available)
            </span>
          </label>
          {formData.branchNames.length > 0 && (
            <button
              type="button"
              style={{
                color: 'var(--amber2)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                fontSize: '11px',
                fontWeight: 700,
                padding: 0,
              }}
              onClick={() => setFormData((prev) => ({ ...prev, branchNames: [] }))}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search box — blur only closes pool if pointer left the pool */}
        <input
          type="text"
          className="bsrch"
          placeholder="Search branches… e.g., Computer, Mechanical, AI"
          value={branchSearch}
          onChange={(e) => setBranchSearch(e.target.value)}
          onFocus={() => setShowBranchPool(true)}
          onBlur={() => {
            // If mousedown fired inside pool, keep it open
            if (!poolMouseDown.current) setShowBranchPool(false);
            poolMouseDown.current = false;
          }}
        />

        {showBranchPool && (
          <div
            className="bpool"
            // Set flag on mousedown so the blur handler above knows not to close
            onMouseDown={() => { poolMouseDown.current = true; }}
          >
            {filteredBranches.length > 0 ? (
              filteredBranches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  className={`bchip ${formData.branchNames.includes(branch.name) ? 'on' : ''}`}
                  // Use branch.name — this is what the backend filters on
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur firing first
                    handleBranchToggle(branch.name);
                  }}
                >
                  {branch.name}
                </button>
              ))
            ) : (
              <div style={{ padding: '10px', color: 'var(--text3)', fontSize: '12px' }}>
                {branchSearch ? 'No branches match your search' : 'Type to search branches'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Selected Branch Tags ── */}
      {formData.branchNames.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div
            className="flbl"
            style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}
          >
            <span>Selected Branches ({formData.branchNames.length})</span>
          </div>
          <div className="stags">
            {formData.branchNames.map((name) => (
              <div key={name} className="stag">
                {name.length > 28 ? name.slice(0, 28) + '…' : name}
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: 0,
                    marginLeft: '4px',
                  }}
                  onClick={() => handleRemoveBranch(name)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="ctrl-row">
        <label className="tl">
          <div className="tog">
            <input
              type="checkbox"
              checked={formData.includeReach}
              onChange={handleToggleChange}
            />
            <div className="tok"></div>
          </div>
          Include Reach Colleges
        </label>

        <div className="tnw">
          <label>Show Top</label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={formData.topN}
            onChange={handleRangeChange}
          />
          <span className="tnval">{formData.topN}</span>
        </div>
      </div>

      {/* ── Error + Submit ── */}
      {formError && (
        <div className="errbox" style={{ marginBottom: '12px' }}>
          {formError}
        </div>
      )}

      <button
        type="submit"
        className={`pbtn ${loading ? 'loading' : ''}`}
        disabled={loading}
      >
        <span className="pbtn-in">
          <span className="pt">{loading ? 'Predicting…' : '⚡ Get My Colleges'}</span>
          <div className="ps"></div>
        </span>
      </button>
    </form>
  );
}