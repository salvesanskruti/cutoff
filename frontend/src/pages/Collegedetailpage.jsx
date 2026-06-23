import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCollegeDetail } from '../services/api';

export default function CollegeDetailPage() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    getCollegeDetail(collegeId)
      .then(data => { setCollege(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [collegeId]);

  if (loading) return (
    <div className="detail-page detail-loading">
      <div className="spinner"></div>
      <p>Loading college profile…</p>
    </div>
  );

  if (error || !college) return (
    <div className="detail-page detail-error">
      <p>⚠ {error || 'College not found'}</p>
      <button onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  const TABS = ['overview', 'placements', 'cutoffs', 'infrastructure', 'location'];

  return (
    <div className="detail-page">
      {/* Hero Header */}
      <div className="detail-hero">
        <div className="detail-hero-inner">
          <button className="detail-back" onClick={() => navigate(-1)}>← Back</button>
          <div className="detail-hero-body">
            <div className="detail-college-avatar">
              {college.collegeName.charAt(0)}
            </div>
            <div className="detail-hero-info">
              <h1 className="detail-name">{college.collegeName}</h1>
              <div className="detail-meta-row">
                {college.type && <span className="detail-badge type">{college.type}</span>}
                {college.state && <span className="detail-badge location">📍 {college.city || college.state}</span>}
                {college.established_year && (
                  <span className="detail-badge year">Est. {college.established_year}</span>
                )}
                {college.nirf_rank && (
                  <span className="detail-badge nirf">NIRF #{college.nirf_rank}</span>
                )}
              </div>
              {college.accreditations?.length > 0 && (
                <div className="detail-accred-row">
                  {college.accreditations.map(a => (
                    <span key={a} className="detail-accred">{a}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="detail-stats-strip">
        <StatCard label="NIRF Rank" value={college.nirf_rank ? `#${college.nirf_rank}` : '—'} />
        <StatCard label="Fees/Year" value={college.fees_per_year ? `₹${Number(college.fees_per_year).toLocaleString('en-IN')}` : '—'} />
        <StatCard label="Avg Package" value={college.avg_placement_package ? `${college.avg_placement_package} LPA` : '—'} />
        <StatCard label="Placement Rate" value={college.placement_rate ? `${college.placement_rate}%` : '—'} />
        <StatCard label="Branches" value={college.totalBranches ?? '—'} />
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`detail-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="detail-content">
        {activeTab === 'overview' && <OverviewTab college={college} />}
        {activeTab === 'placements' && <PlacementsTab college={college} />}
        {activeTab === 'cutoffs' && <CutoffsTab college={college} />}
        {activeTab === 'infrastructure' && <InfraTab college={college} />}
        {activeTab === 'location' && <LocationTab college={college} />}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="detail-stat-card">
      <div className="detail-stat-value">{value}</div>
      <div className="detail-stat-label">{label}</div>
    </div>
  );
}

function OverviewTab({ college }) {
  return (
    <div className="detail-section">
      {college.description && (
        <p className="detail-description">{college.description}</p>
      )}

      <div className="detail-grid-2">
        <div className="detail-card">
          <h3>Quick Facts</h3>
          <table className="detail-facts-table">
            <tbody>
              {[
                ['Type', college.type],
                ['State', college.state],
                ['City', college.city],
                ['Established', college.established_year],
                ['Campus Area', college.campus_area_acres ? `${college.campus_area_acres} acres` : null],
                ['Hostel', college.hostel_available === true ? 'Available' : college.hostel_available === false ? 'Not Available' : null],
                ['Website', college.website ? (
                  <a href={college.website} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--acc)' }}>
                    {college.website}
                  </a>
                ) : null],
              ].filter(([, v]) => v != null).map(([k, v]) => (
                <tr key={k}>
                  <td className="fact-key">{k}</td>
                  <td className="fact-val">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {college.alumni_notable?.length > 0 && (
          <div className="detail-card">
            <h3>Notable Alumni</h3>
            <ul className="detail-alumni-list">
              {college.alumni_notable.map(a => (
                <li key={a} className="detail-alumni-item">
                  <span className="alumni-dot"></span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Branches */}
      {college.branches?.length > 0 && (
        <div className="detail-card" style={{ marginTop: 20 }}>
          <h3>Available Branches ({college.branches.length})</h3>
          <div className="detail-branch-grid">
            {college.branches.map(b => (
              <div key={b} className="detail-branch-pill">{b}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlacementsTab({ college }) {
  return (
    <div className="detail-section">
      <div className="detail-placement-hero">
        <div className="placement-stat-big">
          <div className="psb-value">{college.avg_placement_package ? `${college.avg_placement_package} LPA` : '—'}</div>
          <div className="psb-label">Average Package</div>
        </div>
        <div className="placement-stat-big">
          <div className="psb-value">{college.highest_placement_package ? `${college.highest_placement_package} LPA` : '—'}</div>
          <div className="psb-label">Highest Package</div>
        </div>
        <div className="placement-stat-big">
          <div className="psb-value">{college.placement_rate ? `${college.placement_rate}%` : '—'}</div>
          <div className="psb-label">Placement Rate</div>
        </div>
      </div>

      {/* Bar chart comparing avg vs highest */}
      {college.avg_placement_package && college.highest_placement_package && (
        <div className="detail-card" style={{ marginTop: 20 }}>
          <h3>Package Comparison</h3>
          <PlacementBarChart avg={college.avg_placement_package} high={college.highest_placement_package} />
        </div>
      )}

      <div className="detail-note">
        Placement data is sourced from NIRF submissions and official college records.
        Individual results may vary by branch and year.
      </div>
    </div>
  );
}

function PlacementBarChart({ avg, high }) {
  const maxVal = Math.max(avg, high) * 1.2;
  const bars = [
    { label: 'Average', value: avg, color: 'var(--acc)' },
    { label: 'Highest', value: high, color: '#10b981' },
  ];
  return (
    <div className="placement-chart">
      {bars.map(b => (
        <div key={b.label} className="placement-bar-row">
          <div className="pbar-label">{b.label}</div>
          <div className="pbar-track">
            <div
              className="pbar-fill"
              style={{ width: `${(b.value / maxVal) * 100}%`, background: b.color }}
            />
          </div>
          <div className="pbar-val">{b.value} LPA</div>
        </div>
      ))}
    </div>
  );
}

function CutoffsTab({ college }) {
  const [selectedBranch, setSelectedBranch] = useState('');
  const history = college.cutoffHistory || [];
  const predictions = college.predictions2025 || [];

  const branches = [...new Set(history.map(h => h.branchId))];

  const filtered = selectedBranch
    ? history.filter(h => h.branchId === selectedBranch)
    : history.slice(0, 8);

  return (
    <div className="detail-section">
      {/* 2025 Predictions */}
      <div className="detail-card">
        <h3>2025 Predicted Cutoffs</h3>
        {predictions.length > 0 ? (
          <div className="cutoff-table-wrap">
            <table className="cutoff-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Category</th>
                  <th>Seat Type</th>
                  <th>Predicted Cutoff</th>
                </tr>
              </thead>
              <tbody>
                {predictions.slice(0, 15).map((p, i) => (
                  <tr key={i}>
                    <td>{p.branchName}</td>
                    <td><span className="cat-pill">{p.category}</span></td>
                    <td>{p.seatType}</td>
                    <td className="cutoff-val">{Number(p.predictedCutoff).toFixed(2)} %ile</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="detail-empty">No predictions available.</p>}
      </div>

      {/* Historical Cutoffs */}
      {history.length > 0 && (
        <div className="detail-card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>Historical Cutoffs (2022–2024)</h3>
            {branches.length > 1 && (
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="cutoff-branch-select"
              >
                <option value="">All Branches</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
          </div>
          <div className="cutoff-table-wrap">
            <table className="cutoff-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Category</th>
                  <th>Seat Type</th>
                  {[2022, 2023, 2024].map(y => <th key={y}>{y}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h, i) => (
                  <tr key={i}>
                    <td>{h.branchId}</td>
                    <td><span className="cat-pill">{h.category}</span></td>
                    <td>{h.seatType}</td>
                    {[2022, 2023, 2024].map(y => {
                      const yr = h.years?.find(x => x.year === y);
                      return <td key={y} className="cutoff-val">{yr ? yr.cutoff.toFixed(2) : '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InfraTab({ college }) {
  return (
    <div className="detail-section">
      <div className="detail-grid-2">
        {college.facilities?.length > 0 && (
          <div className="detail-card">
            <h3>Facilities</h3>
            <ul className="detail-facility-list">
              {college.facilities.map(f => (
                <li key={f} className="detail-facility-item">
                  <span className="facility-dot"></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="detail-card">
          <h3>Campus Details</h3>
          <table className="detail-facts-table">
            <tbody>
              {[
                ['Area', college.campus_area_acres ? `${college.campus_area_acres} acres` : null],
                ['Hostel', college.hostel_available === true ? 'Available' : college.hostel_available === false ? 'Not Available' : null],
                ['Total Branches', college.totalBranches],
              ].filter(([, v]) => v != null).map(([k, v]) => (
                <tr key={k}>
                  <td className="fact-key">{k}</td>
                  <td className="fact-val">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!college.facilities?.length && !college.campus_area_acres && (
        <p className="detail-empty">Infrastructure data not yet available for this college.</p>
      )}
    </div>
  );
}

function LocationTab({ college }) {
  const { lat, lng } = college.location_coordinates || {};
  const hasCoords = lat && lng;

  return (
    <div className="detail-section">
      <div className="detail-card">
        <h3>Location</h3>
        <table className="detail-facts-table" style={{ marginBottom: 20 }}>
          <tbody>
            {[
              ['City', college.city],
              ['State', college.state],
              ['Coordinates', hasCoords ? `${lat}, ${lng}` : null],
            ].filter(([, v]) => v != null).map(([k, v]) => (
              <tr key={k}><td className="fact-key">{k}</td><td className="fact-val">{v}</td></tr>
            ))}
          </tbody>
        </table>

        {hasCoords ? (
          <div className="detail-map-embed">
            <iframe
              title={`Map of ${college.collegeName}`}
              width="100%"
              height="300"
              style={{ border: 'none', borderRadius: 8 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lng}`}
            />
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--acc)', marginTop: 8, display: 'inline-block' }}
            >
              View larger map →
            </a>
          </div>
        ) : (
          <div className="detail-map-placeholder">
            <div className="map-placeholder-icon">📍</div>
            <p>Map not available — coordinates not yet added for this college.</p>
            {college.state && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(college.collegeName + ', ' + (college.city || college.state))}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--acc)', fontSize: 13 }}
              >
                Search on Google Maps →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}