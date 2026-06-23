import { useState } from 'react';

// Opens the college's official website.
// Falls back to a Google search if no website is stored in the data.
function openCollegeWebsite(college) {
  const name = college.collegeName ?? college.college_name ?? '';
  const website =
    college.website ??
    college.websiteUrl ??
    college.website_url ??
    college.url ??
    null;

  if (website) {
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    const query = encodeURIComponent(`${name} official website`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  }
}

const CollegeResults = ({ results, onCollegeClick, compareSelected = [], onToggleCompare }) => {
  const [expandedColleges, setExpandedColleges] = useState(new Set());
  const [filterChance, setFilterChance] = useState(null);

  const getChanceLabel = (college) =>
    typeof college.chance === 'string' ? college.chance : (college.chance?.label || '').toLowerCase();

  const getChanceDescription = (college) =>
    college.description || college.chance?.desc || 'Prediction generated from historical cutoff trends.';

  const getCollegeId = (college) => college.collegeId ?? college.college_id;
  const getPredictedCutoff = (college) => college.predictedCutoff ?? college.predicted_cutoff_2025 ?? 0;
  const getGap = (college, userScore) => {
    if (college.gap !== undefined && college.gap !== null) return Number(college.gap);
    return Number(userScore) - Number(getPredictedCutoff(college));
  };

  const toggleExpand = (idx) => {
    const s = new Set(expandedColleges);
    s.has(idx) ? s.delete(idx) : s.add(idx);
    setExpandedColleges(s);
  };

  const colleges = results.colleges || [];
  const userScore = results.userScore ?? results.user_score;
  const filteredColleges = filterChance
    ? colleges.filter(c => getChanceLabel(c) === filterChance)
    : colleges;

  const chanceCounts = {
    safe:     colleges.filter(c => getChanceLabel(c) === 'safe').length,
    moderate: colleges.filter(c => getChanceLabel(c) === 'moderate').length,
    reach:    colleges.filter(c => getChanceLabel(c) === 'reach').length,
    unlikely: colleges.filter(c => getChanceLabel(c) === 'unlikely').length,
  };

  const isCompareSelected = (id) => compareSelected.some(c => c.collegeId === id);
  const compareDisabled = (id) => !isCompareSelected(id) && compareSelected.length >= 4;

  return (
    <div style={{ marginTop: '52px' }} className="ru in">

      {/* Summary stats */}
      <div className="sgrid">
        <div className="sbox t"><div className="sv">{results.total}</div><div className="sl">Total Matches</div></div>
        <div className="sbox s"><div className="sv">{chanceCounts.safe}</div><div className="sl">Safe</div></div>
        <div className="sbox m"><div className="sv">{chanceCounts.moderate}</div><div className="sl">Moderate</div></div>
        <div className="sbox r"><div className="sv">{chanceCounts.reach}</div><div className="sl">Reach</div></div>
      </div>

      {/* Header + filters */}
      <div className="rbar">
        <div className="rtitle">
          Your Colleges <span>for {results.category} {results.seatType}</span>
        </div>
        <div className="spills">
          {[null, 'safe', 'moderate', 'reach'].map((filter) => (
            <button
              key={filter ?? 'all'}
              className={`spl ${filterChance === filter ? 'on' : ''}`}
              onClick={() => setFilterChance(filter)}
            >
              {filter
                ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} (${chanceCounts[filter]})`
                : `All (${results.total ?? colleges.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* College cards */}
      {filteredColleges.length > 0 ? (
        <div className="clist">
          {filteredColleges.map((college, idx) => {
            const cId = getCollegeId(college);
            const selected = isCompareSelected(cId);
            const disabled = compareDisabled(cId);
            const websiteStored = college.website ?? college.websiteUrl ?? college.website_url ?? college.url;

            return (
              <div
                key={`${cId}-${idx}`}
                className={`cc ${getChanceLabel(college)} ${expandedColleges.has(idx) ? 'open' : ''} ${selected ? 'cc-comparing' : ''}`}
              >
                {/* Top row — expands card */}
                <div
                  className="cc-top"
                  onClick={() => {
                    toggleExpand(idx);
                    if (onCollegeClick) onCollegeClick(cId);
                  }}
                >
                  <div>
                    <div className="cc-name">{college.collegeName ?? college.college_name}</div>
                    <div className="cc-metas">
                      <div className="mt br">{college.branchName ?? college.branch_name}</div>
                      <div className="mt">{college.category}</div>
                    </div>
                  </div>
                  <div className="cc-right">
                    <div className="cc-co">{Number(getPredictedCutoff(college)).toFixed(2)}</div>
                    <div className="cc-col">2025 Cutoff</div>
                    <div className={`cbdg ${getChanceLabel(college)}`}>
                      {getChanceLabel(college).charAt(0).toUpperCase() + getChanceLabel(college).slice(1)}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="cc-actions">
                  {onToggleCompare && (
                    <button
                      className={`cc-compare-btn ${selected ? 'active' : ''} ${disabled ? 'cc-compare-disabled' : ''}`}
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) onToggleCompare({
                          collegeId: cId,
                          collegeName: college.collegeName ?? college.college_name,
                          branchName: college.branchName ?? college.branch_name,
                        });
                      }}
                      title={disabled ? 'Max 4 colleges' : selected ? 'Remove from compare' : 'Add to compare'}
                    >
                      {selected ? '✓ Comparing' : '+ Compare'}
                    </button>
                  )}

                  <button
                    className="cc-profile-btn cc-website-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCollegeWebsite(college);
                    }}
                    title={websiteStored ? `Open ${websiteStored}` : 'Search on Google'}
                  >
                    {websiteStored ? '🌐 Visit Website' : '🔍 Search Website'}
                  </button>
                </div>

                {/* Expanded details */}
                <div className="cc-det">
                  <div className="grow">
                    <div>Your Score: <strong>{userScore}%ile</strong></div>
                    <div>
                      Gap:{' '}
                      <strong style={{ color: getGap(college, userScore) >= 0 ? '#10b981' : '#ef4444' }}>
                        {getGap(college, userScore) >= 0 ? '+' : ''}{getGap(college, userScore).toFixed(2)}%ile
                      </strong>
                    </div>
                  </div>
                  <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text2)' }}>
                    {getChanceDescription(college)}
                  </p>
                  {/* Clickable URL shown when expanded */}
                  <button
                    onClick={() => openCollegeWebsite(college)}
                    style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--acc)', fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    {websiteStored || 'Search official website →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <div className="eico">📭</div>
          <p>No colleges found with these filters.</p>
        </div>
      )}
    </div>
  );
}