import { useNavigate } from 'react-router-dom';

/**
 * CompareBar
 * Sticky bottom bar that appears when 1+ colleges are selected for comparison.
 * Props:
 *   selected: Array<{ collegeId, collegeName, branchName }> (max 4)
 *   onRemove: (collegeId) => void
 *   onClear: () => void
 */
export default function CompareBar({ selected, onRemove, onClear }) {
  const navigate = useNavigate();

  if (!selected || selected.length === 0) return null;

  const canCompare = selected.length >= 2;

  const handleCompare = () => {
    const ids = selected.map(c => c.collegeId).join(',');
    navigate(`/compare?ids=${ids}`);
  };

  return (
    <div className="compare-bar">
      <div className="compare-bar-inner">
        <div className="compare-bar-colleges">
          {selected.map((college) => (
            <div key={college.collegeId} className="compare-chip">
              <span className="compare-chip-name">{college.collegeName}</span>
              <button
                className="compare-chip-remove"
                onClick={() => onRemove(college.collegeId)}
                aria-label={`Remove ${college.collegeName}`}
              >
                ×
              </button>
            </div>
          ))}
          {selected.length < 4 && (
            <div className="compare-chip-empty">
              <span>+ Add {4 - selected.length} more</span>
            </div>
          )}
        </div>

        <div className="compare-bar-actions">
          <span className="compare-bar-count">
            {selected.length}/4 selected
          </span>
          <button className="compare-bar-clear" onClick={onClear}>
            Clear
          </button>
          <button
            className={`compare-bar-btn ${canCompare ? 'active' : 'disabled'}`}
            disabled={!canCompare}
            onClick={handleCompare}
          >
            Compare Now →
          </button>
        </div>
      </div>
    </div>
  );
}